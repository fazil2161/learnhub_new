// build.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting build process...');

// Ensure dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.mkdirSync(path.join(__dirname, 'dist'));
}

if (!fs.existsSync(path.join(__dirname, 'dist', 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'dist', 'public'));
}

try {
  // Install only the necessary packages for build
  console.log('Installing build dependencies...');
  const buildDeps = [
    'vite@latest',
    '@vitejs/plugin-react',
    'esbuild',
    'typescript',
  ];
  
  execSync(`npm install --no-save ${buildDeps.join(' ')}`, { stdio: 'inherit' });
  
  // Build client (frontend)
  console.log('Building client...');
  execSync('npx vite build -c client/vite.config.js', { stdio: 'inherit' });
  
  // Build server (backend)
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 