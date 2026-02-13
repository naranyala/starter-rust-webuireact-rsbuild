#!/usr/bin/env bun

import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import logger from './frontend/build-logger.js';

async function buildFrontend() {
  await logger.info('Starting frontend build process...', {
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

    await logger.step('copy-static-files', async () => {
      await logger.info('Copying static files to root...');
      await fs.mkdir('../static/js', { recursive: true });
      await fs.mkdir('../static/css', { recursive: true });

      const rootJsFiles = await fs.readdir('./dist/static/js/').catch(() => []);
      for (const file of rootJsFiles) {
        const srcPath = `./dist/static/js/${file}`;
        const destPath = `../static/js/${file}`;
        if ((await fs.stat(srcPath)).isFile()) {
          await fs.copyFile(srcPath, destPath);
          await logger.info(`Copied JS file to root`, { file, src: srcPath, dest: destPath });
        }
      }

      const rootCssFiles = await fs.readdir('./dist/static/css/').catch(() => []);
      for (const file of rootCssFiles) {
        const srcPath = `./dist/static/css/${file}`;
        const destPath = `../static/css/${file}`;
        if ((await fs.stat(srcPath)).isFile()) {
          await fs.copyFile(srcPath, destPath);
          await logger.info(`Copied CSS file to root`, { file, src: srcPath, dest: destPath });
        }
      }
    });

    await logger.step('copy-winbox-assets', async () => {
      await logger.info('Copying WinBox assets...');
      // Ensure directories exist
      await fs.mkdir('./dist/static/css', { recursive: true });
      await fs.mkdir('./dist/static/js', { recursive: true });

      // Copy WinBox CSS and JS from node_modules
      try {
        await fs.copyFile('./node_modules/winbox/dist/css/winbox.min.css', './dist/static/css/winbox.min.css');
        await logger.info('Copied winbox.min.css');
      } catch (e) {
        await logger.warn('WinBox CSS copy failed', { error: e.message });
      }
      try {
        await fs.copyFile('./node_modules/winbox/dist/winbox.bundle.min.js', './dist/static/js/winbox.min.js');
        await logger.info('Copied winbox.min.js');
      } catch (e) {
        await logger.warn('WinBox JS copy failed', { error: e.message });
      }
    });

    await logger.step('update-index-html', async () => {
      await logger.info('Updating index.html paths...');
      let indexHtml = await fs.readFile('./dist/index.html', 'utf8');

      // Update the title
      indexHtml = indexHtml.replace(
        /<title>[^<]*<\/title>/,
        '<title>Rust WebUI Application</title>'
      );

      // Add WebUI JavaScript bridge script tag if not already present
      // The WebUI framework expects a JavaScript bridge for communication
      if (!indexHtml.includes('webui.js')) {
        // Add webui.js script tag before closing body tag
        const webuiScript = '  <script src="/webui.js"></script>\n';
        if (indexHtml.includes('</body>')) {
            indexHtml = indexHtml.replace('</body>', `  ${webuiScript}</body>`);
        } else {
            // If no body tag, add it before closing html tag
            indexHtml = indexHtml.replace('</html>', `  ${webuiScript}</html>`);
        }
        await logger.info('Added webui.js script tag to index.html');
      }

      await fs.writeFile('./dist/index.html', indexHtml);
      await logger.info('Updated index.html with WebUI bridge');
    });

    const stats = logger.getStats();
    await logger.info('Frontend build completed successfully!', {
      output_dir: 'frontend/dist/',
      total_duration_ms: stats.elapsed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await logger.fatal('Error during frontend build', { 
      error: error.message, 
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  } finally {
    process.chdir(originalDir);
  }
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

buildFrontend();
