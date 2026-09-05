import express from "express";
import compression from "compression";
import { env } from "./config/env";
import { brotliCompression } from "./middleware/brotli.middleware";
import { corsMiddleware } from "./middleware/cors";
import authRoutes from "./routes/auth.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import productUploadRoutes
  from './modules/product/routes/productUploadRoutes';
import blogPostRoutes from "./modules/blog/routes/blogPost.routes";
import blogCategoriaRoutes from "./modules/blog/routes/blogCategoria.routes";
import blogUploadRoutes from "./modules/blog/routes/blogUpload.routes";
import productRoutes from "../src/modules/product/routes/productRoutes"
import productCategoryRoutes from "../src/modules/product/routes/productCategoryRoutes"
import landingCategoryRoutes from "./modules/landing/routes/landingCategory.routes";
import landingSliderRoutes from "./modules/landing/routes/landingSlider.routes";
import landingUploadRoutes from "./modules/landing/routes/landingUpload.routes";
import leadRoutes from "./modules/leads/routes/lead.routes";
import { payloadScanner } from "./lib/payloadStats";

const app = express();


app.use(corsMiddleware);

// ============================================================
// Tarefa 1 — PAYLOAD SCANNER (diagnóstico)
// → Intercepta TODAS as respostas e mede tamanho/tempo/aninhados
// → Liga em dev por padrão; desligue com PAYLOAD_SCAN=0 em produção
// → Relatório: reports/payload-report.json + console (log por env)
// ============================================================
if (process.env.PAYLOAD_SCAN !== '0') {
  app.use(payloadScanner);
}

// ============================================================
// COMPRESSÃO (Brotli primeiro, Gzip como fallback)
// → Comprime apenas respostas acima de 1 KB
// ============================================================
app.use(brotliCompression);
app.use(compression({ threshold: 1024, level: 6 })); // ✅ Gzip (payloads > 1KB)

// ============================================================
// PARSING DO CORPO DA REQUISIÇÃO (obrigatório ANTES das rotas)
// → Sem isto, req.body é undefined e todo POST/PUT retorna erro
// ============================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API funcionando" });
});
app.use('/api/product', productRoutes);
app.use(
  '/api/product-categories',
  productCategoryRoutes
);
app.use
("/api/product/upload", productUploadRoutes); // ✅ CORRIGIDO: /upload em vez de /posts/upload

// Rotas públicas
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);

app.use("/api/blog/posts", blogPostRoutes);
app.use("/api/blog/upload", blogUploadRoutes); // ✅ CORRIGIDO: /upload em vez de /posts/upload
app.use("/api/blog/categorias", blogCategoriaRoutes);

// ============================================================
// MÓDULO: LANDING PAGE — CATEGORIAS
// ============================================================
app.use(
  "/api/landing-categories/upload",
  landingUploadRoutes
);
app.use(
  "/api/landing-categories",
  landingCategoryRoutes
);

// ✅ SLIDER PÚBLICO — GET /api/landing/categories
app.use(
  "/api/landing/categories",
  landingSliderRoutes
);

// ============================================================
// MÓDULO: LEADS — NEWSLETTER (PÚBLICO)
// POST /api/leads
// ============================================================
app.use("/api/leads", leadRoutes);


const server = app.listen(env.PORT, () => {
  console.log("🚀 Servidor rodando na porta", env.PORT);
});


// Tratamento de erro de porta
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Porta ${env.PORT} já está em uso. Tente outra porta.`);
    process.exit(1);
  } else {
    console.error("Erro no servidor:", error);
    process.exit(1);
  }
});

