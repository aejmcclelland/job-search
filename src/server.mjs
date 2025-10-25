// src/server.mjs
import 'dotenv/config';
import express from 'express';
import { applySecurity } from './middleware/security.mjs';
import { searchRoutes } from './routes/searchRoutes.mjs';
import { refineRoutes } from './routes/refineRoutes.mjs';

const app = express();
const PORT = process.env.PORT || 4000;

// Apply security middleware (Helmet, CORS, compression)
applySecurity(app, {
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  allowCredentials: false,
  trustProxy: process.env.TRUST_PROXY === '1',
  enableCSP: false,
});

// JSON body parser
app.use(express.json({ limit: '1mb' }));

// Silence favicon requests (avoid CSP warning noise in the browser)
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/refine', refineRoutes);

app.listen(PORT, () => {
	console.log(`🚀 JobSearch API running on http://localhost:${PORT}`);
});
