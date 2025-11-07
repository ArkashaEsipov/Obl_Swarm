import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const API_URL = process.env.API_URL || "http://api:8081";

// Проксирование API запросов
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // убираем /api при проксировании
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Проксирование запроса:', req.method, req.url, '->', proxyReq.path);
  },
  onError: (err, req, res) => {
    console.error('Ошибка прокси:', err);
    res.status(500).send('Ошибка сервера');
  }
}));

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
    console.log(`Frontend запущен на http://localhost:${PORT}`);
    console.log(`API проксируется на: ${API_URL}`);
});