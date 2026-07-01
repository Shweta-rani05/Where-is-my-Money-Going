import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Service health status check. Evaluates connection state with MongoDB.
 * @access  Public
 */
router.get('/', (req: Request, res: Response) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const connectionState = mongoose.connection.readyState;
  const dbStatus = dbStates[connectionState] || 'unknown';

  res.status(200).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    env: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      readyState: connectionState
    }
  });
});

export default router;
