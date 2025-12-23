const esbuild = require('esbuild');
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * 生成 native packages (仅在生产构建时)
 */
function generateNativePackages() {
  if (!production) {
    console.log('⏭️  Skipping native packages generation in development mode');
    return;
  }

  console.log('📦 Generating native packages...');
  try {
    execSync('node scripts/generate-native-packages.js', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname),
    });
  } catch (error) {
    console.error('❌ Failed to generate native packages:', error);
    process.exit(1);
  }
}

async function main() {
  // 生产模式:生成 native packages (直接输出到 out/libs)
  if (production) {
    generateNativePackages();
  }

  // Extension 构建配置
  const extensionCtx = await esbuild.context({
    entryPoints: ['src/extension/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'out/extension.js',
    external: ['vscode', 'oxc-parser'],
    logLevel: 'info',
  });

  if (watch) {
    await extensionCtx.watch();
    console.log('👀 Watching for changes...');
  } else {
    await extensionCtx.rebuild();
    await extensionCtx.dispose();

    console.log('✅ Build complete!');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
