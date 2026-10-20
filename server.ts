import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  // Basic security and parsing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request logger for API calls
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount API router
  app.use('/api', apiRouter);

  if (!isProd) {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log(`[LazyFlow AI] Vite middleware mounted in development mode.`);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`[LazyFlow AI] Serving static production build from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🦥 LazyFlow AI Server running at http://0.0.0.0:${PORT}`);
    console.log(`   "You relax. Your AI handles the boring stuff."`);
    console.log(`   Hacktoberfest 2026: Slow and Steady`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[LazyFlow AI] Server startup error:', err);
  process.exit(1);
});
