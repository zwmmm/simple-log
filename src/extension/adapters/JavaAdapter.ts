import { ILanguageAdapter, LogConfig } from '../types';

/**
 * Java 适配器
 */
export class JavaAdapter implements ILanguageAdapter {
  readonly languageId = 'java';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '📝';
    return `System.out.println("${prefix} ${variable}: " + ${variable});`;
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
}
