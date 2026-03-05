# Simple-Log

<div align="center">

**🚀 快速、智能、多语言的日志插入工具**

一款轻量级的 VSCode 日志插入扩展，专为提升开发调试效率而生

[English](README.md) | [简体中文](README.zh-CN.md)

</div>

---

## 💡 致敬与创新

[Turbo Console Log](https://marketplace.visualstudio.com/items?itemName=ChakrounAnas.turbo-console-log) 是一款优秀的 JavaScript/TypeScript 日志插件，。我们从中汲取灵感，并在此基础上带来以下创新：

### 🌟 为什么选择 Simple-Log？

| 特性 | Simple-Log | 传统工具 |
|------|-----------|---------|
| **🚀 极致性能** | 基于 Rust 的 oxc-parser，毫秒级响应 | 通常基于 JS/TS 解析器，较慢 |
| **🌍 多语言支持** | 支持 **8+ 种语言**（JS/TS/React/Vue/Python/Java/Go/Rust） | 通常仅支持 JavaScript/TypeScript |
| **🧠 智能 AST 分析** | 基于语义的语句边界识别，完整语句后插入 | 简单行匹配，易产生语法错误 |
| **📍 插入位置合理** | 识别多行语句、链式调用，避免破坏代码结构 | 机械式插入下一行，可能切断语句 |
| **🎯 可视化管理** | 专属侧边栏面板，统一管理所有日志 | 仅命令行操作 |
| **⚙️ 灵活配置** | Simple/Smart 双模式，适应不同场景 | 配置选项有限 |
| **📦 零依赖** | 轻量级设计，快速安装 | 可能包含大量依赖 |

---

## ✨ 核心功能

### 🌍 广泛的语言支持

支持主流开发语言，一个插件满足多项目需求：

```
✅ JavaScript      ✅ TypeScript      ✅ React (JSX/TSX)
✅ Vue (SFC)       ✅ Python          ✅ Java
✅ Go              ✅ Rust            🔜 更多语言持续更新
```

### ⚡ 高效的操作体验

- **一键插入**：`Ctrl/Cmd + Shift + L` 瞬间插入日志
- **智能定位**：基于 AST 语法分析，精准识别最佳插入位置（JS/TS/React）
- **批量操作**：一键注释/删除当前文件所有日志
- **可视化管理**：专属侧边栏面板，实时统计与跳转

### 🧠 智能分析引擎

**双模式自适应**：
- **Simple 模式**：极速插入，适用所有语言 ⚡
- **Smart 模式**：AST 深度分析，避免语法错误（JS/TS 专属）🧠

**智能识别场景**：
```javascript
// ✅ 正确识别函数调用链
const result = await fetch(url)
  .then(res => res.json())
  .then(data => data.items);
// 📝 日志插入在链式调用结束后

// ✅ 正确处理对象字面量
const config = {
  api: 'https://api.example.com',
  timeout: 5000
};
// 📝 日志插入在对象定义完成后

// ✅ 正确处理嵌套结构
if (user) {
  const profile = user.getProfile();
  // 📝 日志不会破坏语句结构
}
```

### 🎨 灵活的自定义配置

- 🏷️ **自定义前缀**：使用 emoji 或文本标识
- 🕐 **时间戳**：可选添加日志时间
- 📍 **位置信息**：可选显示文件名和行号
- 📐 **模板字符串**：支持 ES6 模板语法
- 🔧 **分析粒度**：在速度与精度之间自由平衡

---

## 📖 快速上手

### 🎯 基础使用（3 步开始）

#### 1️⃣ 插入日志

**操作方式 A：光标定位**
```typescript
const userName = user.name;  // ← 光标放在这一行
// 按 Ctrl+Shift+L (Windows/Linux) 或 Cmd+Shift+L (Mac)
// ↓ 自动插入
console.log('📝 userName:', userName);
```

**操作方式 B：选中变量**
```python
user_email = "test@example.com"  # 选中 user_email
# 按快捷键
# ↓ 自动生成
print(f"📝 user_email: {user_email}")
```

**✨ Smart 模式亮点（JS/TS 专属）**：
```javascript
// 智能识别完整语句
const data = await api
  .fetchUser()
  .then(res => res.json());  // ← 光标在这里
// ↓ 插入位置在语句结束后（不在中间！）
console.log('📝 data:', data);

// 而不是错误地插入在中间：
const data = await api
  .fetchUser()
console.log('📝 ???', ???);  // ❌ 这会导致语法错误！
  .then(res => res.json());
```

#### 2️⃣ 批量管理日志

| 操作 | 快捷键 (Win/Linux) | 快捷键 (Mac) | 说明 |
|------|-------------------|--------------|------|
| 注释所有日志 | `Alt+Shift+C` | `Alt+Shift+C` | 保留日志但不执行 |
| 删除所有日志 | `Alt+Shift+D` | `Alt+Shift+D` | 永久移除日志语句 |

#### 3️⃣ 使用可视化面板

1. **打开面板**：点击 VSCode 左侧活动栏的 ![输出图标]($(output)) 图标
2. **查看统计**：实时显示日志总数、活跃数、已注释数
3. **快速跳转**：点击日志项目直接定位到源码位置
4. **精细管理**：
   - 按文件夹/文件分组查看
   - 单独注释/删除某个日志
   - 一键清理整个文件/文件夹的日志

**面板界面预览**：
```
📁 src/
  ├─ 📄 index.ts (5 logs)
  │   ├─ 📝 Line 12: console.log('user:', user)
  │   ├─ 📝 Line 24: console.log('result:', result)
  │   └─ ...
  └─ 📄 utils.ts (3 logs)
```

---

## ⚙️ 配置指南

### 🎨 基础配置（适用所有语言）

在 VSCode 设置中搜索 "Simple-Log"，或直接编辑 `settings.json`：

```jsonc
{
  // 日志前缀（使用 emoji 或文本）
  "simple-log.prefix": "📝",

  // 使用模板字符串（仅 JS/TS）
  "simple-log.useBackticks": false,

  // 包含时间戳
  "simple-log.includeTimestamp": false,

  // 包含文件名
  "simple-log.includeFilename": false,

  // 包含行号
  "simple-log.includeLineNumber": false
}
```

**配置示例效果**：
```javascript
// 默认配置
console.log('📝 userName:', userName);

// 启用所有选项后
console.log('[2025-12-20 14:30:25] [index.ts:42] 📝 userName:', userName);
```

---

### 🧠 Smart 模式配置（仅 JS/TS/JSX/TSX）

**插入模式选择**：

```jsonc
{
  // 选择插入策略
  "simple-log.insertMode": "smart"  // "simple" 或 "smart"
}
```

| 模式 | 行为 | 速度 | 准确性 | 适用语言 |
|------|------|------|--------|---------|
| **simple** | 插入在下一行 | ⚡ 瞬时 | ✅ 良好 | **所有语言** |
| **smart** | AST 智能定位 | 🚀 快速 | ✅✅ 优秀 | **仅 JS/TS/JSX/TSX** |

**何时使用 Simple 模式**：
- ✅ 你更喜欢简单可预测的行为
- ✅ 处理超大文件（> 10000 行）
- ✅ 使用非 JS/TS 语言（Python、Java、Go 等自动降级）

**何时使用 Smart 模式**：
- ✅ 处理复杂的嵌套结构
- ✅ 希望避免语法错误
- ✅ 开发 JavaScript/TypeScript 项目

---

### 🔧 Smart 模式高级配置

```jsonc
{
  // AST 分析范围
  "simple-log.astAnalysisScope": "file",  // "local" 或 "file"

  // 局部分析上下文行数（5-100）
  "simple-log.localContextLines": 15,

  // 全文件分析的最大行数限制（100-50000）
  "simple-log.maxFileLinesForFullParse": 10000
}
```

**分析范围对比**：

| 范围 | 说明 | 速度 | 准确性 | 自动降级 |
|------|------|------|--------|---------|
| **local** | 分析光标附近 ±N 行 | ⚡ 超快 (< 1ms) | ✅ 良好 | - |
| **file** | 分析整个文件 | 🚀 快速 (2-10ms) | ✅✅ 最佳 | 超大文件自动切换到 local |

**性能参考**：

| 文件大小 | Simple 模式 | Smart (local, 15行) | Smart (file) |
|----------|------------|---------------------|-------------|
| < 100 行 | 瞬时 | ~1ms | ~2ms |
| 100-1000 行 | 瞬时 | ~1ms | ~5ms |
| 1000-5000 行 | 瞬时 | ~1ms | ~8ms |
| 5000-10000 行 | 瞬时 | ~1ms | ~10ms |
| **> 10000 行** | 瞬时 | ~1ms | **自动降级→ local** |

**推荐配置**：

```jsonc
{
  "simple-log.insertMode": "smart",              // 启用智能定位
  "simple-log.astAnalysisScope": "file",         // 最佳准确性
  "simple-log.localContextLines": 15,            // 良好平衡
  "simple-log.maxFileLinesForFullParse": 10000   // 安全默认值
}
```

**性能优化建议**：
- 💻 **高性能机器**：可将 `maxFileLinesForFullParse` 提高到 20000-50000
- 🐌 **低性能机器**：建议降低到 5000 或使用 `local` 范围
- 📂 **大型项目**：建议使用 `local` 范围以保持流畅体验

---

### 🎯 Tree View 配置（日志面板过滤）

```jsonc
{
  // 排除特定文件夹（支持正则表达式）
  "simple-log.treeView.excludeFolders": [
    "node_modules",
    "dist",
    "build",
    "out",
    ".git"
  ],

  // 仅包含特定文件夹（支持正则表达式）
  "simple-log.treeView.includeFolders": []  // 为空表示扫描所有（除排除项外）
}
```

---

## ⌨️ 快捷键参考

| 功能 | Windows/Linux | macOS | 说明 |
|------|---------------|-------|------|
| 插入日志 | `Ctrl+Shift+L` | `Cmd+Shift+L` | 在光标位置插入日志 |
| 注释所有日志 | `Alt+Shift+C` | `Alt+Shift+C` | 注释当前文件所有日志 |
| 删除所有日志 | `Alt+Shift+D` | `Alt+Shift+D` | 删除当前文件所有日志 |

> 💡 **提示**：所有快捷键都可以在 VSCode 快捷键设置中自定义

---

## 🛠️ 技术架构

### 性能优化

- **🦀 Rust 核心**：基于 [oxc-parser](https://github.com/oxc-project/oxc) 的超快速 AST 解析
- **📊 增量分析**：智能缓存机制，避免重复解析
- **🎯 按需加载**：仅在需要时才进行 AST 分析
- **⚡ 零阻塞**：异步架构，不影响编辑器响应速度

### 平台支持

Smart 模式使用 **oxc-parser** (Rust 编写)，需要平台特定的原生二进制文件。已支持：

```
✅ macOS (Intel & Apple Silicon)
✅ Windows (x64 & ARM64)
✅ Linux (x64 & ARM64, glibc & musl)
```

安装时会根据您的平台自动安装正确的二进制文件，无需手动配置！

---

## 🎬 使用示例

### JavaScript/TypeScript

```javascript
// 变量声明
const userId = user.id;
console.log('📝 userId:', userId);

// 函数调用
const result = await fetchData();
console.log('📝 result:', result);

// 链式调用（智能识别完整链）
const items = data
  .filter(x => x.active)
  .map(x => x.name);
console.log('📝 items:', items);

// 对象字面量
const config = {
  api: 'https://api.com',
  timeout: 3000
};
console.log('📝 config:', config);
```

### Python

```python
# 变量赋值
user_name = "Alice"
print(f"📝 user_name: {user_name}")

# 函数调用
result = calculate_total(items)
print(f"📝 result: {result}")

# 列表推导
numbers = [x * 2 for x in range(10)]
print(f"📝 numbers: {numbers}")
```

### Java

```java
// 变量声明
String userName = user.getName();
System.out.println("📝 userName: " + userName);

// 方法调用
List<Item> items = repository.findAll();
System.out.println("📝 items: " + items);
```

### Go

```go
// 变量声明
userName := user.Name
fmt.Printf("📝 userName: %v\n", userName)

// 函数调用
result, err := fetchData()
fmt.Printf("📝 result: %v\n", result)
```

---

## 🚀 安装与开发

### 从 VSCode Marketplace 安装

1. 打开 VSCode
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 搜索 "Simple-Log"
4. 点击安装

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/zwmmm/simple-log.git
cd simple-log

# 安装依赖
pnpm install

# 开发模式（自动重新编译）
pnpm run watch

# 构建生产版本
pnpm run build

# 运行测试
pnpm run test

# 代码检查
pnpm run lint

# 调试扩展（在 VSCode 中按 F5）
```

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 报告问题

发现 Bug 或有功能建议？请在 [GitHub Issues](https://github.com/zwmmm/simple-log/issues) 中提交。

---

## 📝 更新日志

### v0.1.0 (2025-12-20)

**🎉 首次发布**

- ✅ 支持 8+ 种编程语言
- ✅ Smart/Simple 双模式插入
- ✅ 基于 Rust 的 AST 智能分析
- ✅ 可视化日志管理面板
- ✅ 批量注释/删除功能
- ✅ 完整的配置选项

---

## 💬 常见问题

<details>
<summary><strong>Q: Smart 模式支持哪些语言？</strong></summary>

A: Smart 模式目前仅支持 **JavaScript、TypeScript、JSX 和 TSX**。其他语言（Python、Java、Go、Vue 等）会自动使用 Simple 模式。
</details>

<details>
<summary><strong>Q: 为什么我的日志插入在了错误的位置？</strong></summary>

A: 可能的原因：
1. 当前文件不是 JS/TS，Simple 模式会插入在下一行
2. 文件过大（超过配置的 `maxFileLinesForFullParse`），自动降级到局部分析
3. 可以尝试调整 `astAnalysisScope` 为 `"file"` 或增加 `localContextLines`
</details>

<details>
<summary><strong>Q: 如何自定义日志格式？</strong></summary>

A: 在 VSCode 设置中调整以下选项：
- `simple-log.prefix`: 修改前缀符号
- `simple-log.includeTimestamp`: 添加时间戳
- `simple-log.includeFilename`: 添加文件名
- `simple-log.includeLineNumber`: 添加行号
- `simple-log.useBackticks`: 使用模板字符串（JS/TS）
</details>

<details>
<summary><strong>Q: 性能如何？会不会卡顿？</strong></summary>

A: Simple-Log 使用 Rust 编写的 oxc-parser，性能极佳：
- Simple 模式：瞬时响应
- Smart 模式（小文件）：1-5ms
- Smart 模式（大文件）：自动降级到局部分析，保持流畅
</details>

<details>
<summary><strong>Q: 可以在团队中统一配置吗？</strong></summary>

A: 可以！在项目根目录的 `.vscode/settings.json` 中添加配置，并提交到版本控制系统，团队成员会自动应用这些设置。
</details>

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

## 👨‍💻 作者

**Wayne**

- GitHub: [@zwmmm](https://github.com/zwmmm)
- 项目地址: [simple-log](https://github.com/zwmmm/simple-log)

---

## ⭐ 支持项目

如果这个项目对你有帮助，请考虑：

- ⭐ 在 GitHub 上给个星标
- 🐛 报告问题和建议
- 🤝 贡献代码
- 📢 分享给更多开发者

---

<div align="center">

**感谢使用 Simple-Log！**

让调试更简单，让开发更高效 🚀

</div>
