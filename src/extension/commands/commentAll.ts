import * as vscode from 'vscode';
import { LanguageAdapterRegistry } from '../adapters/LanguageAdapterRegistry';
import { getLogConfig } from '../utils/helpers';

/**
 * 注释所有日志命令
 * 将当前文件中由插件生成的所有日志语句注释掉（通过前缀识别）
 */
export async function commentAllLogsCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const languageId = document.languageId;
  const adapter = LanguageAdapterRegistry.get(languageId);
  const config = getLogConfig();

  // 获取日志识别模式和注释语法
  const logPattern = adapter.getLogPattern();
  const commentSyntax = adapter.getCommentSyntax();

  const text = document.getText();
  const edits: vscode.TextEdit[] = [];

  // 查找所有匹配的日志语句（仅处理插件生成的）
  let match;
  logPattern.lastIndex = 0; // 重置正则索引

  while ((match = logPattern.exec(text)) !== null) {
    // 检查是否为插件生成的日志
    if (!adapter.isPluginGeneratedLog(match[0], config.prefix)) {
      continue; // 跳过非插件生成的日志
    }

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

  // 应用所有编辑（无提示）
  if (edits.length > 0) {
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);
  }
}
