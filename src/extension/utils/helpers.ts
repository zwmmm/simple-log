import * as vscode from 'vscode';
import { ILanguageAdapter, LogConfig } from '../types';

/**
 * 从行文本中提取变量名
 */
export function extractVariable(lineText: string, adapter: ILanguageAdapter): string | null {
  // 首先尝试使用适配器的模式
  const match = lineText.match(adapter.getVariablePattern());
  if (match) {
    // 支持多个捕获组，返回第一个非空的
    return match[1] || match[2] || match[3];
  }

  // Fallback: 尝试简单的单词匹配
  const simpleMatch = lineText.match(/\b(\w+)\b/);
  return simpleMatch ? simpleMatch[1] : null;
}

/**
 * 获取行的缩进
 */
export function getIndentation(lineText: string): string {
  const match = lineText.match(/^(\s*)/);
  return match ? match[1] : '';
}

/**
 * 获取用户配置
 */
export function getLogConfig(): LogConfig {
  const config = vscode.workspace.getConfiguration('simple-log');
  return {
    prefix: config.get('prefix', '📝'),
    useBackticks: config.get('useBackticks', false),
    includeTimestamp: config.get('includeTimestamp', false),
    includeFilename: config.get('includeFilename', false),
    includeLineNumber: config.get('includeLineNumber', false)
  };
}

/**
 * 显示错误消息
 */
export function showError(message: string): void {
  vscode.window.showErrorMessage(`Simple-Log: ${message}`);
}

/**
 * 显示信息消息
 */
export function showInfo(message: string): void {
  vscode.window.showInformationMessage(`Simple-Log: ${message}`);
}

/**
 * 显示警告消息
 */
export function showWarning(message: string): void {
  vscode.window.showWarningMessage(`Simple-Log: ${message}`);
}
