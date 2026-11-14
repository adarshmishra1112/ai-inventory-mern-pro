import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.14',
      },
    });
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected Successfully (In-Memory)');

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Database connection error:', error);
  }
};

startServer();