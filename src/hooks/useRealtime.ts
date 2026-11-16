import { useCallback, useEffect, useRef, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ActiveUserProfileData } from '../types/domain';

export interface LiveNotification {
  id: string;
  title: string;
  category: string;
  timestamp: string;
}

export type AlertCategory = 'bid' | 'message' | 'escrow' | 'commit';

interface UseRealtimeOptions {
  currentUser: ActiveUserProfileData | null;
  firebaseUser: FirebaseUser | null;
  selectedProjectId: string;
}

export function useRealtime({
  currentUser,
  firebaseUser,
  selectedProjectId,
}: UseRealtimeOptions) {
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [notifyOnBid, setNotifyOnBid] = useState<boolean>(true);
  const [notifyOnMessage, setNotifyOnMessage] = useState<boolean>(true);
  const [notifyOnEscrow, setNotifyOnEscrow] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);

  const [roomUsers, setRoomUsers] = useState<Array<{ userId: string; userName: string }>>(
    []
  );
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setNotifications([]);
      setRoomUsers([]);
      setTypingUser(null);
    }
  }, [firebaseUser]);

  const currentUid = currentUser?.uid ?? null;
  const currentDisplayName = currentUser?.displayName ?? '';

  // Authenticated WebSocket Connection (Verified Firebase ID Token Handshake)
  useEffect(() => {
    if (
      !currentUid ||
      !firebaseUser ||
      !firebaseUser.emailVerified ||
      !selectedProjectId
    ) {
      return;
    }

    let cancelled = false;
    let activeWs: WebSocket | null = null;

    firebaseUser
      .getIdToken()
      .then((idToken) => {
        if (cancelled) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(idToken)}`;
        const ws = new WebSocket(wsUrl);
        activeWs = ws;
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: 'room:join',
              roomId: selectedProjectId,
              userName: currentDisplayName,
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'presence:list' && Array.isArray(data.users)) {
              setRoomUsers(data.users);
            } else if (data.type === 'chat:typing' && data.userId !== currentUid) {
              setTypingUser(String(data.userName || 'Colega'));
              if (typingTimeoutRef.current !== null) {
                window.clearTimeout(typingTimeoutRef.current);
              }
              typingTimeoutRef.current = window.setTimeout(() => {
                setTypingUser(null);
                typingTimeoutRef.current = null;
              }, 2200);
            } else if (data.type === 'notification:received' && pushEnabled) {
              setNotifications((prev) => {
                if (prev.some((n) => n.id === data.id)) return prev;
                return [
                  {
                    id: String(data.id),
                    title: String(data.title),
                    category: String(data.category || 'project'),
                    timestamp: String(data.timestamp || new Date().toISOString()),
                  },
                  ...prev.slice(0, 14),
                ];
              });
            }
          } catch {
            // Ignore invalid WS messages
          }
        };
      })
      .catch(() => {
        // Ignore token fetch errors
      });

    return () => {
      cancelled = true;
      if (typingTimeoutRef.current !== null) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (activeWs) {
        activeWs.close();
      }
      wsRef.current = null;
    };
  }, [selectedProjectId, currentUid, currentDisplayName, firebaseUser, pushEnabled]);

  const pushAlert = useCallback(
    (title: string, category: AlertCategory) => {
      if (!pushEnabled) return;
      if (category === 'bid' && !notifyOnBid) return;
      if (category === 'message' && !notifyOnMessage) return;
      if (category === 'escrow' && !notifyOnEscrow) return;

      const newAlert: LiveNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        category,
        timestamp: new Date().toISOString(),
      };
      setNotifications((prev) => [newAlert, ...prev.slice(0, 14)]);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'notification:emit',
            roomId: selectedProjectId,
            title,
            category,
          })
        );
      }

      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('Devana Workroom — Atualização', { body: title });
      }
    },
    [notifyOnBid, notifyOnEscrow, notifyOnMessage, pushEnabled, selectedProjectId]
  );

  const emitTyping = useCallback(() => {
    if (
      !currentUser ||
      !selectedProjectId ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    wsRef.current.send(
      JSON.stringify({
        type: 'chat:typing',
        roomId: selectedProjectId,
        userId: currentUser.uid,
        userName: currentUser.displayName,
      })
    );
  }, [currentUser, selectedProjectId]);

  return {
    roomUsers,
    typingUser,
    notifications,
    setNotifications,
    pushEnabled,
    setPushEnabled,
    notifyOnBid,
    setNotifyOnBid,
    notifyOnMessage,
    setNotifyOnMessage,
    notifyOnEscrow,
    setNotifyOnEscrow,
    pushAlert,
    emitTyping,
  };
}
