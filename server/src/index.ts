import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables IMMEDIATELY
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

import { connectDB } from './config/db';
import apiRouter from './routes';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const port = process.env.PORT || 5000;

// Connect to database
connectDB();

// Security and utility middleware configuration
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(mongoSanitize());

// Mount API routes
app.use('/api', apiRouter);

// Fallback handlers for unhandled routes and uncaught middleware exceptions
app.use(notFound);
app.use(errorHandler);

// Start listening
app.listen(port, () => {
  console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});
