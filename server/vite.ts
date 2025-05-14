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
    
    console.log(`[DEBUG] Looking for static files in ${distPath}`);
    console.log(`[DEBUG] Directory exists: ${fs.existsSync(distPath)}`);
    
    if (fs.existsSync(distPath)) {
      // Log the files in the directory to debug
      console.log(`[DEBUG] Files in ${distPath}:`);
      try {
        const files = fs.readdirSync(distPath);
        console.log(files);
      } catch (err) {
        console.error(`[ERROR] Failed to read directory ${distPath}:`, err);
      }
      
      log(`Serving static files from ${distPath}`);
      app.use(express.static(distPath, { index: false }));
      
      // fall through to index.html if the file doesn't exist
      app.use("*", (_req, res) => {
        const indexPath = path.resolve(distPath, "index.html");
        console.log(`[DEBUG] Checking for index.html at ${indexPath}`);
        console.log(`[DEBUG] File exists: ${fs.existsSync(indexPath)}`);
        
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          // Create a basic fallback HTML if index.html doesn't exist
          const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LearnHub App</title>
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
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>LearnHub App</h1>
    <p>Application is running but index.html was not found.</p>
  </div>
</body>
</html>`;
          res.status(200).type('html').send(fallbackHtml);
        }
      });
      return;
    }
    
    // Try fallback paths
    const fallbackPaths = [
      path.resolve(import.meta.dirname, "..", "dist"),
      path.resolve(import.meta.dirname, ".."),
      path.resolve(import.meta.dirname, "..", "public"),
    ];
    
    for (const fallbackPath of fallbackPaths) {
      console.log(`[DEBUG] Trying fallback path: ${fallbackPath}`);
      console.log(`[DEBUG] Directory exists: ${fs.existsSync(fallbackPath)}`);
      
      if (fs.existsSync(fallbackPath)) {
        log(`Fallback: Serving static files from ${fallbackPath}`);
        app.use(express.static(fallbackPath, { index: false }));
        
        // Try to find index.html in multiple places
        const possibleIndexPaths = [
          path.resolve(fallbackPath, "index.html"),
          path.resolve(fallbackPath, "public", "index.html"),
          path.resolve(fallbackPath, "dist", "public", "index.html"),
        ];
        
        app.use("*", (_req, res) => {
          // Try each possible index.html location
          for (const indexPath of possibleIndexPaths) {
            console.log(`[DEBUG] Checking for index.html at ${indexPath}`);
            console.log(`[DEBUG] File exists: ${fs.existsSync(indexPath)}`);
            
            if (fs.existsSync(indexPath)) {
              return res.sendFile(indexPath);
            }
          }
          
          // Ultimate fallback - generate simple HTML
          const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LearnHub App</title>
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
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>LearnHub App</h1>
    <p>Application is running but index.html was not found in any expected location.</p>
    <p>API endpoints should still be functional.</p>
  </div>
</body>
</html>`;
          res.status(200).type('html').send(fallbackHtml);
        });
        
        return;
      }
    }
    
    // If we reach here, no suitable directory was found
    console.error("[ERROR] No suitable static directory found");
    
    // Basic fallback for all routes
    app.use("*", (_req, res) => {
      const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LearnHub App</title>
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
    h1 { color: #2563eb; }
    .error { color: #e11d48; }
  </style>
</head>
<body>
  <div class="container">
    <h1>LearnHub App</h1>
    <p class="error">Could not find any static files to serve.</p>
    <p>API endpoints should still be functional.</p>
  </div>
</body>
</html>`;
      res.status(200).type('html').send(fallbackHtml);
    });
  } catch (error) {
    console.error("[ERROR] Error in serveStatic:", error);
    
    // Provide a more detailed error response
    app.use("*", (_req, res) => {
      const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LearnHub App - Server Error</title>
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
    pre {
      background: #f1f1f1;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Server Error</h1>
    <p>There was an error setting up static file serving.</p>
    <p>Error details:</p>
    <pre>${error instanceof Error ? `${error.name}: ${error.message}\n${error.stack || ''}` : JSON.stringify(error, null, 2)}</pre>
    <p>API endpoints should still be functional.</p>
  </div>
</body>
</html>`;
      res.status(500).type('html').send(errorHtml);
    });
  }
}
