import * as vscode from 'vscode';
import { LanguageAdapterRegistry } from './adapters/LanguageAdapterRegistry';
import { insertLogCommand } from './commands/insertLog';
import { commentAllLogsCommand } from './commands/commentAll';
import { deleteAllLogsCommand } from './commands/deleteAll';
import { LogTreeDataProvider } from './providers/LogTreeDataProvider';
import { LogTreeItem } from './providers/LogTreeItem';
import { LogEntry } from './types';

/**
 * 扩展激活时调用
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Simple-Log extension is now active');

  // 初始化语言适配器注册表
  LanguageAdapterRegistry.initialize();

  // 获取工作区根路径
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

  // 创建 TreeView 数据提供器
  const treeDataProvider = new LogTreeDataProvider(workspaceRoot);

  // 注册 TreeView
  const treeView = vscode.window.createTreeView('simpleLogTreeView', {
    treeDataProvider,
    showCollapseAll: true
  });

  context.subscriptions.push(treeView);

  // 注册命令
  const commands = [
    // 原有命令
    vscode.commands.registerCommand('simple-log.insertLog', insertLogCommand),
    vscode.commands.registerCommand('simple-log.commentAll', commentAllLogsCommand),
    vscode.commands.registerCommand('simple-log.deleteAll', deleteAllLogsCommand),

    // TreeView 命令
    vscode.commands.registerCommand('simple-log.refreshTree', () => {
      treeDataProvider.refresh();
      vscode.window.showInformationMessage('Log tree refreshed');
    }),

    vscode.commands.registerCommand('simple-log.deleteFolder', async (item: LogTreeItem) => {
      await handleDeleteNode(item, treeDataProvider, 'folder');
    }),

    vscode.commands.registerCommand('simple-log.deleteFile', async (item: LogTreeItem) => {
      await handleDeleteNode(item, treeDataProvider, 'file');
    }),

    vscode.commands.registerCommand('simple-log.deleteLogItem', async (item: LogTreeItem) => {
      await handleDeleteLog(item, treeDataProvider);
    }),

    vscode.commands.registerCommand('simple-log.jumpToLog', async (item: LogTreeItem) => {
      await handleJumpToLog(item);
    })
  ];

  // 将命令添加到上下文订阅
  commands.forEach(cmd => context.subscriptions.push(cmd));

  // 监听配置变化
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('simple-log')) {
        console.log('Simple-Log configuration updated');
      }
    })
  );

  // 监听文档变化，自动刷新 TreeView
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      treeDataProvider.refresh();
    })
  );

  console.log(`Simple-Log: Registered ${commands.length} commands`);
  console.log(`Simple-Log: Supporting ${LanguageAdapterRegistry.getSupportedLanguages().length} languages`);
}

/**
 * 处理删除节点（文件夹或文件）
 */
async function handleDeleteNode(
  item: LogTreeItem,
  treeDataProvider: LogTreeDataProvider,
  nodeType: 'folder' | 'file'
) {
  const logs = treeDataProvider.getNodeLogs(item);

  if (logs.length === 0) {
    vscode.window.showInformationMessage('No logs to delete');
    return;
  }

  const nodeLabel = item.nodeData.label;
  const typeLabel = nodeType === 'folder' ? 'folder' : 'file';

  const confirm = await vscode.window.showWarningMessage(
    `Delete all ${logs.length} logs in ${typeLabel} "${nodeLabel}"?`,
    { modal: true },
    'Delete'
  );

  if (confirm !== 'Delete') {
    return;
  }

  // 按文件分组删除
  const fileMap = new Map<string, LogEntry[]>();
  for (const log of logs) {
    if (!fileMap.has(log.fileUri)) {
      fileMap.set(log.fileUri, []);
    }
    fileMap.get(log.fileUri)!.push(log);
  }

  let deletedCount = 0;

  for (const [fileUri, fileLogs] of fileMap) {
    try {
      const uri = vscode.Uri.parse(fileUri);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });

      // 按行号降序排序，从后往前删除（避免行号变化）
      fileLogs.sort((a, b) => b.line - a.line);

      await editor.edit(editBuilder => {
        for (const log of fileLogs) {
          const range = new vscode.Range(log.line, 0, log.line + 1, 0);
          editBuilder.delete(range);
        }
      });

      await document.save();
      deletedCount += fileLogs.length;
    } catch (error) {
      console.error(`Failed to delete logs in ${fileUri}:`, error);
      vscode.window.showErrorMessage(`Failed to delete logs: ${error}`);
    }
  }

  if (deletedCount > 0) {
    vscode.window.showInformationMessage(`Deleted ${deletedCount} logs`);
    treeDataProvider.refresh();
  }
}

/**
 * 处理删除单个日志
 */
async function handleDeleteLog(item: LogTreeItem, treeDataProvider: LogTreeDataProvider) {
  const log = item.nodeData.logEntry;
  if (!log) {
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    'Delete this log?',
    { modal: true },
    'Delete'
  );

  if (confirm !== 'Delete') {
    return;
  }

  try {
    const uri = vscode.Uri.parse(log.fileUri);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });

    await editor.edit(editBuilder => {
      const range = new vscode.Range(log.line, 0, log.line + 1, 0);
      editBuilder.delete(range);
    });

    await document.save();
    vscode.window.showInformationMessage('Log deleted');
    treeDataProvider.refresh();
  } catch (error) {
    console.error('Failed to delete log:', error);
    vscode.window.showErrorMessage(`Failed to delete log: ${error}`);
  }
}

/**
 * 处理跳转到日志位置
 */
async function handleJumpToLog(item: LogTreeItem) {
  const log = item.nodeData.logEntry;
  if (!log) {
    return;
  }

  try {
    const uri = vscode.Uri.parse(log.fileUri);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document, {
      preview: false,
      selection: new vscode.Range(log.line, 0, log.line, 0)
    });

    // 滚动到视图中心
    editor.revealRange(
      new vscode.Range(log.line, 0, log.line, 0),
      vscode.TextEditorRevealType.InCenter
    );
  } catch (error) {
    console.error('Failed to jump to log:', error);
    vscode.window.showErrorMessage(`Failed to jump to log: ${error}`);
  }
}

/**
 * 扩展停用时调用
 */
export function deactivate() {
  console.log('Simple-Log extension is now deactivated');
}
