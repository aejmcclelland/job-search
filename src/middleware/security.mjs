
// src/middleware/security.mjs
// Central place to apply security-related middleware to the Express app
// so your server.mjs stays small and declarative.

import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

function parseOrigins(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Apply security & cross‑cutting middleware.
 *
 * Env variables supported (optional):
 * - CORS_ORIGINS: comma‑separated list of allowed origins (e.g. "http://localhost:3000,https://myapp.com")
 * - TRUST_PROXY: set to '1' when behind a proxy/load balancer (Heroku, Render, Vercel, Nginx, Cloudflare)
 *
 * @param {import('express').Express} app
 * @param {{
 *   corsOrigins?: string|string[],
 *   allowCredentials?: boolean,
 *   trustProxy?: boolean,
 *   enableCSP?: boolean,
 * }} options
 */
export function applySecurity(app, options = {}) {
  const {
    corsOrigins = process.env.CORS_ORIGINS,
    allowCredentials = false,
    trustProxy = process.env.TRUST_PROXY === '1',
    // For this project the backend is API‑only; CSP is unnecessary and can
    // cause noise (e.g., favicon warnings). Keep it off by default.
    enableCSP = false,
  } = options;

  // If deployed behind a proxy, this ensures req.ip and secure cookies work correctly.
  if (trustProxy) app.set('trust proxy', 1);

  // Remove the X‑Powered‑By header
  app.disable('x-powered-by');

  // Helmet: sensible defaults for an API server
  // CSP is disabled by default here; turn it on if you later serve HTML from this app.
  app.use(
    helmet({
      contentSecurityPolicy: enableCSP ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS: allow your Next.js dev origin by setting CORS_ORIGINS or pass in options
  const origins = parseOrigins(corsOrigins);
  app.use(
    cors({
      origin: origins.length ? origins : true, // true reflects the incoming Origin
      credentials: Boolean(allowCredentials),
    })
  );

  // Gzip/deflate responses (JSON & CSV)
  app.use(compression());
}