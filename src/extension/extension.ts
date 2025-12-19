import * as vscode from 'vscode';
import { LanguageAdapterRegistry } from './adapters/LanguageAdapterRegistry';
import { insertLogCommand } from './commands/insertLog';
import { commentAllLogsCommand } from './commands/commentAll';
import { deleteAllLogsCommand } from './commands/deleteAll';
import { LogPanelProvider } from './panels/LogPanelProvider';

/**
 * 扩展激活时调用
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Simple-Log extension is now active');

  // 初始化语言适配器注册表
  LanguageAdapterRegistry.initialize();

  // 注册命令
  const commands = [
    vscode.commands.registerCommand('simple-log.insertLog', insertLogCommand),
    vscode.commands.registerCommand('simple-log.commentAll', commentAllLogsCommand),
    vscode.commands.registerCommand('simple-log.deleteAll', deleteAllLogsCommand),
    vscode.commands.registerCommand('simple-log.showPanel', () => {
      LogPanelProvider.createOrShow(context.extensionUri);
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

  console.log(`Simple-Log: Registered ${commands.length} commands`);
  console.log(`Simple-Log: Supporting ${LanguageAdapterRegistry.getSupportedLanguages().length} languages`);
}

/**
 * 扩展停用时调用
 */
export function deactivate() {
  console.log('Simple-Log extension is now deactivated');
}
