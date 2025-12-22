import { ILanguageAdapter, LogConfig } from '../types';

/**
 * Python 适配器
 */
export class PythonAdapter implements ILanguageAdapter {
  readonly languageId = 'python';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '📝';

    // 构建上下文信息 (文件名:行号)
    let context = '';
    if (config.filename && config.lineNumber) {
      context = `[${config.filename}:${config.lineNumber}] `;
    }

    // Python 使用 f-string 格式
    return `print(f"${prefix} ${context}${variable}: {${variable}}")`;
  }

  getCommentSyntax(): string {
    return '#';
  }

  getVariablePattern(): RegExp {
    // 匹配 Python 变量赋值: variable = ...
    return /(\w+)\s*=/;
  }

  getLogPattern(): RegExp {
    // 匹配 print() 语句
    return /print\([^)]*\)/g;
  }

  isPluginGeneratedLog(logStatement: string, prefix: string): boolean {
    // 检查 Python f-string 格式的日志是否包含配置的前缀
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixPattern = new RegExp(`["']\\s*${escapedPrefix}\\s+`);
    return prefixPattern.test(logStatement);
  }

  /**
   * 获取 Python 的通用入口文件名
   */
  getEntryFileNames(): string[] {
    return ['__init__', '__main__'];
  }
}
