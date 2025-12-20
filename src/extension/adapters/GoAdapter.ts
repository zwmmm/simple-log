import { ILanguageAdapter, LogConfig } from '../types';

/**
 * Go 适配器
 */
export class GoAdapter implements ILanguageAdapter {
  readonly languageId = 'go';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '📝';
    return `fmt.Printf("${prefix} ${variable}: %v\\n", ${variable})`;
  }

  getCommentSyntax(): string {
    return '//';
  }

  getVariablePattern(): RegExp {
    // 匹配 Go 变量声明: var variable 或 variable :=
    return /(?:var\s+(\w+)|(\w+)\s*:=)/;
  }

  getLogPattern(): RegExp {
    return /fmt\.(?:Println|Printf)\([^)]*\)/g;
  }

  isPluginGeneratedLog(logStatement: string, prefix: string): boolean {
    // 检查 Go 格式的日志是否包含配置的前缀
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixPattern = new RegExp(`"\\s*${escapedPrefix}\\s+`);
    return prefixPattern.test(logStatement);
  }
}
