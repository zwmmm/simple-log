import { ILanguageAdapter, LogConfig } from '../types';

/**
 * Python 适配器
 */
export class PythonAdapter implements ILanguageAdapter {
  readonly languageId = 'python';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '📝';
    // Python 使用 f-string 格式
    return `print(f"${prefix} ${variable}: {${variable}}")`;
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
}
