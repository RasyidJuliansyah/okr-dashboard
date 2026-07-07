import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import objectiveRoutes from './routes/objective.routes';
import keyResultRoutes from './routes/keyresult.routes';
import dashboardRoutes from './routes/dashboard.routes';
import bscRoutes from './routes/bsc.routes';
import causalRoutes from './routes/causal.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/api/key-results', keyResultRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bsc', bscRoutes);
app.use('/api', causalRoutes);

// Base route for sanity check
app.get('/', (req, res) => {
  res.json({ message: 'OKR & Balanced Scorecard API is running.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
