import * as vscode from 'vscode';
import { LogScanner } from '../utils/LogScanner';

/**
 * 删除所有日志命令
 * 删除当前文件中由插件生成的所有日志语句（通过前缀识别）
 */
export async function deleteAllLogsCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;

  // 使用 LogScanner 扫描所有日志（确保正确识别多行日志）
  const logs = LogScanner.scanDocument(document);

  if (logs.length === 0) {
    vscode.window.showInformationMessage('No logs to delete');
    return;
  }

  // 按 endLine 降序排序，从后往前删除（避免行号变化）
  logs.sort((a, b) => b.endLine - a.endLine);

  await editor.edit(editBuilder => {
    for (const log of logs) {
      // 使用 endLine 删除完整的多行日志
      const range = new vscode.Range(log.line, 0, log.endLine + 1, 0);
      editBuilder.delete(range);
    }
  });

  vscode.window.showInformationMessage(`Deleted ${logs.length} log(s)`);
}
