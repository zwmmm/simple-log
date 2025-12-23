# 多平台 Native Binary 打包说明

## 概述

本项目使用 `oxc-parser` 进行 AST 解析,需要支持多平台的 native binding。本方案参考 oxc 的构建流程实现了完整的多平台打包支持。

## 架构设计

### 1. 构建时打包 (`generate-native-packages.js`)

**功能:**
- 从 `node_modules/@oxc-parser/` 扫描所有已安装的平台包
- 将每个平台的 `.node` 文件复制到 `binaries/<platform-name>/` 目录
- 为每个平台生成独立的 `package.json` (包含 `os`、`cpu`、`libc` 元数据)

**支持的平台:**
- **macOS**: darwin-universal, darwin-x64, darwin-arm64
- **Windows**: win32-x64-msvc, win32-ia32-msvc, win32-arm64-msvc
- **Linux**: linux-x64-gnu, linux-x64-musl, linux-arm64-gnu, linux-arm64-musl

**何时运行:**
- 生产构建时自动执行 (`pnpm run build`)
- 可手动执行: `pnpm run generate-binaries`

### 2. 运行时加载 (`oxcLoader.ts`)

**功能:**
- 检测当前平台 (`process.platform` + `process.arch`)
- Linux 系统额外检测 libc 类型 (glibc vs musl)
- 按优先级尝试加载 binding:
  1. 从打包的 `binaries/` 目录加载 (生产环境)
  2. 从 `node_modules/@oxc-parser/binding-*` 加载 (开发环境)
  3. 从 `oxc-parser` 主包加载 (降级方案)

**优势:**
- 单例模式,避免重复加载
- 详细的日志输出便于调试
- 优雅降级,最大兼容性

### 3. 构建流程集成 (`esbuild.config.js`)

**生产构建流程:**
```
1. generateNativePackages() → 生成 binaries/
2. esbuild.build() → 打包 TypeScript 代码
3. copyBinaries() → 复制 binaries/ 到 out/binaries/
```

**开发构建:**
- 跳过 native packages 生成
- 直接从 node_modules 加载

## 使用指南

### 安装依赖

```bash
# 安装所有平台的 optional dependencies
pnpm install

# 或指定特定平台
pnpm install --platform=darwin --arch=arm64
```

### 开发模式

```bash
# 启动 watch 模式 (不生成 binaries)
pnpm run watch
```

### 生产构建

```bash
# 完整构建 (包含所有平台)
pnpm run build

# 构建产物:
# - out/extension.js (打包后的代码)
# - out/binaries/ (所有平台的 native bindings)
```

### 发布扩展

```bash
# 发布到 VSCode Marketplace
pnpm run publish

# VSIX 会包含:
# - out/ 目录 (包含 binaries/)
# - package.json
# - README 等静态资源
```

## 文件结构

```
simple-log/
├── scripts/
│   ├── generate-native-packages.js  # 构建脚本
│   └── README.md                    # 本文档
├── src/extension/utils/
│   ├── oxcLoader.ts                 # 运行时加载器
│   └── astAnalyzer.ts               # 使用 oxcLoader
├── binaries/                        # 打包后的 native bindings
│   ├── darwin-arm64/
│   │   ├── package.json
│   │   └── parser.darwin-arm64.node
│   ├── linux-x64-gnu/
│   └── win32-x64-msvc/
├── out/                             # 构建输出
│   ├── extension.js
│   └── binaries/                    # 复制的 binaries
├── esbuild.config.js                # 构建配置
└── package.json                     # 依赖配置
```

## package.json 配置

### dependencies
```json
{
  "oxc-parser": "^0.104.0"
}
```

### optionalDependencies
所有平台的 binding 包都标记为 `optionalDependencies`,这样:
- 用户安装时只会下载匹配当前平台的包
- 构建时可以安装所有平台的包
- 安装失败不会阻塞整体安装

### scripts
```json
{
  "build": "node esbuild.config.js --production",
  "generate-binaries": "node scripts/generate-native-packages.js",
  "vscode:prepublish": "pnpm run build"
}
```

## 调试技巧

### 查看加载日志

在 VSCode 开发者工具中查看日志:
- **帮助** > **切换开发人员工具** > **控制台**

日志示例:
```
[INFO] Detecting platform: darwin-arm64
[DEBUG] Binding candidates: darwin-universal, darwin-arm64
[DEBUG] Trying to load from binaries: ../../../binaries/darwin-universal/parser.darwin-universal.node
[INFO] ✅ Loaded oxc-parser binding: darwin-universal (from binaries)
```

### 测试特定平台

```bash
# 生成特定平台的包
node scripts/generate-native-packages.js

# 检查生成的包
ls -la binaries/

# 查看包内容
cat binaries/darwin-arm64/package.json
```

### 验证构建产物

```bash
# 构建后检查
pnpm run build
ls -la out/binaries/

# 验证 VSIX 内容
vsce package
unzip -l *.vsix | grep binaries
```

## 常见问题

### Q: 为什么开发时不生成 binaries?
**A:** 开发模式直接从 `node_modules` 加载,避免每次修改都重新生成,提高开发效率。

### Q: 如何添加新平台支持?
**A:**
1. 在 `generate-native-packages.js` 的 `SUPPORTED_PLATFORMS` 添加平台配置
2. 在 `package.json` 的 `optionalDependencies` 添加对应的 binding 包
3. `oxcLoader.ts` 的 `getBindingCandidates` 会自动处理

### Q: 用户安装插件时需要网络吗?
**A:** 不需要。所有 native bindings 已打包在 VSIX 中,运行时直接从 `out/binaries/` 加载。

### Q: 如何减小 VSIX 体积?
**A:**
- 当前方案包含所有平台,VSIX 体积较大
- 如果只针对特定平台发布,可以修改构建脚本只生成对应平台
- 或使用 VSCode 的平台特定扩展功能 (platform-specific extensions)

## 参考资料

- [oxc generate-packages.js](https://github.com/oxc-project/oxc/blob/main/npm/oxlint/generate-packages.mjs)
- [NAPI-RS Platform Support](https://napi.rs/docs/concepts/platforms)
- [VSCode Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
