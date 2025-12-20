import * as vscode from 'vscode';
import { LanguageAdapterRegistry } from '../adapters/LanguageAdapterRegistry';
import { getLogConfig } from '../utils/helpers';

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
  const languageId = document.languageId;
  const adapter = LanguageAdapterRegistry.get(languageId);
  const config = getLogConfig();

  const logPattern = adapter.getLogPattern();
  const text = document.getText();
  const edits: vscode.TextEdit[] = [];

  // 查找所有日志语句并标记删除（仅删除插件生成的）
  let match;
  logPattern.lastIndex = 0; // 重置正则索引

  while ((match = logPattern.exec(text)) !== null) {
    // 检查是否为插件生成的日志
    if (!adapter.isPluginGeneratedLog(match[0], config.prefix)) {
      continue; // 跳过非插件生成的日志
    }

    const startPos = document.positionAt(match.index);
    const line = document.lineAt(startPos.line);

    // 删除整行（包括换行符）
    const range = new vscode.Range(
      new vscode.Position(line.lineNumber, 0),
      new vscode.Position(line.lineNumber + 1, 0)
    );
    edits.push(vscode.TextEdit.delete(range));
  }

  // 应用删除（无提示）
  if (edits.length > 0) {
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);
  }
}
