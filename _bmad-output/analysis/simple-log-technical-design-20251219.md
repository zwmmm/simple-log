# Simple-Log VSCode Extension - 技术设计文档

**项目名称**: Simple-Log
**版本**: 1.0.0
**创建日期**: 2025-12-19
**作者**: Wayne
**状态**: 设计阶段

---

## 目录

1. [项目概述](#项目概述)
2. [需求分析](#需求分析)
3. [架构设计](#架构设计)
4. [多语言支持策略](#多语言支持策略)
5. [核心功能实现](#核心功能实现)
6. [技术栈选择](#技术栈选择)
7. [项目结构](#项目结构)
8. [开发路线图](#开发路线图)
9. [实现示例代码](#实现示例代码)
10. [参考资料](#参考资料)

---

## 项目概述

### 1.1 项目定位

Simple-Log 是一款**轻量级、多语言支持的 VSCode 日志插件**，旨在提供快速、简单的日志插入功能，避免 turbo-console-log 的复杂性。

### 1.2 核心理念

- **简单至上（KISS）**: 不使用 AST 解析，直接基于光标位置插入
- **通用性优先**: 支持所有编程语言，不局限于 JavaScript/TypeScript
- **高性能**: 零解析开销，即时响应
- **易扩展**: 清晰的语言适配器模式，方便添加新语言支持

### 1.3 与 turbo-console-log 的对比

| 特性 | turbo-console-log | Simple-Log |
|------|------------------|------------|
| **AST 解析** | ✅ Acorn 解析器 | ❌ 无需解析 |
| **上下文感知** | ✅ 类名、函数名 | ❌ 简单变量识别 |
| **性能** | 中等（96ms 激活） | 极快（<10ms） |
| **包体积** | ~108KB | ~20KB（预估） |
| **语言支持** | JS/TS/PHP | 所有语言 |
| **实现复杂度** | 高 | 低 |
| **学习曲线** | 陡峭 | 平缓 |

---

## 需求分析

### 2.1 核心需求

#### **必需功能（MVP）**

1. ✅ **快速插入日志**
   - 快捷键触发（如 `Ctrl+Shift+L`）
   - 自动识别当前光标所在行的变量
   - 在下一行插入对应语言的日志语句

2. ✅ **多语言支持**
   - JavaScript/TypeScript: `console.log()`
   - Python: `print()`
   - Java: `System.out.println()`
   - Go: `fmt.Println()`
   - Rust: `println!()`
   - C/C++: `printf()` / `std::cout`
   - 其他语言可通过配置扩展

3. ✅ **批量管理**
   - 注释所有日志（`Alt+Shift+C`）
   - 删除所有日志（`Alt+Shift+D`）

#### **增强功能（V1.1+）**

4. ⭐ **自定义日志模板**
   - 用户可配置日志前缀/后缀
   - 支持时间戳、文件名、行号等占位符

5. ⭐ **多级日志支持**
   - Info、Debug、Warn、Error 等不同级别

### 2.2 非功能性需求

- **性能**: 插入日志响应时间 < 50ms
- **兼容性**: VSCode 1.80.0+
- **稳定性**: 错误率 < 0.1%
- **可维护性**: 代码覆盖率 > 80%

---

## 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────┐
│         VSCode Extension Host               │
├─────────────────────────────────────────────┤
│  Extension Entry (extension.ts)             │
│                                             │
│  ┌────────────────────────────────────────┐│
│  │  Command Manager                       ││
│  │  - registerCommands()                  ││
│  │  - insertLog                           ││
│  │  - commentAllLogs                      ││
│  │  - deleteAllLogs                       ││
│  └────────────────────────────────────────┘│
│                    ↓                        │
│  ┌────────────────────────────────────────┐│
│  │  Language Adapter Factory              ││
│  │  - detectLanguage()                    ││
│  │  - getAdapter(languageId)              ││
│  └────────────────────────────────────────┘│
│           ↓              ↓             ↓   │
│  ┌─────────────┐ ┌──────────────┐ ┌──────┐│
│  │ JS Adapter  │ │ Python Adapter│ │ ...  ││
│  │ - logSyntax │ │ - logSyntax   │ │      ││
│  │ - format()  │ │ - format()    │ │      ││
│  └─────────────┘ └──────────────┘ └──────┘│
│                    ↓                        │
│  ┌────────────────────────────────────────┐│
│  │  Log Inserter                          ││
│  │  - getCurrentVariable()                ││
│  │  - insertAtNextLine()                  ││
│  │  - formatLogMessage()                  ││
│  └────────────────────────────────────────┘│
│                    ↓                        │
│  ┌────────────────────────────────────────┐│
│  │  Config Manager                        ││
│  │  - getUserSettings()                   ││
│  │  - customTemplates                     ││
│  └────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
         ↓                    ↓
   VSCode API          Text Editor
```

### 3.2 设计模式

#### **1. 工厂模式（Factory Pattern）**
用于创建不同语言的适配器：

```typescript
class LanguageAdapterFactory {
  static getAdapter(languageId: string): ILanguageAdapter {
    switch (languageId) {
      case 'javascript':
      case 'typescript':
        return new JavaScriptAdapter();
      case 'python':
        return new PythonAdapter();
      case 'java':
        return new JavaAdapter();
      default:
        return new GenericAdapter();
    }
  }
}
```

#### **2. 策略模式（Strategy Pattern）**
每个语言适配器实现相同接口，但有不同的日志格式化策略：

```typescript
interface ILanguageAdapter {
  formatLog(variable: string, config: LogConfig): string;
  getCommentSyntax(): string;
  detectVariablePattern(): RegExp;
}
```

#### **3. 命令模式（Command Pattern）**
封装用户操作为独立命令：

```typescript
const commands = [
  { id: 'simple-log.insertLog', handler: insertLogCommand },
  { id: 'simple-log.commentAll', handler: commentAllCommand },
  { id: 'simple-log.deleteAll', handler: deleteAllCommand }
];
```

### 3.3 简化策略

#### **对比 turbo-console-log 的简化点：**

| 组件 | turbo-console-log | Simple-Log |
|------|------------------|------------|
| **变量识别** | AST 节点遍历 | 正则表达式匹配 |
| **上下文获取** | 完整作用域分析 | 当前行文本提取 |
| **代码插入** | 精确位置计算 | 简单的下一行插入 |
| **依赖项** | acorn, php-parser | 仅 VSCode API |

**简化方法：**
```typescript
// turbo-console-log 方式（复杂）
const ast = acorn.parse(code);
const variable = findVariableInAST(ast, cursorPosition);
const context = getEnclosingScope(ast, variable);

// Simple-Log 方式（简单）
const currentLine = editor.document.lineAt(position.line).text;
const variable = currentLine.match(/\b(\w+)\b/)?.[1];
```

---

## 多语言支持策略

### 4.1 语言适配器接口

```typescript
/**
 * 语言适配器接口
 * 每个支持的语言都需要实现此接口
 */
interface ILanguageAdapter {
  /**
   * 语言 ID（如 'javascript', 'python'）
   */
  readonly languageId: string;

  /**
   * 格式化日志语句
   * @param variable 变量名
   * @param config 配置项
   * @returns 格式化后的日志语句
   */
  formatLog(variable: string, config: LogConfig): string;

  /**
   * 获取注释语法
   * @returns 注释符号（如 '//', '#'）
   */
  getCommentSyntax(): string;

  /**
   * 获取变量识别正则表达式
   * @returns 用于匹配变量的正则
   */
  getVariablePattern(): RegExp;

  /**
   * 获取日志识别模式（用于批量操作）
   * @returns 用于识别本语言日志语句的正则
   */
  getLogPattern(): RegExp;
}
```

### 4.2 内置语言适配器

#### **JavaScript/TypeScript 适配器**

```typescript
class JavaScriptAdapter implements ILanguageAdapter {
  readonly languageId = 'javascript';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '🚀';
    const quote = config.useBackticks ? '`' : "'";

    if (config.useBackticks) {
      return `console.log(\`${prefix} ${variable}:\`, ${variable});`;
    }
    return `console.log(${quote}${prefix} ${variable}:${quote}, ${variable});`;
  }

  getCommentSyntax(): string {
    return '//';
  }

  getVariablePattern(): RegExp {
    // 匹配变量声明: const/let/var variable
    return /(?:const|let|var)\s+(\w+)/;
  }

  getLogPattern(): RegExp {
    // 匹配 console.log() 语句
    return /console\.log\([^)]*\);?/g;
  }
}
```

#### **Python 适配器**

```typescript
class PythonAdapter implements ILanguageAdapter {
  readonly languageId = 'python';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '🚀';
    return `print(f"${prefix} ${variable}: {${variable}}")`;
  }

  getCommentSyntax(): string {
    return '#';
  }

  getVariablePattern(): RegExp {
    // 匹配变量赋值: variable =
    return /(\w+)\s*=/;
  }

  getLogPattern(): RegExp {
    // 匹配 print() 语句
    return /print\([^)]*\)/g;
  }
}
```

#### **Java 适配器**

```typescript
class JavaAdapter implements ILanguageAdapter {
  readonly languageId = 'java';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '🚀';
    return `System.out.println("${prefix} ${variable}: " + ${variable});`;
  }

  getCommentSyntax(): string {
    return '//';
  }

  getVariablePattern(): RegExp {
    // 匹配 Java 变量声明
    return /(?:int|long|String|double|float|boolean|var)\s+(\w+)/;
  }

  getLogPattern(): RegExp {
    return /System\.out\.println\([^)]*\);?/g;
  }
}
```

#### **Go 适配器**

```typescript
class GoAdapter implements ILanguageAdapter {
  readonly languageId = 'go';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '🚀';
    return `fmt.Printf("${prefix} ${variable}: %v\\n", ${variable})`;
  }

  getCommentSyntax(): string {
    return '//';
  }

  getVariablePattern(): RegExp {
    // 匹配 Go 变量声明: var variable 或 variable :=
    return /(?:var\s+(\w+)|(\w+)\s*:=)/;
  }

  getLogPattern(): RegExp {
    return /fmt\.(?:Println|Printf)\([^)]*\)/g;
  }
}
```

#### **通用适配器（Fallback）**

```typescript
class GenericAdapter implements ILanguageAdapter {
  readonly languageId = 'generic';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || 'LOG';
    // 使用通用格式，依赖用户自定义模板
    return `// ${prefix}: ${variable} = ${variable}`;
  }

  getCommentSyntax(): string {
    return '//';
  }

  getVariablePattern(): RegExp {
    // 通用变量识别：简单的单词
    return /\b(\w+)\b/;
  }

  getLogPattern(): RegExp {
    // 匹配包含 LOG: 的注释
    return /\/\/\s*LOG:[^\n]*/g;
  }
}
```

### 4.3 语言适配器注册机制

```typescript
class LanguageAdapterRegistry {
  private static adapters = new Map<string, ILanguageAdapter>();

  static register(adapter: ILanguageAdapter): void {
    this.adapters.set(adapter.languageId, adapter);
  }

  static get(languageId: string): ILanguageAdapter {
    return this.adapters.get(languageId) || new GenericAdapter();
  }

  static initialize(): void {
    // 注册内置适配器
    this.register(new JavaScriptAdapter());
    this.register(new PythonAdapter());
    this.register(new JavaAdapter());
    this.register(new GoAdapter());
    // ... 更多适配器
  }
}
```

### 4.4 用户自定义适配器

用户可以通过配置文件添加新语言支持：

```json
{
  "simple-log.customLanguages": {
    "rust": {
      "logTemplate": "println!(\"{prefix} {variable}: {{:?}}\", {variable});",
      "commentSyntax": "//",
      "variablePattern": "let\\s+(\\w+)",
      "logPattern": "println!\\([^)]*\\)"
    },
    "ruby": {
      "logTemplate": "puts \"{prefix} {variable}: #{{{variable}}}\"",
      "commentSyntax": "#",
      "variablePattern": "(\\w+)\\s*=",
      "logPattern": "puts\\s+[^\\n]*"
    }
  }
}
```

---

## 核心功能实现

### 5.1 插入日志功能

#### **实现流程**

```
用户触发快捷键
    ↓
获取当前编辑器和光标位置
    ↓
识别文档语言 ID
    ↓
获取对应语言适配器
    ↓
提取当前行文本
    ↓
使用适配器的正则匹配变量名
    ↓
格式化日志语句
    ↓
在下一行插入日志
    ↓
调整光标位置
```

#### **核心代码**

```typescript
async function insertLogCommand() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  // 1. 获取语言适配器
  const languageId = editor.document.languageId;
  const adapter = LanguageAdapterRegistry.get(languageId);

  // 2. 获取当前光标位置和行文本
  const position = editor.selection.active;
  const currentLine = editor.document.lineAt(position.line);
  const lineText = currentLine.text;

  // 3. 提取变量名
  const variable = extractVariable(lineText, adapter);
  if (!variable) {
    vscode.window.showWarningMessage('未找到变量');
    return;
  }

  // 4. 获取用户配置
  const config = getLogConfig();

  // 5. 格式化日志语句
  const logStatement = adapter.formatLog(variable, config);

  // 6. 计算插入位置（下一行开头）
  const insertPosition = new vscode.Position(position.line + 1, 0);

  // 7. 获取当前行缩进
  const indent = getIndentation(lineText);

  // 8. 插入日志
  await editor.edit(editBuilder => {
    editBuilder.insert(insertPosition, `${indent}${logStatement}\n`);
  });

  // 9. 移动光标到插入的日志行
  const newPosition = new vscode.Position(position.line + 1, indent.length);
  editor.selection = new vscode.Selection(newPosition, newPosition);
}

function extractVariable(lineText: string, adapter: ILanguageAdapter): string | null {
  // 首先尝试使用适配器的模式
  const match = lineText.match(adapter.getVariablePattern());
  if (match) {
    return match[1] || match[2]; // 支持多个捕获组
  }

  // Fallback: 尝试简单的单词匹配
  const simpleMatch = lineText.match(/\b(\w+)\b/);
  return simpleMatch ? simpleMatch[1] : null;
}

function getIndentation(lineText: string): string {
  const match = lineText.match(/^(\s*)/);
  return match ? match[1] : '';
}

function getLogConfig(): LogConfig {
  const config = vscode.workspace.getConfiguration('simple-log');
  return {
    prefix: config.get('prefix', '🚀'),
    useBackticks: config.get('useBackticks', false),
    includeTimestamp: config.get('includeTimestamp', false),
    includeFilename: config.get('includeFilename', false)
  };
}
```

### 5.2 批量注释日志

```typescript
async function commentAllLogsCommand() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const languageId = document.languageId;
  const adapter = LanguageAdapterRegistry.get(languageId);

  // 获取日志识别模式
  const logPattern = adapter.getLogPattern();
  const commentSyntax = adapter.getCommentSyntax();

  const text = document.getText();
  const edits: vscode.TextEdit[] = [];

  // 查找所有匹配的日志语句
  let match;
  while ((match = logPattern.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const line = document.lineAt(startPos.line);

    // 检查是否已经被注释
    if (!line.text.trim().startsWith(commentSyntax)) {
      const lineStart = new vscode.Position(startPos.line, line.firstNonWhitespaceCharacterIndex);
      edits.push(vscode.TextEdit.insert(lineStart, `${commentSyntax} `));
    }
  }

  // 应用所有编辑
  if (edits.length > 0) {
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);

    vscode.window.showInformationMessage(`已注释 ${edits.length} 条日志`);
  } else {
    vscode.window.showInformationMessage('未找到日志语句');
  }
}
```

### 5.3 批量删除日志

```typescript
async function deleteAllLogsCommand() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  // 先请求确认
  const answer = await vscode.window.showWarningMessage(
    '确定要删除所有日志语句吗？',
    '确定',
    '取消'
  );

  if (answer !== '确定') return;

  const document = editor.document;
  const languageId = document.languageId;
  const adapter = LanguageAdapterRegistry.get(languageId);

  const logPattern = adapter.getLogPattern();
  const text = document.getText();
  const edits: vscode.TextEdit[] = [];

  // 查找所有日志语句并标记删除
  let match;
  while ((match = logPattern.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const line = document.lineAt(startPos.line);

    // 删除整行（包括换行符）
    const range = new vscode.Range(
      new vscode.Position(line.lineNumber, 0),
      new vscode.Position(line.lineNumber + 1, 0)
    );
    edits.push(vscode.TextEdit.delete(range));
  }

  // 应用删除
  if (edits.length > 0) {
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);

    vscode.window.showInformationMessage(`已删除 ${edits.length} 条日志`);
  } else {
    vscode.window.showInformationMessage('未找到日志语句');
  }
}
```

### 5.4 选中变量插入日志

```typescript
async function insertLogForSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selection = editor.selection;

  // 如果有选中文本，直接使用选中的文本作为变量名
  if (!selection.isEmpty) {
    const selectedText = editor.document.getText(selection);
    const variable = selectedText.trim();

    if (/^\w+$/.test(variable)) { // 验证是否为有效变量名
      const languageId = editor.document.languageId;
      const adapter = LanguageAdapterRegistry.get(languageId);
      const config = getLogConfig();
      const logStatement = adapter.formatLog(variable, config);

      const insertPosition = new vscode.Position(selection.end.line + 1, 0);
      const indent = getIndentation(editor.document.lineAt(selection.end.line).text);

      await editor.edit(editBuilder => {
        editBuilder.insert(insertPosition, `${indent}${logStatement}\n`);
      });
    } else {
      vscode.window.showWarningMessage('选中的文本不是有效的变量名');
    }
  } else {
    // 没有选中文本，回退到自动识别
    await insertLogCommand();
  }
}
```

---

## 技术栈选择

### 6.1 核心技术

| 技术 | 版本 | 用途 | 理由 |
|------|------|------|------|
| **TypeScript** | 5.3+ | 开发语言 | 类型安全、VSCode 官方推荐 |
| **VSCode Extension API** | 1.80.0+ | 扩展 API | 必需依赖 |
| **esbuild** | 0.19+ | 构建工具 | 极速构建、零配置 |
| **Jest** | 29+ | 单元测试 | 成熟的测试框架 |
| **ESLint** | 8+ | 代码检查 | 保证代码质量 |
| **Prettier** | 3+ | 代码格式化 | 统一代码风格 |

### 6.2 依赖项

```json
{
  "dependencies": {},
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^20.x",
    "typescript": "^5.3.0",
    "esbuild": "^0.19.0",
    "@vscode/test-electron": "^2.3.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.0.0"
  }
}
```

### 6.3 为什么不使用 AST 解析器？

| 方面 | 使用 AST（如 Acorn） | 不使用 AST（正则） |
|------|---------------------|------------------|
| **准确性** | 非常高 | 中等 |
| **性能** | 中等（需要解析） | 极高（直接匹配） |
| **包体积** | 大（~100KB+） | 小（~20KB） |
| **实现复杂度** | 高 | 低 |
| **多语言支持** | 困难（每种语言需要不同解析器） | 容易（正则即可） |
| **维护成本** | 高 | 低 |

**结论**: 对于 Simple-Log 的定位（简单、通用、快速），不使用 AST 是正确的选择。

---

## 项目结构

```
simple-log/
├── src/
│   ├── extension.ts                 # 扩展入口
│   ├── commands/
│   │   ├── insertLog.ts            # 插入日志命令
│   │   ├── commentAll.ts           # 注释所有日志
│   │   └── deleteAll.ts            # 删除所有日志
│   ├── adapters/
│   │   ├── ILanguageAdapter.ts     # 适配器接口
│   │   ├── LanguageAdapterRegistry.ts  # 适配器注册表
│   │   ├── JavaScriptAdapter.ts    # JS/TS 适配器
│   │   ├── PythonAdapter.ts        # Python 适配器
│   │   ├── JavaAdapter.ts          # Java 适配器
│   │   ├── GoAdapter.ts            # Go 适配器
│   │   └── GenericAdapter.ts       # 通用适配器
│   ├── utils/
│   │   ├── variableExtractor.ts    # 变量提取工具
│   │   ├── indentationHelper.ts    # 缩进处理
│   │   └── configManager.ts        # 配置管理
│   └── types/
│       └── index.ts                # 类型定义
├── test/
│   ├── unit/
│   │   ├── adapters.test.ts        # 适配器单元测试
│   │   └── utils.test.ts           # 工具函数测试
│   └── integration/
│       └── extension.test.ts       # 集成测试
├── .vscode/
│   ├── launch.json                 # 调试配置
│   ├── tasks.json                  # 任务配置
│   └── settings.json               # 工作区设置
├── package.json                    # 包配置
├── tsconfig.json                   # TypeScript 配置
├── .eslintrc.json                  # ESLint 配置
├── .prettierrc                     # Prettier 配置
├── esbuild.config.js               # esbuild 配置
├── README.md                       # 项目说明
├── CHANGELOG.md                    # 更新日志
└── LICENSE                         # 许可证
```

---

## 开发路线图

### Phase 1: MVP（2 周）

**目标**: 基础功能可用

- [x] 项目初始化
  - 创建 VSCode 扩展脚手架
  - 配置 TypeScript + esbuild
  - 设置测试环境

- [ ] 核心功能开发
  - 实现 JavaScript/TypeScript 适配器
  - 实现插入日志命令
  - 实现批量注释/删除命令
  - 基础配置项

- [ ] 测试与调试
  - 单元测试覆盖率 > 70%
  - 手动测试所有功能
  - 修复已知 bug

- [ ] 文档
  - 编写 README
  - 添加快捷键说明
  - 基础使用示例

**交付物**: 可发布的 v0.1.0 版本

---

### Phase 2: 多语言支持（1-2 周）

**目标**: 支持主流编程语言

- [ ] 添加更多语言适配器
  - Python 适配器
  - Java 适配器
  - Go 适配器
  - Rust 适配器
  - C/C++ 适配器

- [ ] 适配器测试
  - 每个适配器的单元测试
  - 跨语言集成测试

- [ ] 用户自定义语言支持
  - 实现配置文件语言定义
  - 动态加载自定义适配器

**交付物**: v0.2.0 版本

---

### Phase 3: 增强功能（2-3 周）

**目标**: 提升用户体验

- [ ] 高级配置
  - 自定义日志模板
  - 日志前缀/后缀配置
  - 时间戳、文件名、行号占位符

- [ ] 多级日志支持
  - Info、Debug、Warn、Error 级别
  - 不同级别的快捷键
  - 可视化级别选择

- [ ] 智能识别增强
  - 支持多个变量同时插入
  - 支持对象属性识别
  - 支持函数调用识别

- [ ] UI 增强
  - 状态栏显示日志数量
  - 日志管理侧边栏
  - 日志预览功能

**交付物**: v1.0.0 正式版

---

### Phase 4: 高级特性（长期）

- [ ] 性能优化
  - 大文件性能优化
  - 批量操作性能提升

- [ ] 集成功能
  - 与调试器集成
  - 日志导出功能
  - 日志分析工具

- [ ] 社区功能
  - 语言适配器市场
  - 模板分享
  - 用户反馈系统

---

## 实现示例代码

### 9.1 扩展入口 (extension.ts)

```typescript
import * as vscode from 'vscode';
import { LanguageAdapterRegistry } from './adapters/LanguageAdapterRegistry';
import { insertLogCommand } from './commands/insertLog';
import { commentAllLogsCommand } from './commands/commentAll';
import { deleteAllLogsCommand } from './commands/deleteAll';

export function activate(context: vscode.ExtensionContext) {
  console.log('Simple-Log extension is now active');

  // 初始化语言适配器注册表
  LanguageAdapterRegistry.initialize();

  // 注册命令
  const commands = [
    vscode.commands.registerCommand('simple-log.insertLog', insertLogCommand),
    vscode.commands.registerCommand('simple-log.commentAll', commentAllLogsCommand),
    vscode.commands.registerCommand('simple-log.deleteAll', deleteAllLogsCommand)
  ];

  // 将命令添加到上下文订阅
  commands.forEach(cmd => context.subscriptions.push(cmd));

  // 监听配置变化
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('simple-log')) {
        vscode.window.showInformationMessage('Simple-Log 配置已更新');
      }
    })
  );
}

export function deactivate() {
  console.log('Simple-Log extension is now deactivated');
}
```

### 9.2 配置文件 (package.json 片段)

```json
{
  "name": "simple-log",
  "displayName": "Simple-Log",
  "description": "轻量级、多语言支持的日志插件",
  "version": "0.1.0",
  "publisher": "wayne",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "simple-log.insertLog",
        "title": "Simple-Log: Insert Log"
      },
      {
        "command": "simple-log.commentAll",
        "title": "Simple-Log: Comment All Logs"
      },
      {
        "command": "simple-log.deleteAll",
        "title": "Simple-Log: Delete All Logs"
      }
    ],
    "keybindings": [
      {
        "command": "simple-log.insertLog",
        "key": "ctrl+shift+l",
        "mac": "cmd+shift+l",
        "when": "editorTextFocus"
      },
      {
        "command": "simple-log.commentAll",
        "key": "alt+shift+c",
        "mac": "alt+shift+c"
      },
      {
        "command": "simple-log.deleteAll",
        "key": "alt+shift+d",
        "mac": "alt+shift+d"
      }
    ],
    "configuration": {
      "title": "Simple-Log",
      "properties": {
        "simple-log.prefix": {
          "type": "string",
          "default": "🚀",
          "description": "日志前缀符号"
        },
        "simple-log.useBackticks": {
          "type": "boolean",
          "default": false,
          "description": "使用反引号（模板字符串）"
        },
        "simple-log.includeTimestamp": {
          "type": "boolean",
          "default": false,
          "description": "包含时间戳"
        },
        "simple-log.includeFilename": {
          "type": "boolean",
          "default": false,
          "description": "包含文件名"
        },
        "simple-log.customLanguages": {
          "type": "object",
          "default": {},
          "description": "自定义语言适配器配置"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run build",
    "build": "node esbuild.config.js --production",
    "watch": "node esbuild.config.js --watch",
    "test": "jest",
    "lint": "eslint src --ext ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

### 9.3 构建配置 (esbuild.config.js)

```javascript
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'out/extension.js',
    external: ['vscode'],
    logLevel: 'info',
    plugins: [
      /* 可以添加自定义插件 */
    ],
  });

  if (watch) {
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
```

### 9.4 类型定义 (types/index.ts)

```typescript
/**
 * 日志配置接口
 */
export interface LogConfig {
  /** 日志前缀 */
  prefix: string;

  /** 是否使用反引号（模板字符串） */
  useBackticks: boolean;

  /** 是否包含时间戳 */
  includeTimestamp: boolean;

  /** 是否包含文件名 */
  includeFilename: boolean;

  /** 是否包含行号 */
  includeLineNumber?: boolean;
}

/**
 * 语言适配器接口
 */
export interface ILanguageAdapter {
  readonly languageId: string;
  formatLog(variable: string, config: LogConfig): string;
  getCommentSyntax(): string;
  getVariablePattern(): RegExp;
  getLogPattern(): RegExp;
}

/**
 * 自定义语言配置
 */
export interface CustomLanguageConfig {
  logTemplate: string;
  commentSyntax: string;
  variablePattern: string;
  logPattern: string;
}
```

---

## 参考资料

### 10.1 技术研究

- [Technical Research: turbo-console-log](./technical-turbo-console-log-research-20251219.md)
  - 架构设计参考
  - 性能优化策略
  - 最佳实践总结

### 10.2 VSCode 扩展开发

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Extension Guides](https://code.visualstudio.com/api/extension-guides/overview)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

### 10.3 设计模式

- 工厂模式（Factory Pattern）
- 策略模式（Strategy Pattern）
- 命令模式（Command Pattern）
- 适配器模式（Adapter Pattern）

### 10.4 竞品分析

| 插件 | Stars | 特点 | 不足 |
|------|-------|------|------|
| turbo-console-log | 744 | AST 解析、上下文感知 | 复杂、仅 JS/TS/PHP |
| console-helper | 100+ | 简单快速 | 功能单一 |
| log-wrapper | 50+ | 多语言 | 不够灵活 |

**Simple-Log 的差异化优势**：
- ✅ 真正的多语言支持（不限于 Web 开发）
- ✅ 简单高效（无 AST 解析开销）
- ✅ 易扩展（清晰的适配器模式）
- ✅ 轻量级（包体积 < 50KB）

---

**文档版本**: 1.0
**最后更新**: 2025-12-19
**状态**: ✅ 设计完成，待开发

---

## 附录 A: 快速开始开发

### 创建项目

```bash
# 1. 使用 Yeoman 生成器创建项目
npm install -g yo generator-code
yo code

# 选择:
# ? What type of extension do you want to create? New Extension (TypeScript)
# ? What's the name of your extension? simple-log
# ? What's the identifier of your extension? simple-log
# ? What's the description of your extension? Lightweight multi-language log plugin
# ? Initialize a git repository? Yes
# ? Which bundler to use? esbuild
# ? Which package manager to use? npm

cd simple-log

# 2. 安装依赖
npm install

# 3. 开始开发
npm run watch

# 4. 按 F5 启动调试
```

### 开发流程

1. **编写代码** → `src/` 目录
2. **编写测试** → `test/` 目录
3. **运行测试** → `npm test`
4. **调试扩展** → 按 F5
5. **构建发布** → `npm run build` → `vsce package`

---

**准备好开始编码了吗？** 🚀
