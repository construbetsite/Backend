import express from "express";
import { env } from "./config/env";
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

const app = express();


app.use(corsMiddleware);
app.use(express.json());



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

