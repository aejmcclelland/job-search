// src/server.mjs
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { searchRoutes } from './routes/searchRoutes.mjs';
import { refineRoutes } from './routes/refineRoutes.mjs';
const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use('/api/search', searchRoutes);
app.use('/api/refine', refineRoutes);

// Silence favicon requests (avoid CSP warning noise in the browser)
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// If Next.js runs on http://localhost:3000
app.use(cors({ origin: ['http://localhost:3000'], credentials: false }));

app.listen(PORT, () => {
	console.log(`🚀 JobSearch API running on http://localhost:${PORT}`);
});
