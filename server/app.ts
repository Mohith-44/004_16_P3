import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.ts';
import reportRoutes from './routes/reportRoutes.ts';
import handlerRoutes from './routes/handlerRoutes.ts';
import departmentRoutes from './routes/departmentRoutes.ts';
import routingRoutes from './routes/routingRoutes.ts';
import analyticsRoutes from './routes/analyticsRoutes.ts';
import notificationRoutes from './routes/notificationRoutes.ts';
import { errorHandler } from './middleware/errorHandler.ts';

export function createApiApp(dbReady?: Promise<void>) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      service: 'Hospital Ward Alert Dispatcher API',
      timestamp: new Date().toISOString(),
    });
  });

  if (dbReady) {
    app.use('/api', async (req, _res, next) => {
      if (req.path === '/health') {
        next();
        return;
      }
      try {
        await dbReady;
        next();
      } catch (err) {
        next(err);
      }
    });
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/handlers', handlerRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/routing', routingRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use('/api/*', (_req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found.' });
  });

  app.use(errorHandler);

  return app;
}
