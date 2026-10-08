import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT || '5000', 10);
const app = createApp();
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[OpsFlow Server] Listening on http://0.0.0.0:${PORT} (${process.env.NODE_ENV || 'development'})`);
});