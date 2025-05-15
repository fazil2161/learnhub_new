import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { fileURLToPath } from 'url';

// Only import Vite in development mode
let createViteServer: any;
let createLogger: any;

// We'll use a simple logger for production
const simpleLogger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
};

// Get the directory name in a way that works in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Create a simple config instead of importing
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
          __dirname,
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
    console.log(`[DEBUG] Current directory: ${process.cwd()}`);
    console.log(`[DEBUG] Server __dirname: ${__dirname}`);
    
    // Define an array of possible paths to try in order
    const possibleDistPaths = [
      // Original path
      path.resolve(__dirname, "..", "dist", "public"),
      // Path that might work after compilation
      path.resolve(process.cwd(), "dist", "public"),
      // Direct paths that could work in various deployment scenarios
      "/opt/render/project/src/dist/public",
      path.join(process.cwd(), "public"),
      path.resolve(__dirname, "..", "public"),
      path.resolve(__dirname, "public"),
      path.resolve(process.cwd(), "dist"),
      // Try going up one directory from the current working directory
      path.resolve(process.cwd(), "..", "dist", "public")
    ];
    
    console.log('[DEBUG] Trying possible static directory paths:');
    for (const p of possibleDistPaths) {
      console.log(`  - ${p} (exists: ${fs.existsSync(p)})`);
    }
    
    // Find the first path that exists
    const staticPath = possibleDistPaths.find(p => fs.existsSync(p));
    
    if (staticPath) {
      console.log(`[DEBUG] Found static directory at: ${staticPath}`);
      
      // Log the files in the directory to debug
      try {
        const files = fs.readdirSync(staticPath);
        console.log(`[DEBUG] Files in ${staticPath}:`, files);
      } catch (err) {
        console.error(`[ERROR] Failed to read directory ${staticPath}:`, err);
      }
      
      log(`Serving static files from ${staticPath}`);
      
      // Special handling for source files - intercept requests to /src to serve compiled files if they exist
      app.use('/src', (req, res, next) => {
        // Check if we should transform this to an assets request
        if (req.url.endsWith('.tsx') || req.url.endsWith('.ts') || req.url.endsWith('.jsx') || req.url.endsWith('.js')) {
          // Redirect .tsx requests to the compiled .js in /assets
          const assetPath = path.join(staticPath, 'assets', 'index.js');
          if (fs.existsSync(assetPath)) {
            console.log(`[DEBUG] Redirecting ${req.url} to compiled assets`);
            return res.sendFile(assetPath);
          }
        } else if (req.url.endsWith('.css')) {
          // Redirect .css requests to the compiled CSS in /assets
          const cssPath = path.join(staticPath, 'assets', 'index.css');
          if (fs.existsSync(cssPath)) {
            console.log(`[DEBUG] Redirecting ${req.url} to compiled CSS`);
            return res.sendFile(cssPath);
          }
        }
        next();
      });
      
      // Also handle /assets requests
      app.use('/assets', (req, res, next) => {
        const requestedAsset = path.join(staticPath, 'assets', req.path);
        const assetPath = path.join(staticPath, 'assets', path.basename(req.path));
        
        console.log(`[DEBUG] Asset request for ${req.path}, trying ${assetPath}`);
        
        if (fs.existsSync(assetPath)) {
          return res.sendFile(assetPath);
        }
        next();
      });
      
      // Serve static files with proper content types
      app.use(express.static(staticPath, { 
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
          }
        }
      }));
      
      // Try to find index.html
      const possibleIndexPaths = [
        path.resolve(staticPath, "index.html"),
        // If staticPath is a parent directory, check if index.html is in public subdirectory
        path.resolve(staticPath, "public", "index.html")
      ];
      
      // Also check for our fallback HTML
      const fallbackHtmlPath = path.resolve(staticPath, "fallback.html");
      if (fs.existsSync(fallbackHtmlPath)) {
        possibleIndexPaths.push(fallbackHtmlPath);
      }
      
      app.use("*", (_req, res) => {
        // Try each possible index.html location
        for (const indexPath of possibleIndexPaths) {
          console.log(`[DEBUG] Checking for index.html at ${indexPath}`);
          if (fs.existsSync(indexPath)) {
            console.log(`[DEBUG] Found index.html at ${indexPath}`);
            
            // Special case for fallback.html
            if (indexPath === fallbackHtmlPath) {
              console.log('[DEBUG] Using fallback.html');
              return res.sendFile(fallbackHtmlPath);
            }
            
            // Read and modify the index.html to ensure proper asset loading
            try {
              let html = fs.readFileSync(indexPath, 'utf8');
              
              // Update references to source files to use compiled assets if needed
              if (html.includes('src="/src/main.tsx"')) {
                const assetsIndexJs = path.join(staticPath, 'assets', 'index.js');
                if (fs.existsSync(assetsIndexJs)) {
                  console.log('[DEBUG] Updating index.html to use compiled JS');
                  html = html.replace('src="/src/main.tsx"', 'src="./assets/index.js"');
                }
              }
              
              // Add CSS link if it exists but isn't already in the HTML
              const assetsIndexCss = path.join(staticPath, 'assets', 'index.css');
              if (fs.existsSync(assetsIndexCss) && !html.includes('href="/assets/index.css"') && !html.includes('href="./assets/index.css"')) {
                console.log('[DEBUG] Adding CSS link to index.html');
                html = html.replace('</head>', '  <link rel="stylesheet" href="./assets/index.css">\n</head>');
              }
              
              // Send the modified HTML
              return res.type('html').send(html);
            } catch (err) {
              console.error('[ERROR] Failed to modify index.html:', err);
              
              // If the fallback HTML exists, use it
              if (fs.existsSync(fallbackHtmlPath)) {
                console.log('[DEBUG] Using fallback.html due to error');
                return res.sendFile(fallbackHtmlPath);
              }
              
              return res.sendFile(indexPath);
            }
          }
        }
        
        // If we have a fallback HTML, use it
        if (fs.existsSync(fallbackHtmlPath)) {
          console.log('[DEBUG] Using fallback.html as last resort');
          return res.sendFile(fallbackHtmlPath);
        }
        
        // Ultimate fallback - generate simple HTML
        console.log(`[DEBUG] No index.html found, serving generated HTML`);
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
      const errorDetails = error instanceof Error 
        ? `${error.name}: ${error.message}\n${error.stack || ''}`
        : JSON.stringify(error, null, 2);
      
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
    <pre>${errorDetails}</pre>
    <p>API endpoints should still be functional.</p>
  </div>
</body>
</html>`;
      res.status(500).type('html').send(errorHtml);
    });
  }
}
