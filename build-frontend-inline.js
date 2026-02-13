#!/usr/bin/env bun

import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import logger from './frontend/build-logger.js';

async function buildFrontend() {
  await logger.info('Starting frontend build with inline bundles...', {
    timestamp: new Date().toISOString(),
    process_id: process.pid
  });

  const currentDir = process.cwd();
  const isInFrontend = path.basename(currentDir) === 'frontend';
  const frontendDir = isInFrontend ? currentDir : path.join(currentDir, 'frontend');
  const originalDir = currentDir;

  try {
    if (!isInFrontend) {
      await logger.debug('Changing to frontend directory', { target_dir: frontendDir });
      process.chdir(frontendDir);
    }
  } catch (error) {
    await logger.fatal('Error changing to frontend directory', { error: error.message, stack: error.stack });
    process.exit(1);
  }

  try {
    await logger.step('check-dependencies', async () => {
      await logger.info('Checking frontend dependencies...');
      try {
        await fs.access('node_modules');
        await logger.info('Frontend dependencies already installed.');
      } catch {
        await logger.info('Installing frontend dependencies with Bun...');
        execSync('bun install', { stdio: 'inherit' });
        await logger.info('Frontend dependencies installed successfully.');
      }
    });

    await logger.step('run-rsbuild', async () => {
      await logger.info('Running rsbuild production build...');
      execSync('bun run build:incremental', { stdio: 'inherit' });
      await logger.info('Rsbuild production build completed.');
    });

    await logger.step('create-inline-bundle', async () => {
      await logger.info('Creating inline HTML bundle...');

      // Read the built JS files (note: filenames may vary with Rsbuild)
      const jsFiles = await fs.readdir('./dist/js/').catch(() => []);
      const cssFiles = await fs.readdir('./dist/css/').catch(() => []);

      // Track file information
      await logger.info('Found JS files', { count: jsFiles.length, files: jsFiles });
      await logger.info('Found CSS files', { count: cssFiles.length, files: cssFiles });

      // Find the main and vendor files
      let indexJs = '';
      let vendorsJs = '';

      for (const file of jsFiles) {
        const filePath = `./dist/js/${file}`;
        if ((await fs.stat(filePath)).isFile()) {
          const content = await fs.readFile(filePath, 'utf8');
          if (file.includes('index')) {
            indexJs = content;
            await logger.debug('Found main JS file', { file, size: content.length });
          } else if (file.includes('vendor') || file.includes('runtime')) {
            vendorsJs = content;
            await logger.debug('Found vendor JS file', { file, size: content.length });
          }
        }
      }

      // If we didn't find separate vendor files, just use the main file
      if (!vendorsJs && jsFiles.length > 0) {
        const mainFile = jsFiles[0];
        vendorsJs = await fs.readFile(`./dist/js/${mainFile}`, 'utf8');
        await logger.debug('Using main file as vendor', { file: mainFile });
      }

      const winboxJs = await fs.readFile('./node_modules/winbox/dist/winbox.bundle.min.js', 'utf8');
      const winboxCss = await fs.readFile('./node_modules/winbox/dist/css/winbox.min.css', 'utf8');

      await logger.metric('winbox_js_size', winboxJs.length);
      await logger.metric('winbox_css_size', winboxCss.length);

      // Create inline HTML
      const inlineHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rust WebUI Application</title>
  <style>
    /* WinBox CSS */
    ${winboxCss}

    /* Critical CSS */
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #app {
      width: 100%;
      height: 100%;
      display: block;
    }
    #app:empty::before {
      content: 'Loading...';
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: sans-serif;
      font-size: 18px;
      color: #333;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    // WinBox
    ${winboxJs}
  </script>
  <script>
    // React Vendors
    ${vendorsJs}
  </script>
  <script>
    // Main App
    ${indexJs}
  </script>
</body>
</html>`;

      await fs.writeFile('./dist/index.html', inlineHtml);
      await logger.info('Created inline HTML bundle', { path: 'frontend/dist/index.html', size: inlineHtml.length });

      // Also copy to root for easy access
      await fs.writeFile('../index.html', inlineHtml);
      await logger.info('Copied inline HTML to root', { path: 'index.html', size: inlineHtml.length });
    });

    const stats = logger.getStats();
    await logger.info('Frontend build with inline bundles completed successfully!', {
      output_dir: 'frontend/dist/',
      total_duration_ms: stats.elapsed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await logger.fatal('Error during frontend build with inline bundles', { 
      error: error.message, 
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  } finally {
    process.chdir(originalDir);
  }
}

buildFrontend();
