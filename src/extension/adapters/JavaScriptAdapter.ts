import * as vscode from 'vscode';
import { ILanguageAdapter, LogConfig, InsertPosition } from '../types';
import { AstAnalyzer } from '../utils/astAnalyzer';

/**
 * JavaScript/TypeScript 适配器
 */
export class JavaScriptAdapter implements ILanguageAdapter {
  readonly languageId: string = 'javascript';

  formatLog(variable: string, config: LogConfig): string {
    const prefix = config.prefix || '📝';
    const quote = config.useBackticks ? '`' : "'";

    // 构建上下文信息 (文件名:行号)
    let context = '';
    if (config.filename && config.lineNumber) {
      context = `[${config.filename}:${config.lineNumber}] `;
    }

    if (config.useBackticks) {
      return `console.log(\`${prefix} ${context}${variable}:\`, ${variable});`;
    }
    return `console.log(${quote}${prefix} ${context}${variable}:${quote}, ${variable});`;
  }

  getCommentSyntax(): string {
    return '//';
  }

  getVariablePattern(): RegExp {
    // 匹配变量声明: const/let/var variable 或 简单的变量名
    return /(?:const|let|var)\s+(\w+)|(\w+)\s*=/;
  }

  getLogPattern(): RegExp {
    // 匹配 console.log() console.info() 等
    return /console\.(log|info|debug|warn|error)\([^)]*\);?/g;
  }

  isPluginGeneratedLog(logStatement: string, prefix: string): boolean {
    // 检查日志语句是否包含配置的前缀
    // 支持单引号、双引号、反引号格式
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixPattern = new RegExp(`['"\`]\\s*${escapedPrefix}\\s+`);
    return prefixPattern.test(logStatement);
  }

  /**
   * 使用 AST 分析智能确定插入位置
   * 仅对 JS/TS 文件启用智能模式
   */
  async analyzeInsertPosition(
    document: vscode.TextDocument,
    cursorLine: number
  ): Promise<InsertPosition | null> {
    // 检查用户配置的插入模式
    const config = vscode.workspace.getConfiguration('simple-log');
    const insertMode = config.get<string>('insertMode', 'smart');

    console.log('[JavaScriptAdapter] insertMode from config:', insertMode);

    // 如果用户选择简单模式，返回 null（使用默认行为）
    if (insertMode === 'simple') {
      console.log('[JavaScriptAdapter] User selected simple mode, returning null');
      return null;
    }

    console.log('[JavaScriptAdapter] Calling AstAnalyzer.analyzeInsertPosition');
    // 使用 AST 分析器
    const result = await AstAnalyzer.analyzeInsertPosition(
      document,
      new vscode.Position(cursorLine, 0)
    );
    console.log('[JavaScriptAdapter] AstAnalyzer returned:', result);
    return result;
  }

  /**
   * 获取 JavaScript/TypeScript 的通用入口文件名
   */
  getEntryFileNames(): string[] {
    return ['index'];
  }
}

/**
 * TypeScript 适配器（继承自 JavaScript）
 */
export class TypeScriptAdapter extends JavaScriptAdapter {
  readonly languageId = 'typescript';

  getVariablePattern(): RegExp {
    // TypeScript 支持类型注解: const variable: type = ...
    return /(?:const|let|var)\s+(\w+)(?::\s*\w+)?|(\w+)\s*=/;
  }
}
