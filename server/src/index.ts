import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import './utils/firebaseAdmin.js';
import authRoutes from './routes/authRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import heroRoutes from './routes/heroRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import { escalateUnansweredRequests } from './services/escalation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Request logger
app.use((req, res, next) => {
  console.log(`[API ${req.method}] ${req.path}`);
  next();
});

// Middleware - allow any localhost origin
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for certificates
app.use('/certificates', express.static(path.join(__dirname, '../data/certificates')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LifePulse API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/heroes', heroRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', requestRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'LifePulse API v1 — ready' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LifePulse API running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// A lightweight scheduler for the JSON-backed pilot implementation.
setInterval(() => {
  try { escalateUnansweredRequests(); }
  catch (error) { console.error('[Escalation]', error); }
}, 30_000).unref();

export default app;
