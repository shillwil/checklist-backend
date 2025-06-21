import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import checklistRoutes from './routes/checklist';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
console.log('Registering auth routes at /api/auth');
app.use('/api/auth', authRoutes);
console.log('Registering checklist routes at /api/checklist');
app.use('/api/checklist', checklistRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});