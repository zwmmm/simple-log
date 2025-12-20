import type { Program, Statement, IfStatement } from 'oxc-parser';
import * as vscode from 'vscode';

/**
 * 插入位置分析结果
 */
export interface InsertPosition {
  line: number; // 插入行号
  character: number; // 插入列号
  indent: string; // 缩进
}

/**
 * AST 分析器配置
 */
interface AnalyzerConfig {
  scope: 'local' | 'file';
  contextLines: number;
  maxFileLinesForFullParse: number;
}

/**
 * oxc-parser 类型定义
 */
interface OxcParser {
  parseSync: (
    filename: string,
    sourceText: string,
    options?: any,
  ) => {
    program: Program;
    errors: any[];
  };
}

/**
 * 类型守卫:检查语句是否具有 span 属性
 * 所有具体的 Statement 类型都继承了 Span 接口,所以运行时总是有 span
 */
function hasSpan(stmt: Statement): stmt is Statement & { span: { start: number; end: number } } {
  return 'span' in stmt && typeof (stmt as any).span === 'object';
}

/**
 * 类型守卫:检查语句是否为 IfStatement
 */
function isIfStatement(stmt: Statement): stmt is IfStatement {
  return stmt.type === 'IfStatement';
}

/**
 * 类型守卫:检查语句是否具有 body 属性(如 BlockStatement、ForStatement 等)
 */
function hasBodyArray(stmt: Statement): stmt is Statement & { body: Statement[] } {
  return 'body' in stmt && Array.isArray((stmt as any).body);
}

/**
 * AST 分析器 - 基于 oxc-parser 的智能日志插入位置分析
 *
 * 优势:
 * - 基于 Rust 的高性能解析器
 * - 支持最新 ECMAScript 语法
 * - 更好的错误恢复能力
 * - 智能文件大小检查和降级
 */
export class AstAnalyzer {
  private static parser: OxcParser | null = null;
  private static initPromise: Promise<void> | null = null;

  /**
   * 初始化 oxc-parser（异步加载 ESM 模块）
   */
  private static async init(): Promise<void> {
    if (this.parser) {
      console.log('[AstAnalyzer.init] Parser already initialized');
      return;
    }

    if (this.initPromise) {
      console.log('[AstAnalyzer.init] Waiting for existing init promise');
      return this.initPromise;
    }

    console.log('[AstAnalyzer.init] Starting parser initialization');
    this.initPromise = (async () => {
      try {
        // 动态导入 ESM 模块
        console.log('[AstAnalyzer.init] Attempting to import oxc-parser');

        // 直接使用包名让 Node.js 解析，它会自动找到 package.json 中的 exports
        const oxc = await import('oxc-parser');
        this.parser = oxc;
        console.log('[AstAnalyzer.init] oxc-parser loaded successfully');
      } catch (error) {
        console.error('[AstAnalyzer.init] Failed to load oxc-parser:', error);
        console.error(
          '[AstAnalyzer.init] Error details:',
          error instanceof Error ? error.message : String(error),
        );
        this.parser = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * 分析并返回最佳插入位置
   * @param document 文档
   * @param cursorPosition 光标位置
   */
  static async analyzeInsertPosition(
    document: vscode.TextDocument,
    cursorPosition: vscode.Position,
  ): Promise<InsertPosition | null> {
    try {
      console.log(
        '[AstAnalyzer] Starting analysis for cursor at line:',
        cursorPosition.line,
      );

      // 1. 初始化 parser
      await this.init();
      console.log('[AstAnalyzer] Parser initialized:', !!this.parser);
      if (!this.parser) {
        console.log('[AstAnalyzer] Parser not available, returning null');
        return null;
      }

      // 2. 获取配置
      const config = this.getConfig();
      console.log('[AstAnalyzer] Config:', config);

      // 3. 检查文件大小并确定实际使用的 scope
      const fileLines = document.lineCount;
      let actualScope = config.scope;

      // 如果用户选择 file 模式但文件太大，强制降级到 local
      if (
        config.scope === 'file' &&
        fileLines > config.maxFileLinesForFullParse
      ) {
        actualScope = 'local';
        console.log(
          `[AstAnalyzer] File too large (${fileLines} lines), downgrading to local scope`,
        );
      }

      console.log('[AstAnalyzer] Using scope:', actualScope);

      // 4. 根据配置获取代码
      const context =
        actualScope === 'local'
          ? this.extractLocalContext(
              document,
              cursorPosition,
              config.contextLines,
            )
          : this.extractFileContext(document);

      if (!context) {
        console.log('[AstAnalyzer] Failed to extract context, returning null');
        return null;
      }

      console.log(
        '[AstAnalyzer] Context extracted: lines',
        context.startLine,
        '-',
        context.endLine,
      );

      // 5. 解析 AST
      const insertLine = this.findInsertLineByAst(
        context.code,
        context.startLine,
        cursorPosition.line,
        document.languageId,
      );

      console.log(
        '[AstAnalyzer] AST analysis result: insertLine =',
        insertLine,
      );

      if (insertLine !== null) {
        const insertLineText = document.lineAt(insertLine).text;
        const indent = this.getIndentation(insertLineText);

        const result = {
          line: insertLine,
          character: 0,
          indent,
        };
        console.log('[AstAnalyzer] Returning result:', result);
        return result;
      }

      console.log('[AstAnalyzer] No valid insert line found, returning null');
      return null;
    } catch (error) {
      // AST 解析失败，返回 null 让调用方使用简单模式
      console.error('[AstAnalyzer] Error during analysis:', error);
      return null;
    }
  }

  /**
   * 获取用户配置
   */
  private static getConfig(): AnalyzerConfig {
    const config = vscode.workspace.getConfiguration('simple-log');
    return {
      scope: config.get('astAnalysisScope', 'file'),
      contextLines: config.get('localContextLines', 15),
      maxFileLinesForFullParse: config.get('maxFileLinesForFullParse', 10000),
    };
  }

  /**
   * 提取局部上下文代码
   */
  private static extractLocalContext(
    document: vscode.TextDocument,
    position: vscode.Position,
    contextLines: number,
  ): { code: string; startLine: number; endLine: number } | null {
    const totalLines = document.lineCount;
    const cursorLine = position.line;

    // 计算上下文范围
    const startLine = Math.max(0, cursorLine - contextLines);
    const endLine = Math.min(totalLines - 1, cursorLine + contextLines);

    // 提取代码
    const lines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push(document.lineAt(i).text);
    }

    return {
      code: lines.join('\n'),
      startLine,
      endLine,
    };
  }

  /**
   * 提取整个文件代码
   */
  private static extractFileContext(document: vscode.TextDocument): {
    code: string;
    startLine: number;
    endLine: number;
  } {
    return {
      code: document.getText(),
      startLine: 0,
      endLine: document.lineCount - 1,
    };
  }

  /**
   * 通过 oxc AST 分析找到插入行
   */
  private static findInsertLineByAst(
    code: string,
    startLine: number,
    cursorLine: number,
    languageId: string,
  ): number | null {
    if (!this.parser) {
      console.log('[findInsertLineByAst] Parser is null');
      return null;
    }

    try {
      // 确定语言类型
      const lang = this.detectLang(languageId);
      console.log('[findInsertLineByAst] Detected language:', lang);

      // 解析 AST
      const result = this.parser.parseSync('temp.js', code, {
        lang,
        sourceType: 'module',
        range: true,
      });

      console.log(
        '[findInsertLineByAst] Parse result - errors:',
        result.errors?.length || 0,
      );

      // 如果有解析错误，尝试备用方案
      if (result.errors && result.errors.length > 0) {
        console.log(
          '[findInsertLineByAst] Parse errors detected, using fallback',
        );
        return this.findInsertLineByFallback(code, startLine, cursorLine);
      }

      // 将光标位置转换为相对于代码片段的行号
      const relativeCursorLine = cursorLine - startLine;
      console.log(
        '[findInsertLineByAst] Relative cursor line:',
        relativeCursorLine,
      );

      // 遍历 AST，找到包含光标的最小完整语句
      const statement = this.findContainingStatement(
        result.program.body,
        relativeCursorLine,
      );

      console.log('[findInsertLineByAst] Found statement:', !!statement);

      if (statement && hasSpan(statement)) {
        // 计算语句结束位置的行号
        const statementEndLine = this.calculateLine(code, statement.span.end);
        const finalLine = startLine + statementEndLine + 1;
        console.log(
          '[findInsertLineByAst] Statement end line:',
          statementEndLine,
          'final line:',
          finalLine,
        );
        return finalLine;
      }

      console.log('[findInsertLineByAst] No valid statement found');
      return null;
    } catch (error) {
      // 语法错误或其他问题，尝试备用方案
      console.error('[findInsertLineByAst] Exception:', error);
      return this.findInsertLineByFallback(code, startLine, cursorLine);
    }
  }

  /**
   * 检测语言类型
   */
  private static detectLang(languageId: string): 'js' | 'jsx' | 'ts' | 'tsx' {
    switch (languageId) {
      case 'typescript':
        return 'ts';
      case 'typescriptreact':
        return 'tsx';
      case 'javascriptreact':
        return 'jsx';
      default:
        return 'js';
    }
  }

  /**
   * 计算字符偏移对应的行号
   */
  private static calculateLine(code: string, offset: number): number {
    let line = 0;
    for (let i = 0; i < offset && i < code.length; i++) {
      if (code[i] === '\n') {
        line++;
      }
    }
    return line;
  }

  /**
   * 找到包含指定行的语句节点
   */
  private static findContainingStatement(
    statements: Statement[],
    targetLine: number,
  ): Statement | null {
    for (const stmt of statements) {
      if (!hasSpan(stmt)) {
        continue;
      }

      // 需要将 span.start/end 转换为行号来比较
      // 这里简化处理：假设 span 中有位置信息
      // 实际上 oxc 的 span 是字符偏移，需要转换

      // 递归检查语句块
      if (hasBodyArray(stmt)) {
        const nested = this.findContainingStatement(stmt.body, targetLine);
        if (nested) return nested;
      }

      // 检查 if/for/while 等控制语句
      if (isIfStatement(stmt)) {
        // 检查 consequent 分支
        if (hasBodyArray(stmt.consequent)) {
          const nested = this.findContainingStatement(
            stmt.consequent.body,
            targetLine,
          );
          if (nested) return nested;
        }

        // 检查 alternate 分支
        if (stmt.alternate) {
          if (hasBodyArray(stmt.alternate)) {
            const nested = this.findContainingStatement(
              stmt.alternate.body,
              targetLine,
            );
            if (nested) return nested;
          }
        }
      }

      // 对于当前语句，如果包含目标行，返回它
      // 这里需要更精确的行号计算逻辑
    }

    // 简化策略：返回最后一个语句
    return statements.length > 0 ? statements[statements.length - 1] : null;
  }

  /**
   * 备用方案：基于括号匹配找到合适的插入位置
   */
  private static findInsertLineByFallback(
    code: string,
    startLine: number,
    cursorLine: number,
  ): number | null {
    const lines = code.split('\n');
    const relativeCursorLine = cursorLine - startLine;

    // 从光标位置向下查找，找到第一个完整的语句结束
    let braceDepth = 0;
    let parenDepth = 0;
    let bracketDepth = 0;

    for (let i = relativeCursorLine; i < lines.length; i++) {
      const line = lines[i];

      // 简单的括号计数（不考虑字符串内的括号）
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
        if (char === '[') bracketDepth++;
        if (char === ']') bracketDepth--;
      }

      // 检查是否回到平衡状态，且行尾有分号或闭合括号
      if (braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
        const trimmed = line.trim();
        if (
          trimmed.endsWith(';') ||
          trimmed.endsWith('}') ||
          trimmed.endsWith(',')
        ) {
          return startLine + i + 1;
        }
      }
    }

    // 如果找不到，返回光标下一行（回退到原始逻辑）
    return cursorLine + 1;
  }

  /**
   * 获取行缩进
   */
  private static getIndentation(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }
}
