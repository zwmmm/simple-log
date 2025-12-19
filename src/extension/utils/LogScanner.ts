import * as vscode from 'vscode';
import { LanguageAdapterRegistry } from '../adapters/LanguageAdapterRegistry';
import { LogEntry, LogStats } from '../types';

/**
 * 日志扫描器
 * 扫描文档中的所有日志语句
 */
export class LogScanner {
  /**
   * 扫描文档中的所有日志
   */
  static scanDocument(document: vscode.TextDocument): LogEntry[] {
    const languageId = document.languageId;
    const adapter = LanguageAdapterRegistry.get(languageId);
    const logPattern = adapter.getLogPattern();
    const commentSyntax = adapter.getCommentSyntax();

    const logs: LogEntry[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    lines.forEach((line, index) => {
      const matches = line.match(logPattern);

      if (matches) {
        for (const match of matches) {
          const isCommented = line.trim().startsWith(commentSyntax);
          const variable = this.extractVariableFromLog(match);

          logs.push({
            id: `${document.uri.toString()}-${index}`,
            line: index,
            content: match.trim(),
            variable: variable || 'unknown',
            type: this.detectLogType(match),
            language: languageId,
            isCommented,
            fileUri: document.uri.toString()
          });
        }
      }
    });

    return logs;
  }

  /**
   * 从日志语句中提取变量名
   */
  private static extractVariableFromLog(logStatement: string): string | null {
    // 匹配 console.log('prefix variable:', variable)
    const match1 = logStatement.match(/['"`]\s*\S+\s+(\w+):/);
    if (match1) {
      return match1[1];
    }

    // 匹配 print(f"prefix variable: {variable}")
    const match2 = logStatement.match(/[{](\w+)[}]/);
    if (match2) {
      return match2[1];
    }

    // 匹配其他格式
    const match3 = logStatement.match(/(\w+)\s*[,)]/);
    if (match3) {
      return match3[1];
    }

    return null;
  }

  /**
   * 检测日志类型
   */
  private static detectLogType(logStatement: string): LogEntry['type'] {
    if (logStatement.includes('.error(') || logStatement.includes('logger.error')) {
      return 'error';
    }
    if (logStatement.includes('.warn(') || logStatement.includes('logger.warn')) {
      return 'warn';
    }
    if (logStatement.includes('.info(') || logStatement.includes('logger.info')) {
      return 'info';
    }
    if (logStatement.includes('.debug(') || logStatement.includes('logger.debug')) {
      return 'debug';
    }
    return 'log';
  }

  /**
   * 获取日志统计信息
   */
  static getStatistics(logs: LogEntry[]): LogStats {
    const total = logs.length;
    const commented = logs.filter(log => log.isCommented).length;
    const active = total - commented;

    const byType: Record<LogEntry['type'], number> = {
      log: 0,
      info: 0,
      debug: 0,
      warn: 0,
      error: 0
    };

    const byLanguage: Record<string, number> = {};

    logs.forEach(log => {
      byType[log.type] = (byType[log.type] || 0) + 1;
      byLanguage[log.language] = (byLanguage[log.language] || 0) + 1;
    });

    return {
      total,
      commented,
      active,
      byType,
      byLanguage
    };
  }
}
