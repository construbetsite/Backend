// src/middleware/cors.ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',
  'https://gestor-blog-construbet.netlify.app',
  'https://construbet-ofertas.netlify.app/blog',
  
];


export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error(`🚫 CORS bloqueado para: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // ✅ ADICIONE O HEADER AQUI
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Frontend-Env',  // ← ADICIONADO!
  ],
  credentials: true,
  maxAge: 86400, // 24 horas
});