import type http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import { config } from '../config.ts';
import { logger } from '../logger.ts';
import { authorizeProjectRoomAccess } from '../repositories/firestoreRoomRepository.ts';
import { verifyFirebaseIdToken } from '../services/firebaseAuthService.ts';

interface WsClientMeta {
  ws: WebSocket;
  userId: string;
  userName: string;
  roomId: string;
  idToken: string;
  isAlive: boolean;
  lastActivityAt: number;
  msgCount: number;
  msgWindowStart: number;
}

const WS_MAX_MSGS_PER_WINDOW = 30;
const WS_RATE_WINDOW_MS = 10_000;
const WS_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

const WsInboundMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('room:join'),
    roomId: z.string().trim().min(1).max(128),
    userName: z.string().trim().max(80).optional(),
  }),
  z.object({
    type: z.literal('chat:typing'),
  }),
  z.object({
    type: z.literal('notification:emit'),
    title: z.string().trim().min(1).max(140),
    category: z.string().trim().max(40).optional(),
  }),
]);

function isAllowedWsOrigin(req: http.IncomingMessage): boolean {
  const originHeader = req.headers.origin;
  if (!originHeader) {
    return true;
  }
  if (config.allowedOrigins.includes(originHeader)) {
    return true;
  }
  const hostHeader = req.headers.host;
  try {
    const parsed = new URL(originHeader);
    if (hostHeader && parsed.host === hostHeader) {
      return true;
    }
    if (
      config.nodeEnv !== 'production' &&
      (parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.endsWith('.run.app') ||
        parsed.hostname.endsWith('.aistudio.google.com'))
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function attachWebSocketServer(server: http.Server): WebSocketServer {
  const wsClients = new Map<WebSocket, WsClientMeta>();
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 8 * 1024,
  });

  function broadcastToRoom(roomId: string, payload: Record<string, unknown>) {
    const messageStr = JSON.stringify(payload);
    for (const client of wsClients.values()) {
      if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  }

  function broadcastPresence(roomId: string) {
    if (!roomId) return;
    const activeUsers: Array<{ userId: string; userName: string }> = [];
    const seen = new Set<string>();
    for (const client of wsClients.values()) {
      if (client.roomId === roomId && !seen.has(client.userId)) {
        seen.add(client.userId);
        activeUsers.push({ userId: client.userId, userName: client.userName });
      }
    }
    broadcastToRoom(roomId, {
      type: 'presence:list',
      roomId,
      users: activeUsers,
    });
  }

  const wsHeartbeatInterval = setInterval(() => {
    const now = Date.now();
    for (const [ws, meta] of wsClients.entries()) {
      if (!meta.isAlive) {
        wsClients.delete(ws);
        ws.terminate();
        if (meta.roomId) broadcastPresence(meta.roomId);
        continue;
      }
      if (now - meta.lastActivityAt > WS_IDLE_TIMEOUT_MS) {
        wsClients.delete(ws);
        ws.close(4408, 'Conexão encerrada por inatividade.');
        if (meta.roomId) broadcastPresence(meta.roomId);
        continue;
      }
      meta.isAlive = false;
      ws.ping();
    }
  }, 30_000);

  wss.on('close', () => {
    clearInterval(wsHeartbeatInterval);
  });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    if (!isAllowedWsOrigin(req)) {
      logger.warn(
        { origin: req.headers.origin },
        'Rejected WebSocket handshake from disallowed origin'
      );
      ws.close(4403, 'Origem WebSocket não autorizada.');
      return;
    }

    const reqUrl = new URL(req.url || '/', 'http://localhost');
    const token = reqUrl.searchParams.get('token')?.trim() || '';

    if (!token) {
      ws.close(4401, 'Autenticação obrigatória no WebSocket.');
      return;
    }

    let closed = false;
    const authPromise = verifyFirebaseIdToken(token).then((verification) => {
      if (closed) return null;
      if (!verification.ok) {
        logger.warn({ code: verification.code }, 'WebSocket token rejected');
        ws.close(4401, verification.error);
        return null;
      }

      const meta: WsClientMeta = {
        ws,
        userId: verification.identity.uid,
        userName: verification.identity.displayName?.slice(0, 80) || 'Usuário',
        roomId: '',
        idToken: token,
        isAlive: true,
        lastActivityAt: Date.now(),
        msgCount: 0,
        msgWindowStart: Date.now(),
      };
      wsClients.set(ws, meta);
      return meta;
    });

    ws.on('pong', () => {
      const meta = wsClients.get(ws);
      if (meta) meta.isAlive = true;
    });

    ws.on('message', async (raw: Buffer) => {
      const meta = (await authPromise) || wsClients.get(ws);
      if (!meta || closed) return;

      const now = Date.now();
      meta.lastActivityAt = now;
      meta.isAlive = true;

      if (now - meta.msgWindowStart > WS_RATE_WINDOW_MS) {
        meta.msgWindowStart = now;
        meta.msgCount = 0;
      }
      meta.msgCount += 1;
      if (meta.msgCount > WS_MAX_MSGS_PER_WINDOW) {
        logger.warn(
          { roomId: meta.roomId },
          'WebSocket per-connection rate limit exceeded'
        );
        ws.close(4429, 'Limite de mensagens por conexão excedido.');
        return;
      }

      try {
        const rawJson = JSON.parse(raw.toString()) as unknown;
        const parsed = WsInboundMessageSchema.safeParse(rawJson);
        if (!parsed.success) return;

        const data = parsed.data;
        if (data.type === 'room:join') {
          const allowed = await authorizeProjectRoomAccess(
            meta.idToken,
            meta.userId,
            data.roomId
          );
          if (!allowed) {
            ws.send(
              JSON.stringify({
                type: 'error',
                code: 'WS_FORBIDDEN',
                message: 'Acesso negado à sala deste projeto.',
              })
            );
            return;
          }

          const previousRoom = meta.roomId;
          meta.roomId = data.roomId;
          if (data.userName) {
            meta.userName = data.userName || meta.userName;
          }
          if (previousRoom && previousRoom !== data.roomId) {
            broadcastPresence(previousRoom);
          }
          broadcastPresence(data.roomId);
        } else if (data.type === 'chat:typing' && meta.roomId) {
          broadcastToRoom(meta.roomId, {
            type: 'chat:typing',
            userId: meta.userId,
            userName: meta.userName,
          });
        } else if (data.type === 'notification:emit' && meta.roomId) {
          broadcastToRoom(meta.roomId, {
            type: 'notification:received',
            id: `notif_${Date.now()}`,
            title: data.title,
            category: data.category || 'project',
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        // Ignore malformed WS frames
      }
    });

    ws.on('close', () => {
      closed = true;
      const meta = wsClients.get(ws);
      if (meta) {
        wsClients.delete(ws);
        if (meta.roomId) broadcastPresence(meta.roomId);
      }
    });
  });

  return wss;
}
