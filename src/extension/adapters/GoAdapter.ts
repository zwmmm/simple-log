import { ILanguageAdapter, LogConfig } from '../types';

/**
 * Go 适配器
 */
export class GoAdapter implements ILanguageAdapter {
  readonly languageId = 'go';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '📝';

    // 构建上下文信息 (文件名:行号)
    let context = '';
    if (config.filename && config.lineNumber) {
      context = `[${config.filename}:${config.lineNumber}] `;
    }

    return `fmt.Printf("${prefix} ${context}${variable}: %v\\n", ${variable})`;
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

  /**
   * 获取 Go 的通用入口文件名
   */
  getEntryFileNames(): string[] {
    return ['main'];
  }
}
