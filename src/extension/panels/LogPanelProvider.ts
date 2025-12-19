import * as vscode from 'vscode';
import { LogScanner } from '../utils/LogScanner';
import { LogEntry } from '../types';

/**
 * 日志面板管理器
 * 管理 Webview Panel 的生命周期和交互
 */
export class LogPanelProvider {
  private static currentPanel: LogPanelProvider | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  /**
   * 创建或显示面板
   */
  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // 如果已存在面板，显示它
    if (LogPanelProvider.currentPanel) {
      LogPanelProvider.currentPanel.panel.reveal(column);
      LogPanelProvider.currentPanel.refresh();
      return;
    }

    // 创建新面板
    const panel = vscode.window.createWebviewPanel(
      'simpleLogPanel',
      '📝 Simple Log Manager',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    LogPanelProvider.currentPanel = new LogPanelProvider(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    // 初始化内容
    this.update();

    // 监听面板关闭
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // 监听消息
    this.panel.webview.onDidReceiveMessage(
      message => this.handleMessage(message),
      null,
      this.disposables
    );

    // 监听文档变化
    vscode.workspace.onDidChangeTextDocument(
      () => this.refresh(),
      null,
      this.disposables
    );

    // 监听活动编辑器变化
    vscode.window.onDidChangeActiveTextEditor(
      () => this.refresh(),
      null,
      this.disposables
    );
  }

  /**
   * 刷新面板内容
   */
  public refresh() {
    this.update();
  }

  /**
   * 更新面板内容
   */
  private update() {
    const webview = this.panel.webview;
    const logs = this.getCurrentLogs();
    const stats = LogScanner.getStatistics(logs);

    webview.html = this.getHtmlForWebview(webview, logs, stats);
  }

  /**
   * 获取当前文档的所有日志
   */
  private getCurrentLogs(): LogEntry[] {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return [];
    }

    return LogScanner.scanDocument(editor.document);
  }

  /**
   * 处理来自 webview 的消息
   */
  private async handleMessage(message: any) {
    switch (message.command) {
      case 'refresh':
        this.refresh();
        break;

      case 'commentAll':
        await vscode.commands.executeCommand('simple-log.commentAll');
        this.refresh();
        break;

      case 'deleteAll':
        await vscode.commands.executeCommand('simple-log.deleteAll');
        this.refresh();
        break;

      case 'jumpToLine':
        await this.jumpToLine(message.line);
        break;

      case 'commentLog':
        await this.commentLog(message.line);
        this.refresh();
        break;

      case 'deleteLog':
        await this.deleteLog(message.line);
        this.refresh();
        break;
    }
  }

  /**
   * 跳转到指定行
   */
  private async jumpToLine(lineNumber: number) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const position = new vscode.Position(lineNumber, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );

    await vscode.window.showTextDocument(editor.document);
  }

  /**
   * 注释单个日志
   */
  private async commentLog(lineNumber: number) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const line = editor.document.lineAt(lineNumber);
    const lineText = line.text;
    const commentSyntax = '//';

    if (lineText.trim().startsWith(commentSyntax)) {
      const newText = lineText.replace(new RegExp(`^(\\s*)${commentSyntax}\\s?`), '$1');
      await editor.edit(editBuilder => {
        editBuilder.replace(line.range, newText);
      });
    } else {
      const indent = lineText.match(/^\s*/)?.[0] || '';
      const content = lineText.trim();
      await editor.edit(editBuilder => {
        editBuilder.replace(line.range, `${indent}${commentSyntax} ${content}`);
      });
    }
  }

  /**
   * 删除单个日志
   */
  private async deleteLog(lineNumber: number) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    await editor.edit(editBuilder => {
      const range = new vscode.Range(
        lineNumber,
        0,
        lineNumber + 1,
        0
      );
      editBuilder.delete(range);
    });
  }

  /**
   * 生成 HTML 内容
   */
  private getHtmlForWebview(
    webview: vscode.Webview,
    logs: LogEntry[],
    stats: any
  ): string {
    const fileName = vscode.window.activeTextEditor?.document.fileName.split('/').pop() || 'No file';

    // 获取编译后的 webview 资源 URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview.css')
    );

    // CSP nonce for inline script
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Simple Log Manager</title>
  <link rel="stylesheet" href="${styleUri}">
  <style id="inline-data" type="application/json">${JSON.stringify({ logs, stats, fileName })}</style>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * 生成 CSP nonce
   */
  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * 清理资源
   */
  public dispose() {
    LogPanelProvider.currentPanel = undefined;

    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
