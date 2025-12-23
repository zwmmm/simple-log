# Simple-Log

<div align="center">

**🚀 Fast, Smart, Multi-Language Log Insertion Tool**

A lightweight VSCode extension designed to boost debugging efficiency

[English](README.md) | [简体中文](README.zh-CN.md)

</div>

---

## 💡 Inspired by Excellence

[Turbo Console Log](https://marketplace.visualstudio.com/items?itemName=ChakrounAnas.turbo-console-log) is an excellent JavaScript/TypeScript logging extension that has benefited millions of developers. We've drawn inspiration from it and brought the following innovations:

### 🌟 Why Choose Simple-Log?

| Feature | Simple-Log | Traditional Tools |
|---------|-----------|-------------------|
| **🚀 Blazing Performance** | Rust-based oxc-parser, millisecond response | Usually JS/TS parsers, slower |
| **🌍 Multi-Language** | **8+ languages** (JS/TS/React/Vue/Python/Java/Go/Rust) | Usually JavaScript/TypeScript only |
| **🧠 Smart AST Analysis** | Deep syntax analysis, precise insertion | Simple line matching, prone to syntax errors |
| **🎯 Visual Management** | Dedicated sidebar panel for unified log management | Command-line only |
| **⚙️ Flexible Configuration** | Simple/Smart dual modes for different scenarios | Limited configuration options |
| **📦 Zero Dependencies** | Lightweight design, fast installation | May contain many dependencies |

---

## ✨ Core Features

### 🌍 Extensive Language Support

Support mainstream development languages with one plugin for all your projects:

```
✅ JavaScript      ✅ TypeScript      ✅ React (JSX/TSX)
✅ Vue (SFC)       ✅ Python          ✅ Java
✅ Go              ✅ Rust            🔜 More languages coming
```

### ⚡ Efficient Operations

- **One-Key Insert**: `Ctrl/Cmd + Shift + L` instantly inserts logs
- **Smart Positioning**: AST-based syntax analysis for optimal insertion positions (JS/TS/React)
- **Batch Operations**: Comment/delete all logs in current file with one click
- **Visual Management**: Dedicated sidebar panel with real-time stats and navigation

### 🧠 Intelligent Analysis Engine

**Dual-Mode Adaptive**:
- **Simple Mode**: Lightning-fast insertion, works with all languages ⚡
- **Smart Mode**: Context-aware intelligent positioning (JS/TS exclusive) 🧠

**Smart Insertion Strategy** - Follows debugging intuition:

```javascript
// ✅ Variable Declaration → Insert AFTER (print the declared value)
const userId = user.id;
console.log('📝 userId:', userId);  // ← Auto-inserted after declaration

// ✅ Condition Check → Insert BEFORE (check value before use)
console.log('📝 isValid:', isValid);  // ← Auto-inserted before condition
if (isValid) {
  processData();
}

// ✅ Function Call Chain → Insert BEFORE (inspect parameters)
console.log('📝 items:', items);  // ← Auto-inserted before map
items.map(item => transform(item));

// ✅ JSX Nested Functions → Automatically handled
return (
  <Form.List>
    {(fields, operation) => {
      console.log('📝 fields:', fields);  // ← Correctly inserted in function body
      const filtered = fields.filter(f => f.active);
      return <div>{filtered}</div>;
    }}
  </Form.List>
);
```

**Why This Matters**:
- 📥 **Declarations**: You want to see the value *after* assignment
- 📤 **Usage**: You want to verify values *before* they're used
- 🎯 **Result**: Logs appear exactly where you need them for debugging

### 🎨 Flexible Customization

- 🏷️ **Custom Prefix**: Use emoji or text identifiers
- 🕐 **Timestamps**: Optional log timestamps
- 📍 **Location Info**: Optional filename and line numbers
- 📐 **Template Strings**: ES6 template syntax support
- 🔧 **Analysis Granularity**: Balance between speed and accuracy

---

## 📖 Quick Start

### 🎯 Basic Usage (3 Steps)

#### 1️⃣ Insert Logs

**Method A: Cursor Positioning**
```typescript
const userName = user.name;  // ← Place cursor on this line
// Press Ctrl+Shift+L (Windows/Linux) or Cmd+Shift+L (Mac)
// ↓ Auto-inserted
console.log('📝 userName:', userName);
```

**Method B: Select Variable**
```python
user_email = "test@example.com"  # Select user_email
# Press shortcut
# ↓ Auto-generated
print(f"📝 user_email: {user_email}")
```

**✨ Smart Mode Highlights (JS/TS Exclusive)**:
```javascript
// Intelligently recognizes complete statements
const data = await api
  .fetchUser()
  .then(res => res.json());  // ← Cursor here
// ↓ Insertion position after statement completion (not in the middle!)
console.log('📝 data:', data);

// Instead of incorrectly inserting in the middle:
const data = await api
  .fetchUser()
console.log('📝 ???', ???);  // ❌ This would cause syntax errors!
  .then(res => res.json());
```

#### 2️⃣ Batch Log Management

| Operation | Shortcut (Win/Linux) | Shortcut (Mac) | Description |
|-----------|---------------------|----------------|-------------|
| Comment All Logs | `Alt+Shift+C` | `Alt+Shift+C` | Keep logs but don't execute |
| Delete All Logs | `Alt+Shift+D` | `Alt+Shift+D` | Permanently remove log statements |

#### 3️⃣ Use Visual Panel

1. **Open Panel**: Click the ![Output Icon]($(output)) icon in VSCode's left activity bar
2. **View Statistics**: Real-time display of total, active, and commented logs
3. **Quick Navigation**: Click log items to jump to source location
4. **Fine-Grained Management**:
   - View logs grouped by folder/file
   - Comment/delete individual logs
   - One-click cleanup of entire file/folder logs

**Panel Interface Preview**:
```
📁 src/
  ├─ 📄 index.ts (5 logs)
  │   ├─ 📝 Line 12: console.log('user:', user)
  │   ├─ 📝 Line 24: console.log('result:', result)
  │   └─ ...
  └─ 📄 utils.ts (3 logs)
```

---

## ⚙️ Configuration Guide

### 🎨 Basic Configuration (All Languages)

Search for "Simple-Log" in VSCode settings, or edit `settings.json` directly:

```jsonc
{
  // Log prefix (use emoji or text)
  "simple-log.prefix": "📝",

  // Use template strings (JS/TS only)
  "simple-log.useBackticks": false,

  // Include timestamp
  "simple-log.includeTimestamp": false,

  // Include filename
  "simple-log.includeFilename": false,

  // Include line number
  "simple-log.includeLineNumber": false
}
```

**Configuration Effect Examples**:
```javascript
// Default configuration
console.log('📝 userName:', userName);

// With all options enabled
console.log('[2025-12-20 14:30:25] [index.ts:42] 📝 userName:', userName);
```

---

### 🧠 Smart Mode Configuration (JS/TS/JSX/TSX Only)

**Insertion Mode Selection**:

```jsonc
{
  // Choose insertion strategy
  "simple-log.insertMode": "smart"  // "simple" or "smart"
}
```

| Mode | Behavior | Speed | Accuracy | Supported Languages |
|------|----------|-------|----------|---------------------|
| **simple** | Insert at next line | ⚡ Instant | ✅ Good | **All languages** |
| **smart** | AST-based intelligent positioning | 🚀 Fast | ✅✅ Excellent | **JS/TS/JSX/TSX only** |

**When to Use Simple Mode**:
- ✅ You prefer simple, predictable behavior
- ✅ Working with very large files (> 10000 lines)
- ✅ Using non-JS/TS languages (Python, Java, Go, etc. auto-fallback)

**When to Use Smart Mode**:
- ✅ Working with complex nested structures
- ✅ Want to avoid syntax errors
- ✅ Developing JavaScript/TypeScript projects

---

### 🔧 Smart Mode Advanced Configuration

```jsonc
{
  // AST analysis scope
  "simple-log.astAnalysisScope": "file",  // "local" or "file"

  // Local analysis context lines (5-100)
  "simple-log.localContextLines": 15,

  // Maximum file lines for full parse (100-50000)
  "simple-log.maxFileLinesForFullParse": 10000
}
```

**Analysis Scope Comparison**:

| Scope | Description | Speed | Accuracy | Auto-Fallback |
|-------|-------------|-------|----------|---------------|
| **local** | Analyze ±N lines around cursor | ⚡ Ultra-fast (< 1ms) | ✅ Good | - |
| **file** | Analyze entire file | 🚀 Fast (2-10ms) | ✅✅ Best | Auto-switch to local for huge files |

**Performance Reference**:

| File Size | Simple Mode | Smart (local, 15 lines) | Smart (file) |
|-----------|------------|-------------------------|--------------|
| < 100 lines | Instant | ~1ms | ~2ms |
| 100-1000 lines | Instant | ~1ms | ~5ms |
| 1000-5000 lines | Instant | ~1ms | ~8ms |
| 5000-10000 lines | Instant | ~1ms | ~10ms |
| **> 10000 lines** | Instant | ~1ms | **Auto-fallback → local** |

**Recommended Configuration**:

```jsonc
{
  "simple-log.insertMode": "smart",              // Enable intelligent positioning
  "simple-log.astAnalysisScope": "file",         // Best accuracy
  "simple-log.localContextLines": 15,            // Good balance
  "simple-log.maxFileLinesForFullParse": 10000   // Safe default
}
```

**Performance Optimization Tips**:
- 💻 **High-Performance Machine**: Increase `maxFileLinesForFullParse` to 20000-50000
- 🐌 **Low-Performance Machine**: Reduce to 5000 or use `local` scope
- 📂 **Large Projects**: Use `local` scope for smooth experience

---

### 🎯 Tree View Configuration (Log Panel Filtering)

```jsonc
{
  // Exclude specific folders (supports regex)
  "simple-log.treeView.excludeFolders": [
    "node_modules",
    "dist",
    "build",
    "out",
    ".git"
  ],

  // Only include specific folders (supports regex)
  "simple-log.treeView.includeFolders": []  // Empty means scan all (except excluded)
}
```

---

## ⌨️ Keyboard Shortcuts

| Function | Windows/Linux | macOS | Description |
|----------|---------------|-------|-------------|
| Insert Log | `Ctrl+Shift+L` | `Cmd+Shift+L` | Insert log at cursor position |
| Comment All Logs | `Alt+Shift+C` | `Alt+Shift+C` | Comment all logs in current file |
| Delete All Logs | `Alt+Shift+D` | `Alt+Shift+D` | Delete all logs in current file |

> 💡 **Tip**: All shortcuts can be customized in VSCode keyboard settings

---

## 🛠️ Technical Architecture

### Performance Optimization

- **🦀 Rust Core**: Ultra-fast AST parsing based on [oxc-parser](https://github.com/oxc-project/oxc)
- **📊 Incremental Analysis**: Smart caching to avoid redundant parsing
- **🎯 On-Demand Loading**: AST analysis only when needed
- **⚡ Zero Blocking**: Asynchronous architecture, no impact on editor responsiveness

### Platform Support

Smart mode uses **oxc-parser** (written in Rust), requiring platform-specific native binaries. Supported:

```
✅ macOS (Intel & Apple Silicon)
✅ Windows (x64 & ARM64)
✅ Linux (x64 & ARM64, glibc & musl)
```

The correct binary is automatically installed based on your platform—no manual configuration needed!

---

## 🎬 Usage Examples

### JavaScript/TypeScript

```javascript
// Variable declaration
const userId = user.id;
console.log('📝 userId:', userId);

// Function call
const result = await fetchData();
console.log('📝 result:', result);

// Method chaining (intelligently recognizes complete chain)
const items = data
  .filter(x => x.active)
  .map(x => x.name);
console.log('📝 items:', items);

// Object literal
const config = {
  api: 'https://api.com',
  timeout: 3000
};
console.log('📝 config:', config);
```

### Python

```python
# Variable assignment
user_name = "Alice"
print(f"📝 user_name: {user_name}")

# Function call
result = calculate_total(items)
print(f"📝 result: {result}")

# List comprehension
numbers = [x * 2 for x in range(10)]
print(f"📝 numbers: {numbers}")
```

### Java

```java
// Variable declaration
String userName = user.getName();
System.out.println("📝 userName: " + userName);

// Method call
List<Item> items = repository.findAll();
System.out.println("📝 items: " + items);
```

### Go

```go
// Variable declaration
userName := user.Name
fmt.Printf("📝 userName: %v\n", userName)

// Function call
result, err := fetchData()
fmt.Printf("📝 result: %v\n", result)
```

---

## 🚀 Installation & Development

### Install from VSCode Marketplace

1. Open VSCode
2. Press `Ctrl+Shift+X` to open Extensions panel
3. Search for "Simple-Log"
4. Click Install

### Local Development

```bash
# Clone repository
git clone https://github.com/zwmmm/simple-log.git
cd simple-log

# Install dependencies
pnpm install

# Watch mode (auto-recompile)
pnpm run watch

# Build production version
pnpm run build

# Run tests
pnpm run test

# Code linting
pnpm run lint

# Debug extension (Press F5 in VSCode)
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit code, report issues, or suggest features.

### How to Contribute

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Reporting Issues

Found a bug or have a feature request? Please submit on [GitHub Issues](https://github.com/zwmmm/simple-log/issues).

---

## 📝 Changelog

### v0.1.0 (2025-12-20)

**🎉 Initial Release**

- ✅ Support for 8+ programming languages
- ✅ Smart/Simple dual-mode insertion
- ✅ Rust-based AST intelligent analysis
- ✅ Visual log management panel
- ✅ Batch comment/delete functionality
- ✅ Complete configuration options

---

## 💬 FAQ

<details>
<summary><strong>Q: Which languages does Smart mode support?</strong></summary>

A: Smart mode currently only supports **JavaScript, TypeScript, JSX, and TSX**. Other languages (Python, Java, Go, Vue, etc.) automatically use Simple mode.
</details>

<details>
<summary><strong>Q: Why is my log inserted at the wrong position?</strong></summary>

A: Possible reasons:
1. Current file is not JS/TS, Simple mode inserts at next line
2. File is too large (exceeds `maxFileLinesForFullParse` config), auto-fallback to local analysis
3. Try adjusting `astAnalysisScope` to `"file"` or increasing `localContextLines`
</details>

<details>
<summary><strong>Q: How do I customize log format?</strong></summary>

A: Adjust the following options in VSCode settings:
- `simple-log.prefix`: Change prefix symbol
- `simple-log.includeTimestamp`: Add timestamp
- `simple-log.includeFilename`: Add filename
- `simple-log.includeLineNumber`: Add line number
- `simple-log.useBackticks`: Use template strings (JS/TS)
</details>

<details>
<summary><strong>Q: How's the performance? Will it cause lag?</strong></summary>

A: Simple-Log uses Rust-written oxc-parser with excellent performance:
- Simple mode: Instant response
- Smart mode (small files): 1-5ms
- Smart mode (large files): Auto-fallback to local analysis, stays smooth
</details>

<details>
<summary><strong>Q: Can I unify configuration across my team?</strong></summary>

A: Yes! Add configurations to `.vscode/settings.json` in your project root, commit to version control, and team members will automatically apply these settings.
</details>

---

## 📄 License

This project is licensed under the [MIT](LICENSE) license.

---

## 👨‍💻 Author

**Wayne**

- GitHub: [@zwmmm](https://github.com/zwmmm)
- Project: [simple-log](https://github.com/zwmmm/simple-log)

---

## ⭐ Support This Project

If this project helps you, please consider:

- ⭐ Star it on GitHub
- 🐛 Report issues and suggestions
- 🤝 Contribute code
- 📢 Share with more developers

---

<div align="center">

**Thank you for using Simple-Log!**

Make debugging simpler, make development more efficient 🚀

</div>
