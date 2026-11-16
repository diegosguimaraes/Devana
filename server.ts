import http from 'node:http';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import { config, ROOT_DIR } from './src/server/config.ts';
import { createApp } from './src/server/app.ts';
import { logger } from './src/server/logger.ts';
import { attachWebSocketServer } from './src/server/ws/wsServer.ts';

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  attachWebSocketServer(server);

  if (config.nodeEnv !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(ROOT_DIR, 'dist');
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        maxAge: '1y',
        immutable: true,
        etag: true,
      })
    );
    app.use(
      '/src/assets/images',
      express.static(path.join(distPath, 'src/assets/images'), {
        maxAge: '30d',
        etag: true,
      })
    );
    app.use(
      express.static(distPath, {
        index: false,
        maxAge: '1h',
      })
    );
    app.get('*', (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(config.port, '0.0.0.0', () => {
    logger.info(
      {
        port: config.port,
        env: config.nodeEnv,
        strictFrameDeny: config.strictFrameDeny,
      },
      'Devana server listening'
    );
  });
}

startServer();
