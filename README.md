# Simple-Log

A lightweight, multi-language log insertion tool for VSCode.

## Features

✨ **Multi-Language Support**
- JavaScript/TypeScript
- React (JSX/TSX)
- Vue
- Python
- Java
- Go
- More languages coming soon!

⚡ **Quick Operations**
- Insert log statements with one keystroke
- **Smart AST Analysis**: Intelligent insertion position detection **(JS/TS/JSX/TSX only)**
- Comment all logs in current file
- Delete all logs in current file
- **Log Manager Panel**: Visual management interface

🎨 **Customizable**
- Custom log prefix
- Template strings support
- Configurable format
- **AST Analysis Scope**: Choose between local (fast) or file (accurate) analysis
- **Insert Mode**: Simple or Smart (JS/TS only)

## Usage

### Insert Log (with Smart Positioning)
1. Place cursor on a variable line or select a variable
2. Press `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (Mac)
3. A log statement will be **intelligently inserted** at the optimal position

**Smart Features (JS/TS/JSX/TSX only):**
- ✅ Detects complete statements (functions, objects, chains)
- ✅ Avoids breaking syntax (no insertion in middle of arguments)
- ✅ Works with complex nested structures
- ✅ Powered by **oxc-parser** (Rust-based, ultra-fast)
- ⚠️ **Note**: Smart mode is only available for JavaScript/TypeScript files. Other languages use simple mode.

### Comment All Logs
- Press `Alt+Shift+C` to comment all log statements in current file

### Delete All Logs
- Press `Alt+Shift+D` to delete all log statements in current file

### Log Manager Panel
- Press `Ctrl+Alt+L` (Windows/Linux) or `Cmd+Alt+L` (Mac) to open the Log Manager Panel
- Visual interface to view, manage, and navigate all logs in the current file
- Features:
  - Statistics dashboard (total, active, commented logs)
  - Jump to log location
  - Comment/uncomment individual logs
  - Delete individual logs
  - Real-time updates

## Configuration

Configure Simple-Log in VSCode settings (`Ctrl/Cmd + ,` → search "Simple-Log"):

```json
{
  // Basic Settings
  "simple-log.prefix": "📝",
  "simple-log.useBackticks": false,
  "simple-log.includeTimestamp": false,
  "simple-log.includeFilename": false,
  "simple-log.includeLineNumber": false,

  // Insert Mode (NEW!)
  "simple-log.insertMode": "smart",  // "simple" or "smart"

  // Smart Mode Settings (only for JS/TS/JSX/TSX)
  "simple-log.astAnalysisScope": "file",  // "local" or "file"
  "simple-log.localContextLines": 15,      // 5-100 lines
  "simple-log.maxFileLinesForFullParse": 10000  // 100-50000 lines (user configurable)
}
```

### Insert Mode Options

**`simple-log.insertMode`** (Choose your insertion strategy)

| Mode | Behavior | Speed | Accuracy | Languages |
|------|----------|-------|----------|-----------|
| **`simple`** | Insert at next line | ⚡ Instant | ✅ Good | **All languages** |
| **`smart`** (default) | AST-based intelligent positioning | 🚀 Fast | ✅✅ Excellent | **JS/TS/JSX/TSX only** |

**When to use Simple Mode:**
- ✅ You prefer predictable, simple behavior
- ✅ Working with very large files (> 10000 lines)
- ✅ **Using non-JS/TS languages** (Python, Java, Go, Vue, etc.)
  - Note: Smart mode is **not supported** for these languages

**When to use Smart Mode:**
- ✅ Working with **JavaScript/TypeScript files** (JS/TS/JSX/TSX)
- ✅ Dealing with complex nested structures
- ✅ Want to avoid syntax errors (insertions mid-statement)
- ⚠️ **Limitation**: Only works for JS/TS files. Automatically falls back to simple mode for other languages.

### Smart Mode Settings

⚠️ **Important**: Smart mode only applies to **JavaScript, TypeScript, JSX, and TSX** files.
For Python, Java, Go, Vue and other languages, logs are always inserted at the next line regardless of this setting.

**`simple-log.astAnalysisScope`**
- `"file"` (default): Analyze entire file
  - 🚀 **Fast** - Most accurate for complex nesting
  - **Automatic fallback**: Files larger than `maxFileLinesForFullParse` will use `local`
- `"local"`: Analyze ±N lines around cursor
  - ⚡ **Instant** - Best for very large files
  - Good for most cases

**`simple-log.localContextLines`** (5-100, default: 15)
- Number of lines to analyze around cursor when scope is `"local"`
- Larger = more accurate but slightly slower
- Only applies to JS/TS/JSX/TSX files

**`simple-log.maxFileLinesForFullParse`** (100-50000, default: 10000, **user configurable**)
- Maximum file lines for full file analysis
- Files larger than this will automatically use `local` scope even if `file` is selected
- Prevents performance issues on very large files
- **You can adjust this based on your machine's performance**
  - Fast machine: Increase to 20000-50000
  - Slower machine: Decrease to 5000
- Only applies to JS/TS/JSX/TSX files

### Performance Comparison

| File Size | Simple Mode | Smart (local, 15) | Smart (file) |
|-----------|-------------|-------------------|--------------|
| < 100 lines | Instant | ~1ms | ~2ms |
| 100-1000 lines | Instant | ~1ms | ~5ms |
| 1000-10000 lines | Instant | ~1ms | ~10ms |
| **> 10000 lines** | Instant | ~1ms | **Auto → local (~1ms)** |

**Recommendation:**
```json
{
  "simple-log.insertMode": "smart",           // Enable intelligent positioning for JS/TS
  "simple-log.astAnalysisScope": "file",      // Most accurate (default)
  "simple-log.localContextLines": 15,         // Good balance (only used in local mode)
  "simple-log.maxFileLinesForFullParse": 10000 // Safe default (adjust based on your needs)
}
```

## Keyboard Shortcuts

| Command | Windows/Linux | macOS |
|---------|---------------|-------|
| Insert Log | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| Comment All | `Alt+Shift+C` | `Alt+Shift+C` |
| Delete All | `Alt+Shift+D` | `Alt+Shift+D` |
| **Log Manager Panel** | `Ctrl+Alt+L` | `Cmd+Alt+L` |

## Development

```bash
# Install dependencies
pnpm install

# Watch mode
pnpm run watch

# Build
pnpm run build

# Run extension (Press F5 in VSCode)
```

### Platform Support

Smart mode uses **oxc-parser**, a Rust-based parser that requires platform-specific native bindings. Supported platforms:

- ✅ macOS (Intel & Apple Silicon)
- ✅ Windows (x64 & ARM64)
- ✅ Linux (x64 & ARM64, glibc & musl)

The correct binary is automatically installed based on your platform via `optionalDependencies`. No manual configuration needed!

## License

MIT

## Author

Wayne
