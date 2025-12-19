const esbuild = require('esbuild');
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs/promises');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// PostCSS 插件:处理 CSS 文件通过 Tailwind
const postcssPlugin = {
  name: 'postcss',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await fs.readFile(args.path, 'utf8');
      const result = await postcss([tailwindcss, autoprefixer]).process(css, {
        from: args.path,
        to: args.path,
      });
      return {
        contents: result.css,
        loader: 'css',
      };
    });
  },
};

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

  // Webview 构建配置
  const webviewCtx = await esbuild.context({
    entryPoints: ['src/webview/index.ts'],
    bundle: true,
    format: 'iife',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'browser',
    outfile: 'out/webview.js',
    plugins: [postcssPlugin],
    logLevel: 'info',
  });

  if (watch) {
    await Promise.all([extensionCtx.watch(), webviewCtx.watch()]);
    console.log('👀 Watching for changes...');
  } else {
    await Promise.all([extensionCtx.rebuild(), webviewCtx.rebuild()]);
    await Promise.all([extensionCtx.dispose(), webviewCtx.dispose()]);
    console.log('✅ Build complete!');
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
