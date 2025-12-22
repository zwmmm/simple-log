import * as vscode from 'vscode';
import * as path from 'path';
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
 * 获取智能文件名 (用于日志中显示)
 * 对于常见的入口文件 (index, main, __init__ 等), 添加父级目录名以便区分
 */
export function getSmartFileName(
  document: vscode.TextDocument,
  adapter: ILanguageAdapter
): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) {
    // 没有工作区,返回文件名
    return path.basename(document.fileName);
  }

  // 获取相对路径
  const relativePath = path.relative(
    workspaceFolder.uri.fsPath,
    document.fileName
  );
  const fileName = path.basename(document.fileName);

  // 提取文件扩展名和不含扩展名的文件名
  const fileExt = path.extname(fileName);
  const fileNameWithoutExt = path.basename(fileName, fileExt);

  // 获取该语言的入口文件名列表
  const entryFileNames = adapter.getEntryFileNames?.() || [];

  // 检查是否是入口文件
  if (entryFileNames.includes(fileNameWithoutExt)) {
    // 获取父级目录名
    const parentDir = path.dirname(relativePath);

    // 如果不是根目录
    if (parentDir && parentDir !== '.') {
      // 获取最后一级父目录名
      const parentDirName = path.basename(parentDir);

      // 返回 "父目录/文件名" 格式
      return `${parentDirName}/${fileName}`;
    }
  }

  // 其他文件直接返回文件名
  return fileName;
}
