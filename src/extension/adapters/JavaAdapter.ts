import { ILanguageAdapter, LogConfig } from '../types';

/**
 * Java 适配器
 */
export class JavaAdapter implements ILanguageAdapter {
  readonly languageId = 'java';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '📝';

    // 构建上下文信息 (文件名:行号)
    let context = '';
    if (config.filename && config.lineNumber) {
      context = `[${config.filename}:${config.lineNumber}] `;
    }

    return `System.out.println("${prefix} ${context}${variable}: " + ${variable});`;
  }

  getCommentSyntax(): string {
    return '//';
  }

  getVariablePattern(): RegExp {
    // 匹配 Java 变量声明
    return /(?:int|long|String|double|float|boolean|var)\s+(\w+)/;
  }

  getLogPattern(): RegExp {
    return /System\.out\.println\([^)]*\);?/g;
  }

  isPluginGeneratedLog(logStatement: string, prefix: string): boolean {
    // 检查 Java 格式的日志是否包含配置的前缀
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixPattern = new RegExp(`"\\s*${escapedPrefix}\\s+`);
    return prefixPattern.test(logStatement);
  }

  /**
   * 获取 Java 的通用入口文件名
   */
  getEntryFileNames(): string[] {
    return ['Main', 'main'];
  }
}
