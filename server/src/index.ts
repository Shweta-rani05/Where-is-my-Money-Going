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
  origin: [
    'http://localhost:5173', 
    'https://where-is-my-money-going.vercel.app',
    process.env.CORS_ORIGIN || ''
  ].filter(Boolean),
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(mongoSanitize());

// Health check
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Where Is My Money Going API is running 🚀',
    status: 'OK',
    version: '1.0.0'
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Fallback handlers
app.use(notFound);
app.use(errorHandler);

// Start listening
app.listen(port, () => {
  console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});

// Trigger nodemon restart 2