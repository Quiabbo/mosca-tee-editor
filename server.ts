import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 301 Redirects
  const redirects: Record<string, string> = {
    '/remover-fundo-foto-cabelo': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-roupa': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-modelo': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-retrato': '/remover-fundo-imagem-gratis',
    '/remover-fundo-assinatura': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-carteira': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-pessoa': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-produto-loja': '/remover-fundo-imagem-gratis',
    '/remover-fundo-jpg': '/remover-fundo-imagem-gratis',
    '/remover-fundo-png': '/remover-fundo-imagem-gratis',
    '/remover-fundo-webp': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-imovel': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-carro': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-comida': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-moda': '/remover-fundo-imagem-gratis',
    '/remover-fundo-foto-pet': '/remover-fundo-imagem-gratis',
    '/pdf-gratis': '/ferramentas-pdf-gratis'
  };

  Object.entries(redirects).forEach(([oldPath, newPath]) => {
    app.get(oldPath, (req, res) => {
      res.redirect(301, newPath);
    });
  });

  // Proxy route for downloads to bypass CORS
  app.get("/api/proxy-download", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).send("URL is required");
    
    try {
      console.log(`Proxying download: ${targetUrl}`);
      const response = await axios({
        method: 'get',
        url: targetUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': 'https://designerbrasil.com.br/',
        },
        timeout: 30000,
        maxRedirects: 5
      });
      
      if (response.status !== 200) {
        console.error(`Target server returned status ${response.status}`);
        return res.status(response.status).send(`Error: Target server returned ${response.status}`);
      }

      // Forward headers
      const contentType = response.headers["content-type"];
      const contentLength = response.headers["content-length"];
      
      if (contentType) res.setHeader("Content-Type", contentType);
      if (contentLength) res.setHeader("Content-Length", contentLength);
      
      // Decode filename for the header
      const rawFilename = targetUrl.split('/').pop() || 'download.zip';
      const decodedFilename = decodeURIComponent(rawFilename);
      
      // Set attachment header to force download
      res.setHeader("Content-Disposition", `attachment; filename="${decodedFilename}"`);
      
      // Pipe the data
      response.data.pipe(res);

      // Handle stream errors
      response.data.on('error', (err: any) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).send('Stream error during download');
        }
      });

    } catch (error: any) {
      console.error("Proxy error:", error.message);
      if (!res.headersSent) {
        const status = error.response?.status || 500;
        res.status(status).send(`Failed to fetch resource: ${error.message}`);
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
