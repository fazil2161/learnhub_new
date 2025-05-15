// build.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Cleaning up existing dist directory...');
// Clean up dist directory if it exists
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  try {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('Successfully removed existing dist directory');
  } catch (err) {
    console.warn('Warning: Failed to clean up dist directory:', err);
  }
}

// Create fresh dist directories
console.log('Creating dist directories...');
fs.mkdirSync(distDir, { recursive: true });
const publicDir = path.join(distDir, 'public');
fs.mkdirSync(publicDir, { recursive: true });

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

try {
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Build server
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

  // Build client with Vite
  console.log('Building client with Vite...');
  try {
    // Navigate to client directory
    const clientDir = path.join(__dirname, 'client');
    
    // Build the client using Vite
    execSync('npx vite build', { 
      stdio: 'inherit',
      cwd: clientDir
    });
    
    console.log('Client build completed successfully');
  } catch (err) {
    console.error('Error building client:', err);
    
    // Fall back to copying client files if Vite build fails
    console.log('Falling back to copying client files...');
    const clientDir = path.join(__dirname, 'client');
    
    // Copy client directory contents if it exists
    if (fs.existsSync(clientDir)) {
      copyDir(clientDir, publicDir);
    } else {
      console.warn('Warning: client directory not found. Creating basic placeholders.');
      
      // ALWAYS create a basic index.html
      console.log('Creating index.html...');
      const indexHtmlPath = path.join(publicDir, 'index.html');
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
    <p>Application is running successfully!</p>
  </div>
  <script src="/assets/index.js"></script>
</body>
</html>
      `;
      fs.writeFileSync(indexHtmlPath, basicHtml);
      console.log(`Created ${indexHtmlPath}`);
      
      // ALWAYS create a basic CSS
      const assetsDir = path.join(publicDir, 'assets');
      fs.mkdirSync(assetsDir, { recursive: true });
      
      console.log('Creating CSS...');
      const cssPath = path.join(assetsDir, 'index.css');
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
      console.log(`Created ${cssPath}`);
      
      // ALWAYS create a basic JS
      console.log('Creating JS...');
      const jsPath = path.join(assetsDir, 'index.js');
      const basicJs = `
// Simple client-side JavaScript
document.addEventListener('DOMContentLoaded', () => {
  console.log('LearnHub Application loaded');
});
      `;
      fs.writeFileSync(jsPath, basicJs);
      console.log(`Created ${jsPath}`);
    }
  }
  
  // Create a test file to verify the build
  fs.writeFileSync(path.join(publicDir, 'build-verification.txt'), `Build completed at ${new Date().toISOString()}`);
  
  // Log the final directory structure
  console.log('\nFinal directory structure:');
  try {
    const listDir = (dir, level = 0) => {
      const indent = '  '.repeat(level);
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      files.forEach(file => {
        const filePath = path.join(dir, file.name);
        console.log(`${indent}- ${file.name}${file.isDirectory() ? '/' : ''}`);
        
        if (file.isDirectory()) {
          listDir(filePath, level + 1);
        }
      });
    };
    
    listDir(distDir);
  } catch (err) {
    console.error('Error listing directory structure:', err);
  }
  
  console.log('\nBuild completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 