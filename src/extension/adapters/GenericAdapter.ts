import { ILanguageAdapter, LogConfig } from '../types';

/**
 * 通用适配器（Fallback）
 * 当没有特定语言适配器时使用
 */
export class GenericAdapter implements ILanguageAdapter {
  readonly languageId = 'generic';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || 'LOG';
    // 使用注释格式作为通用日志
    return `// ${prefix}: ${variable} = ${variable}`;
  }

  getCommentSyntax(): string {
    return '//';
  }

  getVariablePattern(): RegExp {
    // 通用变量识别：简单的单词
    return /\b(\w+)\b/;
  }

  getLogPattern(): RegExp {
    // 匹配包含 LOG: 的注释
    return /\/\/\s*LOG:[^\n]*/g;
  }

  isPluginGeneratedLog(logStatement: string, prefix: string): boolean {
    // 检查注释格式的日志是否包含配置的前缀
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixPattern = new RegExp(`//\\s*${escapedPrefix}:`);
    return prefixPattern.test(logStatement);
  }
}
