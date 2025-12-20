const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
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

main().catch(e => {
  console.error(e);
  process.exit(1);
});
