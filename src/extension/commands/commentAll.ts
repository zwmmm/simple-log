import * as vscode from 'vscode';
import { LanguageAdapterRegistry } from '../adapters/LanguageAdapterRegistry';
import { showInfo } from '../utils/helpers';

/**
 * 注释所有日志命令
 * 将当前文件中的所有日志语句注释掉
 */
export async function commentAllLogsCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const languageId = document.languageId;
  const adapter = LanguageAdapterRegistry.get(languageId);

  // 获取日志识别模式和注释语法
  const logPattern = adapter.getLogPattern();
  const commentSyntax = adapter.getCommentSyntax();

  const text = document.getText();
  const edits: vscode.TextEdit[] = [];

  // 查找所有匹配的日志语句
  let match;
  logPattern.lastIndex = 0; // 重置正则索引

  while ((match = logPattern.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const line = document.lineAt(startPos.line);

    // 检查是否已经被注释
    const trimmedText = line.text.trim();
    if (!trimmedText.startsWith(commentSyntax)) {
      // 在行首（第一个非空白字符前）插入注释
      const lineStart = new vscode.Position(
        startPos.line,
        line.firstNonWhitespaceCharacterIndex
      );
      edits.push(vscode.TextEdit.insert(lineStart, `${commentSyntax} `));
    }
  }

  // 应用所有编辑
  if (edits.length > 0) {
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);

    showInfo(`Commented ${edits.length} log statement(s)`);
  } else {
    showInfo('No log statements found');
  }
}
