import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

// Only import Vite in development mode
let createViteServer: any;
let createLogger: any;

// We'll use a simple logger for production
const simpleLogger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  if (process.env.NODE_ENV !== "development") {
    console.warn("setupVite called in non-development environment. Ignoring.");
    return;
  }

  // Dynamically import Vite only in development
  try {
    const vite = await import("vite");
    createViteServer = vite.createServer;
    createLogger = vite.createLogger;

    const viteLogger = createLogger();

    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
    };

    // Create a simple config
    const viteDevConfig = {
      configFile: false as const,
      server: serverOptions,
      appType: "custom" as const,
      plugins: []
    };

    const viteServer = await createViteServer({
      ...viteDevConfig,
      customLogger: {
        ...viteLogger,
        error: (msg: string, options: any) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      }
    });

    app.use(viteServer.middlewares);
    app.use("*", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        
        // Import nanoid dynamically
        const { nanoid } = await import("nanoid");
        
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await viteServer.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        viteServer.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("Failed to initialize Vite dev server:", error);
    // Fallback to static serving in case of error
    serveStatic(app);
  }
}

export function serveStatic(app: Express) {
  try {
    // First try the original path
    const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    
    if (fs.existsSync(distPath)) {
      log(`Serving static files from ${distPath}`);
      app.use(express.static(distPath));
      
      // fall through to index.html if the file doesn't exist
      app.use("*", (_req, res) => {
        const indexPath = path.resolve(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(200).send('<h1>LearnHub App</h1><p>Application is running but index.html was not found.</p>');
        }
      });
      return;
    }
    
    // Fallback to just dist in case the build structure is different
    const fallbackPath = path.resolve(import.meta.dirname, "..", "dist");
    log(`Fallback: Serving static files from ${fallbackPath}`);
    app.use(express.static(fallbackPath));
    
    // Basic fallback for all routes
    app.use("*", (_req, res) => {
      const indexPath = path.resolve(fallbackPath, "public", "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<h1>LearnHub App</h1><p>Application is running but index.html was not found.</p>');
      }
    });
  } catch (error) {
    console.error("Error in serveStatic:", error);
    // Provide a basic response for all routes if something went wrong
    app.use("*", (_req, res) => {
      res.status(500).send('<h1>Server Error</h1><p>There was an error setting up static file serving.</p>');
    });
  }
}
