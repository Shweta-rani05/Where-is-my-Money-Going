import mongoose from 'mongoose';

/**
 * Establishes a connection to the MongoDB database.
 * Listens to connection lifecycle events to log database state transitions.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/where_is_my_money_going';

    // Event handlers for database connection lifecycle
    mongoose.connection.on('connected', () => {
      console.log('[Database] MongoDB connection established successfully');
    });

    mongoose.connection.on('error', (error) => {
      console.error(`[Database] MongoDB connection error occurred: ${error}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection disconnected');
    });

    // Handle application termination cleanly (close DB connection)
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed due to app termination');
      process.exit(0);
    });

    await mongoose.connect(mongoURI);
  } catch (error) {
    console.error(`[Database] Initial connection to MongoDB failed: ${error}`);
    process.exit(1); // Fail fast in production
  }
};
