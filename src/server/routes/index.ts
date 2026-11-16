import { Router } from 'express';
import { healthRouter } from './healthRoutes.ts';
import { securityRouter } from './securityRoutes.ts';
import { githubRouter } from './githubRoutes.ts';
import { reportsRouter } from './reportsRoutes.ts';
import { backupsRouter } from './backupsRoutes.ts';
import { integrationsRouter } from './integrationsRoutes.ts';
import { escrowRouter } from './escrowRoutes.ts';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/security', securityRouter);
apiRouter.use('/github', githubRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/backups', backupsRouter);
apiRouter.use('/integrations', integrationsRouter);
apiRouter.use('/escrow', escrowRouter);
