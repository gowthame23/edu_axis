import mongoose from 'mongoose';
import { configureMongoQueryProfiler } from './queryProfiler.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      monitorCommands: true
    });

    configureMongoQueryProfiler(conn.connection);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
