import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(process.env.UPLOADS_PATH || path.join(process.cwd(), 'uploads')));

import authRoutes from './routes/auth';
import appointmentsRoutes from './routes/appointments';
import specialistsRoutes from './routes/specialists';
import eventsRoutes from './routes/events';
import resourcesRoutes from './routes/resources';
import usersRoutes from './routes/users';
import statsRoutes from './routes/stats';

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/specialists', specialistsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
