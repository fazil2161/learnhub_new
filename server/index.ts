import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

// Import only the log function explicitly, leaving serveStatic to be dynamically imported
import { log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Basic fallback handler in case static serving fails
function basicFallbackHandler(app: express.Express) {
  app.use("*", (_req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LearnHub App - Emergency Mode</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 { color: #e11d48; }
  </style>
</head>
<body>
  <div class="container">
    <h1>LearnHub App - Emergency Mode</h1>
    <p>The application is running in emergency mode.</p>
    <p>API endpoints should still be functional.</p>
  </div>
</body>
</html>`;
    res.status(200).type('html').send(html);
  });
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Dynamically import serveStatic
  try {
    console.log('[SERVER] Environment:', process.env.NODE_ENV);
    
    if (process.env.NODE_ENV === "development") {
      console.log('[SERVER] Setting up development environment...');
      try {
        const { setupVite } = await import("./vite");
        await setupVite(app, server);
        console.log('[SERVER] Development environment ready.');
      } catch (error) {
        console.error('[SERVER] Failed to setup development environment:', error);
        // Fallback to static serving
        const { serveStatic } = await import("./vite");
        serveStatic(app);
      }
    } else {
      console.log('[SERVER] Setting up production environment...');
      // In production, only use static serving
      try {
        const viteModule = await import("./vite");
        viteModule.serveStatic(app);
        console.log('[SERVER] Production static serving ready.');
      } catch (error) {
        console.error('[SERVER] Failed to setup static serving:', error);
        // Use basic fallback
        basicFallbackHandler(app);
      }
    }
  } catch (error) {
    console.error('[SERVER] Critical error setting up server:', error);
    // Ultimate fallback
    basicFallbackHandler(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
