import * as vscode from 'vscode';
import { LanguageAdapterRegistry } from '../adapters/LanguageAdapterRegistry';
import { showInfo } from '../utils/helpers';

/**
 * 删除所有日志命令
 * 删除当前文件中的所有日志语句
 */
export async function deleteAllLogsCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  // 先请求确认
  const answer = await vscode.window.showWarningMessage(
    'Are you sure you want to delete all log statements?',
    'Delete',
    'Cancel'
  );

  if (answer !== 'Delete') {
    return;
  }

  const document = editor.document;
  const languageId = document.languageId;
  const adapter = LanguageAdapterRegistry.get(languageId);

  const logPattern = adapter.getLogPattern();
  const text = document.getText();
  const edits: vscode.TextEdit[] = [];

  // 查找所有日志语句并标记删除
  let match;
  logPattern.lastIndex = 0; // 重置正则索引

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

    showInfo(`Deleted ${edits.length} log statement(s)`);
  } else {
    showInfo('No log statements found');
  }
}
