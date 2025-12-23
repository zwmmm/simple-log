#!/usr/bin/env node

/**
 * 多平台 native binary 打包脚本
 *
 * 策略:
 * 1. 从 npm 远程下载所有平台的 @oxc-parser/binding-* 包
 * 2. 解压并提取 .node 文件
 * 3. 复制 oxc-parser 到 out/libs/oxc-parser
 * 4. 将所有 .node 文件放到 out/libs/oxc-parser/src-js/
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const https = require('node:https');
const { pipeline } = require('node:stream/promises');
const { createGunzip } = require('node:zlib');
const tar = require('tar');

// 项目根目录
const REPO_ROOT = path.resolve(__dirname, '..');
// 缓存目录 (在项目根目录的 .cache/bindings/)
const CACHE_ROOT = path.resolve(REPO_ROOT, '.cache', 'bindings');
// 输出目录
const OUT_LIBS_ROOT = path.resolve(REPO_ROOT, 'out', 'libs');
const TARGET_OXC_DIR = path.resolve(OUT_LIBS_ROOT, 'oxc-parser');
// oxc-parser 源目录
const SOURCE_OXC_DIR = path.resolve(REPO_ROOT, 'node_modules', 'oxc-parser');

// 从 package.json 读取 oxc-parser 版本
const rootManifest = JSON.parse(
  fs.readFileSync(path.resolve(REPO_ROOT, 'package.json'), 'utf-8'),
);
const OXC_VERSION =
  rootManifest.dependencies['oxc-parser'] ||
  rootManifest.devDependencies['oxc-parser'];

// 支持的平台配置
const SUPPORTED_PLATFORMS = [
  // macOS (darwin-universal 在 0.104.0 版本不存在)
  'darwin-x64',
  'darwin-arm64',

  // Windows (win32-ia32-msvc 在 0.104.0 版本不存在)
  'win32-x64-msvc',
  'win32-arm64-msvc',

  // Linux
  'linux-x64-gnu',
  'linux-x64-musl',
  'linux-arm64-gnu',
  'linux-arm64-musl',
];

/**
 * 递归复制目录
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 下载文件
 */
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 处理重定向
          return downloadFile(response.headers.location, destPath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download: ${response.statusCode} ${response.statusMessage}`,
            ),
          );
          return;
        }

        const file = fs.createWriteStream(destPath);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      })
      .on('error', reject);
  });
}

/**
 * 从远程下载并提取 binding (带缓存)
 */
async function downloadAndExtractBinding(platform) {
  const packageName = `@oxc-parser/binding-${platform}`;
  const nodeFileName = `parser.${platform}.node`;
  const cachedFile = path.resolve(CACHE_ROOT, OXC_VERSION, nodeFileName);
  const targetPath = path.resolve(TARGET_OXC_DIR, 'src-js', nodeFileName);

  try {
    // 检查缓存
    if (fs.existsSync(cachedFile)) {
      console.log(`  💾 Using cached ${nodeFileName}`);
      fs.copyFileSync(cachedFile, targetPath);
      return true;
    }

    // 缓存不存在,下载
    console.log(`  📥 Downloading ${packageName}...`);

    const tmpDir = path.resolve(REPO_ROOT, '.tmp', platform);
    const tarballPath = path.resolve(tmpDir, 'package.tgz');

    // 创建临时目录
    fs.mkdirSync(tmpDir, { recursive: true });

    // 获取 tarball URL
    const tarballUrl = execSync(
      `npm view ${packageName}@${OXC_VERSION} dist.tarball`,
      { encoding: 'utf-8' },
    ).trim();

    // 下载 tarball
    await downloadFile(tarballUrl, tarballPath);

    // 解压 tarball
    await tar.x({
      file: tarballPath,
      cwd: tmpDir,
    });

    // 查找 .node 文件
    const packageDir = path.resolve(tmpDir, 'package');
    const files = fs.readdirSync(packageDir);
    const nodeFile = files.find((f) => f.endsWith('.node'));

    if (!nodeFile) {
      throw new Error(`No .node file found in ${packageName}`);
    }

    const sourcePath = path.resolve(packageDir, nodeFile);

    // 复制到缓存
    fs.mkdirSync(path.dirname(cachedFile), { recursive: true });
    fs.copyFileSync(sourcePath, cachedFile);
    console.log(`  💾 Cached to ${path.relative(REPO_ROOT, cachedFile)}`);

    // 复制到目标目录
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`  ✅ Copied ${nodeFile}`);

    // 清理临时文件
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return true;
  } catch (error) {
    console.log(`  ⚠️  Skipped ${platform}: ${error.message}`);
    // 清理临时文件
    const tmpDir = path.resolve(REPO_ROOT, '.tmp', platform);
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Generating native packages for oxc-parser...\n');
  console.log(`OXC Version: ${OXC_VERSION}\n`);

  // 检查源目录
  if (!fs.existsSync(SOURCE_OXC_DIR)) {
    console.error('❌ oxc-parser not found in node_modules');
    console.error('   Please run: npm install oxc-parser');
    process.exit(1);
  }

  // 创建输出目录
  if (!fs.existsSync(OUT_LIBS_ROOT)) {
    fs.mkdirSync(OUT_LIBS_ROOT, { recursive: true });
  }

  // 删除旧目录
  if (fs.existsSync(TARGET_OXC_DIR)) {
    console.log('🗑️  Removing old oxc-parser directory...');
    fs.rmSync(TARGET_OXC_DIR, { recursive: true, force: true });
  }

  // 复制 oxc-parser
  console.log('📦 Copying oxc-parser...');
  copyDir(SOURCE_OXC_DIR, TARGET_OXC_DIR);
  console.log('  ✅ oxc-parser copied\n');

  // 下载所有平台的 binding 文件
  console.log('📦 Downloading native bindings from npm registry...');
  console.log(`📁 Cache directory: ${CACHE_ROOT}/${OXC_VERSION}\n`);

  let successCount = 0;
  let skipCount = 0;
  let cachedCount = 0;

  for (const platform of SUPPORTED_PLATFORMS) {
    const success = await downloadAndExtractBinding(platform);
    if (success) {
      successCount++;
      // 检查是否使用了缓存
      const nodeFileName = `parser.${platform}.node`;
      const cachedFile = path.resolve(CACHE_ROOT, OXC_VERSION, nodeFileName);
      if (fs.existsSync(cachedFile)) {
        cachedCount++;
      }
    } else {
      skipCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Summary:');
  console.log(`  ✅ Downloaded: ${successCount} bindings`);
  console.log(`  💾 Cached: ${cachedCount} bindings`);
  console.log(`  ⚠️  Skipped: ${skipCount} bindings`);
  console.log(`  📁 Output directory: ${TARGET_OXC_DIR}`);
  console.log('='.repeat(60) + '\n');

  if (successCount === 0) {
    console.error(
      '❌ No bindings were downloaded. Please check your network connection.',
    );
    process.exit(1);
  }

  console.log('✅ Native packages generated successfully!\n');
  console.log(
    '💡 oxc-parser will automatically detect platform and load correct binding at runtime.',
  );
}

// 运行
main().catch((error) => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
