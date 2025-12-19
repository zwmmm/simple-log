import * as vscode from 'vscode';
import { LanguageAdapterRegistry } from '../adapters/LanguageAdapterRegistry';
import {
  extractVariable,
  getIndentation,
  getLogConfig,
  showWarning,
} from '../utils/helpers';

/**
 * 插入日志命令
 * 委托给语言适配器处理插入位置分析
 */
export async function insertLogCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    showWarning('No active editor');
    return;
  }

  // 1. 获取语言适配器
  const languageId = editor.document.languageId;
  const adapter = LanguageAdapterRegistry.get(languageId);

  // 2. 获取当前光标位置和选中内容
  const selection = editor.selection;
  let variable: string | null = null;
  let cursorLine: number;

  // 如果有选中文本，直接使用选中的文本作为变量名
  if (!selection.isEmpty) {
    const selectedText = editor.document.getText(selection);
    variable = selectedText.trim();
    cursorLine = selection.end.line;

    // 验证是否为有效变量名（宽松模式，允许属性访问）
    if (!/^[\w.$[\]]+$/.test(variable)) {
      showWarning(`"${variable}" is not a valid variable name`);
      return;
    }
  } else {
    // 3. 没有选中文本，从当前行提取变量
    const position = editor.selection.active;
    const currentLine = editor.document.lineAt(position.line);
    const lineText = currentLine.text;

    // 提取变量名
    variable = extractVariable(lineText, adapter);
    cursorLine = position.line;

    if (!variable) {
      showWarning('No variable found on current line');
      return;
    }
  }

  // 4. 获取用户配置
  const logConfig = getLogConfig();

  // 5. 格式化日志语句
  const logStatement = adapter.formatLog(variable, logConfig);

  // 6. 委托给适配器分析插入位置
  let insertLine: number;
  let indent: string;

  console.log('[insertLog] Language:', languageId);
  console.log(
    '[insertLog] Adapter has analyzeInsertPosition:',
    !!adapter.analyzeInsertPosition,
  );

  if (adapter.analyzeInsertPosition) {
    // 适配器支持智能分析
    console.log(
      '[insertLog] Calling adapter.analyzeInsertPosition for line:',
      cursorLine,
    );
    const result = await adapter.analyzeInsertPosition(
      editor.document,
      cursorLine,
    );
    console.log('[insertLog] analyzeInsertPosition result:', result);

    if (result) {
      // 使用智能分析结果
      insertLine = result.line;
      indent = result.indent;
      console.log('[insertLog] Using smart mode: insertLine =', insertLine);
    } else {
      // 智能分析失败或返回 null，使用简单模式
      insertLine = cursorLine + 1;
      const currentLineText = editor.document.lineAt(cursorLine).text;
      indent = getIndentation(currentLineText);
      console.log(
        '[insertLog] Smart analysis returned null, using simple mode: insertLine =',
        insertLine,
      );
    }
  } else {
    // 适配器不支持智能分析，使用简单模式
    insertLine = cursorLine + 1;
    const currentLineText = editor.document.lineAt(cursorLine).text;
    indent = getIndentation(currentLineText);
    console.log(
      '[insertLog] Adapter does not support smart analysis, using simple mode: insertLine =',
      insertLine,
    );
  }

  // 7. 计算插入位置
  const insertPosition = new vscode.Position(insertLine, 0);

  // 8. 插入日志
  await editor.edit((editBuilder) => {
    editBuilder.insert(insertPosition, `${indent}${logStatement}\n`);
  });

  // 9. 移动光标到插入的日志行
  const newPosition = new vscode.Position(insertLine, indent.length);
  editor.selection = new vscode.Selection(newPosition, newPosition);
}
