# Simple-Log: 项目模板分析 & Panel 管理页设计

**文档类型**: 技术调研 & 设计文档
**创建日期**: 2025-12-19
**作者**: Wayne
**状态**: 设计阶段

---

## 目录

1. [VSCode 插件项目模板对比](#vscode-插件项目模板对比)
2. [推荐模板方案](#推荐模板方案)
3. [Panel 管理页需求分析](#panel-管理页需求分析)
4. [Panel 架构设计](#panel-架构设计)
5. [Panel UI 设计](#panel-ui-设计)
6. [Panel 技术实现](#panel-技术实现)
7. [完整代码示例](#完整代码示例)
8. [参考资料](#参考资料)

---

## VSCode 插件项目模板对比

### 1.1 官方模板

#### **Yeoman Generator (generator-code)**

**仓库**: [VSCode Extension API - Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension)

**特点**:
- ✅ 官方维护，最权威
- ✅ 支持 TypeScript/JavaScript
- ✅ 内置多种扩展类型选项
- ✅ 自动配置 esbuild/webpack
- ✅ 包含完整的测试框架设置

**使用方法**:
```bash
npx --package yo --package generator-code -- yo code
```

**优点**:
- 官方支持，持续更新
- 配置完善，开箱即用
- 文档齐全

**缺点**:
- 相对基础，需要手动添加高级功能
- 不包含 Webview UI 框架集成

**推荐度**: ⭐⭐⭐⭐⭐ (初学者和标准项目)

---

#### **Microsoft Official esbuild-sample**

**仓库**: [microsoft/vscode-extension-samples](https://github.com/microsoft/vscode-extension-samples/tree/main/esbuild-sample)

**特点**:
- ✅ 官方 esbuild 集成示例
- ✅ 最小化配置
- ✅ 生产环境优化

**优点**:
- 官方维护的最佳实践
- 配置简洁高效

**缺点**:
- 仅为示例，不是完整脚手架
- 需要手动整合其他功能

**推荐度**: ⭐⭐⭐⭐ (学习参考)

---

### 1.2 社区优质模板

#### **1. tjx666/awesome-vscode-extension-boilerplate** ⭐ 推荐

**仓库**: [GitHub - tjx666/awesome-vscode-extension-boilerplate](https://github.com/tjx666/awesome-vscode-extension-boilerplate)

**特点**:
- ✅ 现代化配置（esbuild + TypeScript）
- ✅ 完整的开发工具链
- ✅ 自动化设置脚本
- ✅ 内置最佳实践

**快速开始**:
```bash
npx setup-boilerplate
```

**技术栈**:
- TypeScript 5.x
- esbuild
- ESLint + Prettier
- Vitest (测试)

**优点**:
- ✅ 配置完善，开箱即用
- ✅ 持续更新，跟进最新标准
- ✅ 中文文档支持
- ✅ 适合生产环境

**缺点**:
- 不包含 Webview UI 框架

**推荐度**: ⭐⭐⭐⭐⭐ (生产项目首选)

---

#### **2. kiran7893/vscode-extension-react-boilerplate** ⭐ 推荐 (Webview)

**仓库**: [GitHub - kiran7893/vscode-extension-react-boilerplate](https://github.com/kiran7893/vscode-extension-react-boilerplate)

**特点**:
- ✅ React 19 + TypeScript
- ✅ Tailwind CSS 集成
- ✅ esbuild 快速打包
- ✅ 单一构建文件（Extension + Webview）
- ✅ 支持 HMR（热模块替换）

**技术栈**:
- React 19
- TypeScript
- Tailwind CSS
- esbuild
- VSCode Webview API

**优点**:
- ✅ 现代化 UI 开发体验
- ✅ 完整的 Webview 集成
- ✅ 生产级配置
- ✅ Tailwind CSS 开箱即用

**缺点**:
- React 依赖较重（对于简单插件）

**推荐度**: ⭐⭐⭐⭐⭐ (需要 Webview UI 的项目)

---

#### **3. joesobo/Vue3BaseExtension** (Vue 用户)

**仓库**: [GitHub - joesobo/Vue3BaseExtension](https://github.com/joesobo/Vue3BaseExtension)

**特点**:
- ✅ Vue 3 + Vite
- ✅ Sidebar Webview 模板
- ✅ TypeScript 支持

**优点**:
- Vue 生态系统
- Vite 快速构建

**缺点**:
- 社区维护，更新频率较低

**推荐度**: ⭐⭐⭐⭐ (Vue 开发者)

---

#### **4. Vite 插件方案** (现代化工作流)

**方案 A: @tomjs/vite-plugin-vscode**

**NPM**: [@tomjs/vite-plugin-vscode](https://www.npmjs.com/package/@tomjs/vite-plugin-vscode)

**特点**:
- ✅ 支持 Vue/React
- ✅ ESM/CJS 双模式
- ✅ HMR 支持
- ✅ 开发体验极佳

**方案 B: @czhlin/vite-plugin-vscode**

**NPM**: [@czhlin/vite-plugin-vscode](https://www.npmjs.com/package/@czhlin/vite-plugin-vscode)

**特点**:
- 类似 @tomjs，支持 Vue/React
- ESM/CJS 兼容

**推荐度**: ⭐⭐⭐⭐ (喜欢 Vite 工作流的开发者)

---

### 1.3 对比总结表

| 模板 | 技术栈 | Webview | 复杂度 | 维护 | 推荐场景 |
|------|--------|---------|--------|------|----------|
| **Yeoman (官方)** | TS/JS + esbuild | ❌ | 低 | 官方 | 初学者、标准项目 |
| **esbuild-sample** | TS + esbuild | ❌ | 极低 | 官方 | 学习参考 |
| **awesome-boilerplate** | TS + esbuild + Vitest | ❌ | 中 | 社区 | 生产项目（无 UI） |
| **react-boilerplate** | React 19 + Tailwind | ✅ | 中 | 社区 | Webview UI 项目 |
| **Vue3BaseExtension** | Vue 3 + Vite | ✅ | 中 | 社区 | Vue 开发者 |
| **Vite Plugin** | Vue/React + Vite | ✅ | 中高 | 社区 | 现代化工作流 |

---

## 推荐模板方案

### 2.1 Simple-Log 项目推荐

#### **方案 A: 基础版（无 Panel UI）**

**推荐模板**: `tjx666/awesome-vscode-extension-boilerplate`

**理由**:
- 轻量级，启动快
- 完整的 TypeScript + esbuild 配置
- 适合命令驱动的插件

**快速开始**:
```bash
git clone https://github.com/tjx666/awesome-vscode-extension-boilerplate.git simple-log
cd simple-log
npm install
npm run dev
```

---

#### **方案 B: 完整版（含 Panel UI）** ⭐ **推荐**

**推荐模板**: `kiran7893/vscode-extension-react-boilerplate`

**理由**:
- React + Tailwind CSS 现代化 UI
- 完整的 Webview 集成
- 单一构建流程
- 适合需要管理面板的项目

**快速开始**:
```bash
git clone https://github.com/kiran7893/vscode-extension-react-boilerplate.git simple-log
cd simple-log
npm install
npm run dev
```

**项目结构**:
```
simple-log/
├── src/
│   ├── extension/           # 扩展后端
│   │   └── extension.ts
│   └── webview/             # UI 前端
│       ├── App.tsx          # React 根组件
│       └── index.tsx
├── esbuild.js               # 统一构建配置
└── package.json
```

---

#### **方案 C: 混合方案（最灵活）**

从 Yeoman 官方模板开始，手动添加 Webview 功能：

```bash
# 1. 生成基础项目
npx --package yo --package generator-code -- yo code

# 2. 添加 React + Tailwind
npm install react react-dom
npm install -D @types/react @types/react-dom tailwindcss

# 3. 配置 Webview 构建
# 手动配置 esbuild 双入口打包
```

**优点**: 完全自定义，按需添加
**缺点**: 配置工作量大

---

### 2.2 Simple-Log 的最终选择

**推荐**: **方案 B - react-boilerplate** + **适度简化**

**原因**:
1. ✅ Panel 管理页是核心需求
2. ✅ React + Tailwind 开发效率高
3. ✅ 生产级配置，减少后期重构
4. ✅ 可以移除不需要的复杂功能

**简化策略**:
- 移除不需要的 React 高级特性
- 简化 Tailwind 配置（按需加载）
- 优化构建体积

---

## Panel 管理页需求分析

### 3.1 功能需求

#### **核心功能（MVP）**

1. **日志列表视图** 📋
   - 显示当前文件的所有日志
   - 展示日志位置（行号、内容预览）
   - 支持点击跳转到日志位置

2. **批量操作** 🔧
   - 一键注释所有日志
   - 一键删除所有日志
   - 选择性操作（勾选特定日志）

3. **统计信息** 📊
   - 当前文件日志总数
   - 按语言分类统计
   - 按类型分类（log/info/warn/error）

4. **快速插入** ⚡
   - 通过 Panel 插入日志
   - 选择日志类型
   - 配置日志模板

#### **增强功能（V1.1+）**

5. **工作区视图** 🗂️
   - 显示整个工作区的日志分布
   - 按文件分组
   - 搜索和过滤

6. **日志模板管理** 📝
   - 保存常用日志模板
   - 模板编辑器
   - 导入/导出模板

7. **主题定制** 🎨
   - 适配 VSCode 主题
   - 自定义颜色
   - 自定义图标

---

### 3.2 用户体验目标

- **响应速度**: 操作响应 < 100ms
- **视觉一致**: 与 VSCode 原生 UI 一致
- **操作便捷**: 最多 2 次点击完成操作
- **清晰明了**: 信息层次分明，避免混乱

---

## Panel 架构设计

### 4.1 整体架构

```
┌─────────────────────────────────────────────┐
│          VSCode Extension Host              │
│                                             │
│  ┌────────────────────────────────────────┐│
│  │  Extension (Node.js)                   ││
│  │  - Command Handlers                    ││
│  │  - Language Adapters                   ││
│  │  - Document Scanner                    ││
│  └──────────────┬─────────────────────────┘│
│                 │ Message Passing          │
│                 ↓                          │
│  ┌────────────────────────────────────────┐│
│  │  Webview Panel Provider                ││
│  │  - Panel Lifecycle Management          ││
│  │  - Message Router                      ││
│  └──────────────┬─────────────────────────┘│
│                 │ postMessage              │
└─────────────────┼──────────────────────────┘
                  │
┌─────────────────┼──────────────────────────┐
│  Webview Context (Browser)                 │
│                 ↓                          │
│  ┌────────────────────────────────────────┐│
│  │  React Application                     ││
│  │  ┌──────────────────────────────────┐ ││
│  │  │  Components                      │ ││
│  │  │  - LogList                       │ ││
│  │  │  - StatsPanel                    │ ││
│  │  │  - ActionBar                     │ ││
│  │  └──────────────────────────────────┘ ││
│  │  ┌──────────────────────────────────┐ ││
│  │  │  State Management (React Hooks)  │ ││
│  │  │  - useState                      │ ││
│  │  │  - useEffect                     │ ││
│  │  └──────────────────────────────────┘ ││
│  │  ┌──────────────────────────────────┐ ││
│  │  │  VSCode API Bridge               │ ││
│  │  │  - acquireVsCodeApi()            │ ││
│  │  │  - postMessage()                 │ ││
│  │  └──────────────────────────────────┘ ││
│  └────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### 4.2 消息通信协议

#### **Extension → Webview**

```typescript
type ExtensionMessage =
  | { type: 'updateLogs', logs: LogEntry[] }
  | { type: 'updateStats', stats: LogStats }
  | { type: 'error', message: string }
  | { type: 'success', message: string };
```

#### **Webview → Extension**

```typescript
type WebviewMessage =
  | { type: 'requestLogs' }
  | { type: 'jumpToLog', line: number }
  | { type: 'deleteLog', logId: string }
  | { type: 'commentLog', logId: string }
  | { type: 'deleteAllLogs' }
  | { type: 'commentAllLogs' }
  | { type: 'insertLog', config: LogConfig };
```

### 4.3 数据模型

```typescript
/**
 * 日志条目
 */
interface LogEntry {
  id: string;               // 唯一标识
  line: number;             // 行号
  content: string;          // 日志内容
  variable: string;         // 变量名
  type: LogType;            // 日志类型
  language: string;         // 语言 ID
  isCommented: boolean;     // 是否已注释
  fileUri: string;          // 文件 URI
}

/**
 * 日志类型
 */
type LogType = 'log' | 'info' | 'debug' | 'warn' | 'error';

/**
 * 统计信息
 */
interface LogStats {
  total: number;
  byType: Record<LogType, number>;
  byLanguage: Record<string, number>;
  commented: number;
  active: number;
}

/**
 * 日志配置
 */
interface LogConfig {
  prefix: string;
  type: LogType;
  useBackticks: boolean;
  includeTimestamp: boolean;
}
```

---

## Panel UI 设计

### 5.1 布局结构

```
┌─────────────────────────────────────────┐
│  Header                                 │
│  ┌───────────────────────────────────┐ │
│  │ 🚀 Simple-Log Manager             │ │
│  │ [Refresh] [Settings]              │ │
│  └───────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  Stats Panel                            │
│  ┌─────────┬─────────┬─────────┐       │
│  │ Total   │ Active  │ Comment │       │
│  │  12     │   9     │    3    │       │
│  └─────────┴─────────┴─────────┘       │
├─────────────────────────────────────────┤
│  Action Bar                             │
│  [Comment All] [Delete All] [Insert Log]│
├─────────────────────────────────────────┤
│  Log List                               │
│  ┌───────────────────────────────────┐ │
│  │ ☑ Line 12: console.log('user')   │ │
│  │   └─ user                         │ │
│  │   [Jump] [Comment] [Delete]       │ │
│  ├───────────────────────────────────┤ │
│  │ ☑ Line 25: console.warn('error') │ │
│  │   └─ error                        │ │
│  │   [Jump] [Comment] [Delete]       │ │
│  ├───────────────────────────────────┤ │
│  │ ☐ Line 45: // console.log(...)   │ │
│  │   └─ data (commented)             │ │
│  │   [Jump] [Uncomment] [Delete]     │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 5.2 组件层次

```
<SimpleLogPanel>
  ├─ <Header>
  │   ├─ <Title />
  │   └─ <ActionButtons />
  │       ├─ <RefreshButton />
  │       └─ <SettingsButton />
  │
  ├─ <StatsPanel>
  │   ├─ <StatCard label="Total" value={12} />
  │   ├─ <StatCard label="Active" value={9} />
  │   └─ <StatCard label="Commented" value={3} />
  │
  ├─ <ActionBar>
  │   ├─ <Button>Comment All</Button>
  │   ├─ <Button>Delete All</Button>
  │   └─ <Button>Insert Log</Button>
  │
  └─ <LogList>
      └─ {logs.map(log => (
          <LogItem
            key={log.id}
            log={log}
            onJump={handleJump}
            onComment={handleComment}
            onDelete={handleDelete}
          />
        ))}
```

### 5.3 UI 风格

#### **颜色方案**（适配 VSCode 主题）

```css
/* Light Theme */
--bg-primary: var(--vscode-editor-background);
--bg-secondary: var(--vscode-sideBar-background);
--text-primary: var(--vscode-editor-foreground);
--text-secondary: var(--vscode-descriptionForeground);
--border-color: var(--vscode-panel-border);
--accent-color: var(--vscode-focusBorder);

/* Interactive Elements */
--button-bg: var(--vscode-button-background);
--button-hover: var(--vscode-button-hoverBackground);
--button-text: var(--vscode-button-foreground);
```

#### **图标系统**

使用 VSCode Codicons:
```tsx
import { VscRefresh, VscSettingsGear, VscTrash, VscComment, VscDebugStepOver } from 'react-icons/vsc';
```

---

## Panel 技术实现

### 6.1 Extension 端实现

#### **Panel Provider (LogPanelProvider.ts)**

```typescript
import * as vscode from 'vscode';

export class LogPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'simple-log.logPanel';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 监听来自 Webview 的消息
    webviewView.webview.onDidReceiveMessage(async message => {
      await this._handleMessage(message);
    });

    // 监听文档变化，更新日志列表
    vscode.workspace.onDidChangeTextDocument(() => {
      this._updateLogs();
    });

    // 初始加载
    this._updateLogs();
  }

  private async _handleMessage(message: any) {
    switch (message.type) {
      case 'requestLogs':
        await this._updateLogs();
        break;

      case 'jumpToLog':
        await this._jumpToLog(message.line);
        break;

      case 'deleteLog':
        await this._deleteLog(message.logId);
        break;

      case 'commentLog':
        await this._commentLog(message.logId);
        break;

      case 'deleteAllLogs':
        await vscode.commands.executeCommand('simple-log.deleteAll');
        break;

      case 'commentAllLogs':
        await vscode.commands.executeCommand('simple-log.commentAll');
        break;

      case 'insertLog':
        await this._insertLog(message.config);
        break;
    }
  }

  private async _updateLogs() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this._view) return;

    const logs = await this._scanLogs(editor.document);
    const stats = this._calculateStats(logs);

    this._view.webview.postMessage({
      type: 'updateLogs',
      logs: logs
    });

    this._view.webview.postMessage({
      type: 'updateStats',
      stats: stats
    });
  }

  private async _scanLogs(document: vscode.TextDocument): Promise<LogEntry[]> {
    const logs: LogEntry[] = [];
    const languageId = document.languageId;
    const adapter = LanguageAdapterRegistry.get(languageId);
    const logPattern = adapter.getLogPattern();

    const text = document.getText();
    let match;

    while ((match = logPattern.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const line = document.lineAt(startPos.line);

      logs.push({
        id: `${document.uri.toString()}-${line.lineNumber}`,
        line: line.lineNumber,
        content: line.text.trim(),
        variable: this._extractVariable(line.text),
        type: this._detectLogType(line.text),
        language: languageId,
        isCommented: line.text.trim().startsWith(adapter.getCommentSyntax()),
        fileUri: document.uri.toString()
      });
    }

    return logs;
  }

  private _extractVariable(text: string): string {
    // 简单提取变量名逻辑
    const match = text.match(/['"`].*?(\w+):?\s*['"`]/);
    return match ? match[1] : 'unknown';
  }

  private _detectLogType(text: string): LogType {
    if (text.includes('.error')) return 'error';
    if (text.includes('.warn')) return 'warn';
    if (text.includes('.debug')) return 'debug';
    if (text.includes('.info')) return 'info';
    return 'log';
  }

  private _calculateStats(logs: LogEntry[]): LogStats {
    return {
      total: logs.length,
      byType: logs.reduce((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        return acc;
      }, {} as Record<LogType, number>),
      byLanguage: logs.reduce((acc, log) => {
        acc[log.language] = (acc[log.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      commented: logs.filter(l => l.isCommented).length,
      active: logs.filter(l => !l.isCommented).length
    };
  }

  private async _jumpToLog(line: number) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );
  }

  private async _deleteLog(logId: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const line = this._extractLineFromId(logId);
    await editor.edit(editBuilder => {
      const lineRange = editor.document.lineAt(line).rangeIncludingLineBreak;
      editBuilder.delete(lineRange);
    });

    this._updateLogs();
  }

  private async _commentLog(logId: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const line = this._extractLineFromId(logId);
    const languageId = editor.document.languageId;
    const adapter = LanguageAdapterRegistry.get(languageId);
    const commentSyntax = adapter.getCommentSyntax();

    await editor.edit(editBuilder => {
      const lineObj = editor.document.lineAt(line);
      const indent = lineObj.firstNonWhitespaceCharacterIndex;
      const insertPos = new vscode.Position(line, indent);
      editBuilder.insert(insertPos, `${commentSyntax} `);
    });

    this._updateLogs();
  }

  private async _insertLog(config: LogConfig) {
    await vscode.commands.executeCommand('simple-log.insertLog');
    this._updateLogs();
  }

  private _extractLineFromId(logId: string): number {
    const parts = logId.split('-');
    return parseInt(parts[parts.length - 1], 10);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview.js')
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview.css')
    );

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Simple-Log Manager</title>
    </head>
    <body>
        <div id="root"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}
```

#### **注册 Panel (extension.ts)**

```typescript
import * as vscode from 'vscode';
import { LogPanelProvider } from './panels/LogPanelProvider';

export function activate(context: vscode.ExtensionContext) {
  // 注册 Webview Panel Provider
  const provider = new LogPanelProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      LogPanelProvider.viewType,
      provider
    )
  );

  // ... 其他命令注册
}
```

---

### 6.2 Webview 端实现

#### **React App (App.tsx)**

```tsx
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsPanel } from './components/StatsPanel';
import { ActionBar } from './components/ActionBar';
import { LogList } from './components/LogList';
import { LogEntry, LogStats } from './types';

// 获取 VSCode API
const vscode = acquireVsCodeApi();

export const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats>({
    total: 0,
    byType: { log: 0, info: 0, debug: 0, warn: 0, error: 0 },
    byLanguage: {},
    commented: 0,
    active: 0
  });

  useEffect(() => {
    // 监听来自 Extension 的消息
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'updateLogs':
          setLogs(message.logs);
          break;

        case 'updateStats':
          setStats(message.stats);
          break;

        case 'error':
          console.error(message.message);
          break;

        case 'success':
          console.log(message.message);
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    // 请求初始数据
    vscode.postMessage({ type: 'requestLogs' });

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  const handleJumpToLog = (line: number) => {
    vscode.postMessage({ type: 'jumpToLog', line });
  };

  const handleDeleteLog = (logId: string) => {
    vscode.postMessage({ type: 'deleteLog', logId });
  };

  const handleCommentLog = (logId: string) => {
    vscode.postMessage({ type: 'commentLog', logId });
  };

  const handleDeleteAll = () => {
    if (confirm('确定删除所有日志吗？')) {
      vscode.postMessage({ type: 'deleteAllLogs' });
    }
  };

  const handleCommentAll = () => {
    vscode.postMessage({ type: 'commentAllLogs' });
  };

  const handleInsertLog = () => {
    vscode.postMessage({
      type: 'insertLog',
      config: { prefix: '🚀', type: 'log' }
    });
  };

  return (
    <div className="simple-log-panel">
      <Header />
      <StatsPanel stats={stats} />
      <ActionBar
        onCommentAll={handleCommentAll}
        onDeleteAll={handleDeleteAll}
        onInsertLog={handleInsertLog}
      />
      <LogList
        logs={logs}
        onJump={handleJumpToLog}
        onComment={handleCommentLog}
        onDelete={handleDeleteLog}
      />
    </div>
  );
};
```

#### **LogList Component (LogList.tsx)**

```tsx
import React from 'react';
import { LogEntry } from '../types';
import { VscDebugStepOver, VscComment, VscTrash } from 'react-icons/vsc';

interface LogListProps {
  logs: LogEntry[];
  onJump: (line: number) => void;
  onComment: (logId: string) => void;
  onDelete: (logId: string) => void;
}

export const LogList: React.FC<LogListProps> = ({
  logs,
  onJump,
  onComment,
  onDelete
}) => {
  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <p>当前文件没有日志</p>
      </div>
    );
  }

  return (
    <div className="log-list">
      {logs.map(log => (
        <div
          key={log.id}
          className={`log-item ${log.isCommented ? 'commented' : ''}`}
        >
          <div className="log-header">
            <input type="checkbox" />
            <span className="log-line">Line {log.line}</span>
            <span className={`log-type type-${log.type}`}>{log.type}</span>
          </div>

          <div className="log-content">
            <code>{log.content}</code>
          </div>

          <div className="log-variable">
            <span>变量: {log.variable}</span>
          </div>

          <div className="log-actions">
            <button
              className="btn-icon"
              onClick={() => onJump(log.line)}
              title="跳转"
            >
              <VscDebugStepOver />
            </button>

            <button
              className="btn-icon"
              onClick={() => onComment(log.id)}
              title={log.isCommented ? '取消注释' : '注释'}
            >
              <VscComment />
            </button>

            <button
              className="btn-icon btn-danger"
              onClick={() => onDelete(log.id)}
              title="删除"
            >
              <VscTrash />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### **StatsPanel Component (StatsPanel.tsx)**

```tsx
import React from 'react';
import { LogStats } from '../types';

interface StatsPanelProps {
  stats: LogStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="stats-panel">
      <div className="stat-card">
        <div className="stat-value">{stats.total}</div>
        <div className="stat-label">总计</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.active}</div>
        <div className="stat-label">活动</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.commented}</div>
        <div className="stat-label">已注释</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.byType.error || 0}</div>
        <div className="stat-label">错误</div>
      </div>
    </div>
  );
};
```

#### **样式文件 (webview.css)**

```css
/* VSCode 主题变量 */
:root {
  --bg-primary: var(--vscode-editor-background);
  --bg-secondary: var(--vscode-sideBar-background);
  --text-primary: var(--vscode-editor-foreground);
  --text-secondary: var(--vscode-descriptionForeground);
  --border-color: var(--vscode-panel-border);
  --accent-color: var(--vscode-focusBorder);
  --button-bg: var(--vscode-button-background);
  --button-hover: var(--vscode-button-hoverBackground);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  padding: 0;
  overflow-x: hidden;
}

.simple-log-panel {
  padding: 16px;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
}

/* Stats Panel */
.stats-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 4px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Action Bar */
.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 12px;
  background: var(--button-bg);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.btn:hover {
  background: var(--button-hover);
}

.btn-icon {
  padding: 6px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--bg-secondary);
  border-color: var(--accent-color);
}

.btn-danger:hover {
  background: rgba(255, 0, 0, 0.1);
  border-color: rgba(255, 0, 0, 0.5);
}

/* Log List */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
  transition: border-color 0.2s;
}

.log-item:hover {
  border-color: var(--accent-color);
}

.log-item.commented {
  opacity: 0.6;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.log-line {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
}

.log-type {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-log {
  background: rgba(0, 122, 204, 0.2);
  color: rgb(0, 122, 204);
}

.type-error {
  background: rgba(255, 0, 0, 0.2);
  color: rgb(255, 100, 100);
}

.type-warn {
  background: rgba(255, 165, 0, 0.2);
  color: rgb(255, 165, 0);
}

.log-content {
  margin-bottom: 8px;
}

.log-content code {
  font-family: var(--vscode-editor-font-family);
  font-size: 13px;
  color: var(--text-primary);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-variable {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.log-actions {
  display: flex;
  gap: 6px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-state p {
  font-size: 14px;
}
```

---

### 6.3 package.json 配置

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "simple-log-sidebar",
          "title": "Simple-Log",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "views": {
      "simple-log-sidebar": [
        {
          "type": "webview",
          "id": "simple-log.logPanel",
          "name": "Log Manager",
          "contextualTitle": "Simple-Log Manager"
        }
      ]
    }
  }
}
```

---

## 完整代码示例

### 7.1 项目结构（完整版）

```
simple-log/
├── src/
│   ├── extension/                  # Extension 后端
│   │   ├── extension.ts           # 入口
│   │   ├── commands/
│   │   │   ├── insertLog.ts
│   │   │   ├── commentAll.ts
│   │   │   └── deleteAll.ts
│   │   ├── adapters/
│   │   │   ├── ILanguageAdapter.ts
│   │   │   ├── LanguageAdapterRegistry.ts
│   │   │   ├── JavaScriptAdapter.ts
│   │   │   └── ...
│   │   ├── panels/
│   │   │   └── LogPanelProvider.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   └── webview/                    # Webview UI
│       ├── index.tsx              # React 入口
│       ├── App.tsx                # 主应用
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── StatsPanel.tsx
│       │   ├── ActionBar.tsx
│       │   └── LogList.tsx
│       ├── types/
│       │   └── index.ts
│       └── styles/
│           └── webview.css
│
├── out/                            # 构建输出
│   ├── extension.js
│   ├── webview.js
│   └── webview.css
│
├── resources/
│   └── icon.svg
│
├── esbuild.config.js               # 双入口构建配置
├── package.json
├── tsconfig.json
└── README.md
```

### 7.2 esbuild 双入口配置

```javascript
const esbuild = require('esbuild');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * 构建 Extension (Node.js)
 */
async function buildExtension() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'out/extension.js',
    external: ['vscode'],
    logLevel: 'info',
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

/**
 * 构建 Webview (Browser)
 */
async function buildWebview() {
  const ctx = await esbuild.context({
    entryPoints: ['src/webview/index.tsx'],
    bundle: true,
    format: 'esm',
    minify: production,
    sourcemap: !production,
    platform: 'browser',
    outfile: 'out/webview.js',
    external: [],
    logLevel: 'info',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
    },
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

/**
 * 复制 CSS
 */
const fs = require('fs');
function copyCSS() {
  fs.copyFileSync(
    path.join(__dirname, 'src/webview/styles/webview.css'),
    path.join(__dirname, 'out/webview.css')
  );
}

async function main() {
  try {
    await Promise.all([buildExtension(), buildWebview()]);
    copyCSS();
    console.log('✅ Build complete!');

    if (watch) {
      console.log('👀 Watching for changes...');
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
```

---

## 参考资料

### 8.1 官方文档

- [VSCode Extension API - Webview](https://code.visualstudio.com/api/extension-guides/webview)
- [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension)
- [Bundling Extensions](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)
- [VSCode Webview UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/docs/getting-started.md)

### 8.2 项目模板

- [microsoft/vscode-extension-samples - esbuild-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/esbuild-sample)
- [tjx666/awesome-vscode-extension-boilerplate](https://github.com/tjx666/awesome-vscode-extension-boilerplate)
- [kiran7893/vscode-extension-react-boilerplate](https://github.com/kiran7893/vscode-extension-react-boilerplate)
- [joesobo/Vue3BaseExtension](https://github.com/joesobo/Vue3BaseExtension)
- [HuyQLuong/vscode-webview-extension-with-react](https://github.com/HuyQLuong/vscode-webview-extension-with-react)

### 8.3 Webview 通信

- [Simplify VSCode Extension Webview Communication - Elio Struyf](https://www.eliostruyf.com/simplify-communication-visual-studio-code-extension-webview/)
- [VsCode extension using webview and message posting - DEV](https://dev.to/coderallan/vscode-extension-using-webview-and-message-posting-5435)

### 8.4 工具和插件

- [@tomjs/vite-plugin-vscode - npm](https://www.npmjs.com/package/@tomjs/vite-plugin-vscode)
- [@czhlin/vite-plugin-vscode - npm](https://www.npmjs.com/package/@czhlin/vite-plugin-vscode)

### 8.5 开发指南

- [How to Make a VS Code Extension Using TypeScript - DEV](https://dev.to/fabrikapp/how-to-make-a-vs-code-extension-using-typescript-a-step-by-step-guide-1hp6)
- [TypeScript in Visual Studio Code](https://code.visualstudio.com/docs/languages/typescript)

---

**文档完成日期**: 2025-12-19
**最后更新**: 2025-12-19
**状态**: ✅ 设计完成

---

## 附录：快速开始 Panel 开发

### 推荐开发流程

```bash
# 1. 克隆推荐模板
git clone https://github.com/kiran7893/vscode-extension-react-boilerplate.git simple-log
cd simple-log

# 2. 安装依赖
npm install

# 3. 启动开发模式（支持 HMR）
npm run dev

# 4. 按 F5 启动调试，Panel 会自动显示

# 5. 修改代码，实时预览
# - Extension: src/extension/
# - Webview: src/webview/

# 6. 构建生产版本
npm run build

# 7. 打包发布
vsce package
```

### 调试技巧

**Webview 调试**:
1. 打开 Command Palette (`Cmd+Shift+P`)
2. 输入 "Developer: Open Webview Developer Tools"
3. 在 DevTools 中调试 React 代码

**Extension 调试**:
- 直接在 VSCode 中设置断点
- 使用 Debug Console 查看输出

---

**准备好开始开发 Panel 了吗？** 🎨
