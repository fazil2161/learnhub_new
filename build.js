// build.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting build process...');

// Function to recursively copy a directory
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Check if source directory exists
  if (!fs.existsSync(src)) {
    console.warn(`Warning: Source directory ${src} does not exist. Skipping.`);
    return;
  }
  
  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${srcPath} to ${destPath}`);
    }
  }
}

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

const publicDir = path.join(distDir, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Ensure assets directory exists
const assetsDir = path.join(publicDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

try {
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Build server
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

  // Copy client files
  console.log('Copying client files...');
  
  const clientDir = path.join(__dirname, 'client');
  
  // Copy client directory contents if it exists
  if (fs.existsSync(clientDir)) {
    copyDir(clientDir, publicDir);
  } else {
    console.warn('Warning: client directory not found. Creating basic placeholders.');
  }
  
  // Create a basic index.html if it doesn't exist
  const indexHtmlPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.log('Creating basic index.html');
    const basicHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LearnHub App</title>
  <link rel="stylesheet" href="/assets/index.css">
</head>
<body>
  <div id="root">
    <h1>LearnHub App</h1>
    <p>Application is running</p>
  </div>
  <script src="/assets/index.js"></script>
</body>
</html>
    `;
    fs.writeFileSync(indexHtmlPath, basicHtml);
  }
  
  // Create basic CSS if not found
  const cssPath = path.join(assetsDir, 'index.css');
  if (!fs.existsSync(cssPath)) {
    console.log('Creating basic CSS');
    const basicCss = `
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
  color: #333;
}

#root {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #2563eb;
}
    `;
    fs.writeFileSync(cssPath, basicCss);
  }
  
  // Create basic JS if not found
  const jsPath = path.join(assetsDir, 'index.js');
  if (!fs.existsSync(jsPath)) {
    console.log('Creating basic JS');
    const basicJs = `
// Simple client-side JavaScript
document.addEventListener('DOMContentLoaded', () => {
  console.log('LearnHub Application loaded');
});
    `;
    fs.writeFileSync(jsPath, basicJs);
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 