import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';

/**
 * Middleware de compressão Brotli.
 *
 * Se o cliente aceitar `br` (Accept-Encoding), comprime a resposta com Brotli
 * (menor taxa de compressão que Gzip). Para métodos POST/PUT (uploads, que
 * não são comprimidos por padrão no compression) e respostas pequenas, o
 * middleware simplesmente repassa a resposta.
 *
 * Coloque este middleware ANTES do `compression`: ele define Content-Encoding: br
 * quando aplicável, e o `compression` (que respeita o encoding já definido)
 * cuida do restante das respostas com Gzip.
 */
const MIN_SIZE = 1024; // Só comprime payloads > 1 KB

export function brotliCompression(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Só ativa para GET (listagens/detalhes são os payloads pesados)
  if (req.method !== 'GET') {
    return next();
  }

  const acceptEncoding = req.headers['accept-encoding'] || '';

  if (!acceptEncoding.includes('br')) {
    return next();
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function (body: any): Response {
    const payload = Buffer.isBuffer(body)
      ? body
      : Buffer.from(JSON.stringify(body), 'utf-8');

    if (payload.length < MIN_SIZE) {
      return originalJson(body);
    }

    try {
      // 🔥 CORREÇÃO (R3): compressão ASSÍNCRONA.
      // brotliCompressSync bloqueia o event loop por dezenas de ms em payloads
      // grandes, derrubando o throughput global sob concorrência. A versão com
      // callback roda no pool de threads do zlib.
      zlib.brotliCompress(payload, (err, compressed) => {
        if (err || compressed.length >= payload.length) {
          // Fallback: envia sem compressão (quando comprimir não compensa)
          originalJson(body);
          return;
        }
        res.setHeader('Content-Encoding', 'br');
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        originalSend(compressed);
      });
    } catch {
      // Fallback: envia sem compressão
      return originalJson(body);
    }
    // 🔥 R3: a resposta em si é enviada no callback (async), mas o Express
    // espera que res.json retorne a Response sincronamente.
    return res;
  };

  return next();
}
