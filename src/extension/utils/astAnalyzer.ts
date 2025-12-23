import type { Program, Statement } from 'oxc-parser';
import * as vscode from 'vscode';
import { Logger } from './Logger';
import { getOxcParser, type OxcParser as OxcParserLoader } from './oxcLoader';

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
 * 解析选项
 */
interface ParseOptions {
  lang: 'js' | 'jsx' | 'ts' | 'tsx';
  sourceType: 'module' | 'script';
  range: boolean;
}

/**
 * 解析错误
 */
interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

/**
 * 解析结果
 */
interface ParseResult {
  program: Program;
  errors: ParseError[];
}

/**
 * 具有有效 span 的语句类型
 */
type StatementWithSpan = Statement & {
  start: number;
  end: number;
};

/**
 * Export 声明类型
 */
type ExportDeclaration = Statement & {
  type: 'ExportNamedDeclaration' | 'ExportDefaultDeclaration';
  declaration?: Statement;
};

/**
 * If 语句类型
 */
type IfStatementNode = Statement & {
  type: 'IfStatement';
  consequent: Statement | BlockStatement;
  alternate?: Statement | BlockStatement;
};

/**
 * Switch 语句类型
 */
type SwitchStatementNode = Statement & {
  type: 'SwitchStatement';
  cases: SwitchCase[];
};

/**
 * Switch Case 类型
 */
interface SwitchCase {
  consequent: Statement[];
}

/**
 * Try 语句类型
 */
type TryStatementNode = Statement & {
  type: 'TryStatement';
  block: BlockStatement;
  handler?: CatchClause;
  finalizer?: BlockStatement;
};

/**
 * Catch 子句类型
 */
interface CatchClause {
  body: BlockStatement;
}

/**
 * 块语句类型
 */
type BlockStatement = Statement & {
  body: Statement[];
};

/**
 * 循环语句类型
 */
type LoopStatement = Statement & {
  body: Statement | BlockStatement;
};

/**
 * AST 分析器 - 完全重构版
 *
 * 核心目标:找到最近的安全插入位置,不会造成语法错误
 *
 * 策略:
 * 1. 找到包含光标的最小完整语句
 * 2. 如果是 return 语句,插入在它之前
 * 3. 如果是其他语句,插入在它之后
 * 4. 处理嵌套结构(if/for/while/export 等)
 */
export class AstAnalyzer {
  private static parser: OxcParserLoader | null = null;
  private static initPromise: Promise<void> | null = null;

  /**
   * 初始化 oxc-parser(异步加载 ESM 模块)
   */
  private static async init(): Promise<void> {
    if (this.parser) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const oxc = await getOxcParser();
        this.parser = oxc;
        if (oxc) {
          Logger.info('oxc-parser initialized successfully');
        } else {
          Logger.error('Failed to load oxc-parser for current platform');
        }
      } catch (error) {
        Logger.error('Failed to initialize oxc-parser', error);
        this.parser = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * 分析并返回最佳插入位置
   */
  static async analyzeInsertPosition(
    document: vscode.TextDocument,
    cursorPosition: vscode.Position,
  ): Promise<InsertPosition | null> {
    try {
      await this.init();
      if (!this.parser) {
        Logger.debug('Parser not available');
        return null;
      }

      const config = this.getConfig();
      const fileLines = document.lineCount;

      // 文件太大则使用局部分析
      const useLocalScope =
        config.scope === 'local' || fileLines > config.maxFileLinesForFullParse;

      Logger.debug(
        `Analyzing position at line ${cursorPosition.line}, ` +
          `scope: ${useLocalScope ? 'local' : 'file'}, ` +
          `total lines: ${fileLines}`,
      );

      // 提取代码上下文
      const context = useLocalScope
        ? this.extractLocalContext(
            document,
            cursorPosition,
            config.contextLines,
          )
        : this.extractFullFile(document);

      // 解析并找到插入位置
      const insertLine = this.findInsertLine(
        context.code,
        context.startLine,
        cursorPosition.line,
        document.languageId,
      );

      if (insertLine === null) {
        Logger.debug('Could not determine insert line');
        return null;
      }

      // 获取插入行的缩进
      const insertLineText = document.lineAt(insertLine).text;
      const indent = this.extractIndent(insertLineText);

      Logger.debug(
        `Insert line determined: ${insertLine}, indent: ${indent.length} chars`,
      );

      return {
        line: insertLine,
        character: 0,
        indent,
      };
    } catch (error) {
      Logger.error('Error in analyzeInsertPosition', error);
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
   * 提取局部上下文
   */
  private static extractLocalContext(
    document: vscode.TextDocument,
    position: vscode.Position,
    contextLines: number,
  ): { code: string; startLine: number } {
    const totalLines = document.lineCount;
    const cursorLine = position.line;

    const startLine = Math.max(0, cursorLine - contextLines);
    const endLine = Math.min(totalLines - 1, cursorLine + contextLines);

    const lines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push(document.lineAt(i).text);
    }

    return {
      code: lines.join('\n'),
      startLine,
    };
  }

  /**
   * 提取整个文件
   */
  private static extractFullFile(document: vscode.TextDocument): {
    code: string;
    startLine: number;
  } {
    return {
      code: document.getText(),
      startLine: 0,
    };
  }

  /**
   * 核心方法:找到最佳插入行
   */
  private static findInsertLine(
    code: string,
    startLine: number,
    cursorLine: number,
    languageId: string,
  ): number | null {
    if (!this.parser) return null;

    try {
      // 解析代码
      const lang = this.detectLanguage(languageId);
      const result = this.parser.parseSync('temp.js', code, {
        lang,
        sourceType: 'module',
        range: true,
      });

      // 如果有解析错误,返回 null
      if (result.errors && result.errors.length > 0) {
        Logger.debug(`Parse errors: ${result.errors.length}`);
        return null;
      }

      // 检查 program 和 body 是否存在
      if (
        !result.program ||
        !result.program.body ||
        !Array.isArray(result.program.body)
      ) {
        Logger.debug(
          'Invalid parse result: program.body is missing or not an array',
        );
        return null;
      }

      // 计算相对行号
      const relativeCursorLine = cursorLine - startLine;

      // 找到包含光标的语句
      const statement = this.findContainingStatement(
        result.program.body,
        code,
        relativeCursorLine,
      );

      if (!statement) {
        Logger.debug('No containing statement found');
        return null;
      }

      Logger.debug(`Found statement type: ${statement.type}`);

      // 计算语句的起始和结束行
      const stmtStartLine = this.offsetToLine(code, statement.start);
      const stmtEndLine = this.offsetToLine(code, statement.end);

      Logger.debug(
        `Statement spans lines ${stmtStartLine}-${stmtEndLine} ` +
          `(relative), cursor at ${relativeCursorLine}`,
      );

      // 如果是 return 语句,插入在它之前
      if (statement.type === 'ReturnStatement') {
        const insertLine = startLine + stmtStartLine;
        Logger.debug(
          `Return statement detected, inserting before at line ${insertLine}`,
        );
        return insertLine;
      }

      // 其他情况,插入在语句结束后
      const insertLine = startLine + stmtEndLine + 1;
      Logger.debug(`Inserting after statement at line ${insertLine}`);
      return insertLine;
    } catch (error) {
      Logger.error('Error in findInsertLine', error);
      return null;
    }
  }

  /**
   * 找到包含目标行的最小语句
   *
   * 策略:
   * 1. 深度优先遍历 AST
   * 2. 找到所有包含目标行的语句
   * 3. 返回跨度最小的那个(最精确的匹配)
   */
  private static findContainingStatement(
    statements: Statement[],
    code: string,
    targetLine: number,
  ): StatementWithSpan | null {
    // 添加安全检查
    if (!statements || !Array.isArray(statements) || statements.length === 0) {
      Logger.debug('findContainingStatement: statements is empty or invalid');
      return null;
    }

    let bestMatch: StatementWithSpan | null = null;
    let bestMatchSize = Infinity;

    Logger.debug(
      `findContainingStatement: checking ${statements.length} statements for target line ${targetLine}`,
    );

    for (const stmt of statements) {
      if (!this.hasValidSpan(stmt)) {
        Logger.debug(
          `Statement ${
            (stmt as any).type || 'unknown'
          } has no valid span, skipping`,
        );
        continue;
      }

      const stmtStartLine = this.offsetToLine(code, stmt.start);
      const stmtEndLine = this.offsetToLine(code, stmt.end);

      Logger.debug(
        `Checking ${stmt.type}: lines ${stmtStartLine}-${stmtEndLine}, ` +
          `target: ${targetLine}, contains: ${
            targetLine >= stmtStartLine && targetLine <= stmtEndLine
          }`,
      );

      // 检查目标行是否在语句范围内
      if (targetLine < stmtStartLine || targetLine > stmtEndLine) {
        continue;
      }

      const stmtSize = stmtEndLine - stmtStartLine;
      Logger.debug(
        `Statement ${stmt.type} contains target line, size: ${stmtSize}`,
      );

      // 处理 export 包装语句,深入到内部声明
      const unwrapped = this.unwrapExportDeclaration(stmt);
      if (unwrapped && unwrapped !== stmt) {
        Logger.debug(`Unwrapping export declaration to ${unwrapped.type}`);
        const nested = this.findContainingStatement(
          [unwrapped],
          code,
          targetLine,
        );
        if (nested) {
          const nestedSize =
            this.offsetToLine(code, nested.end) -
            this.offsetToLine(code, nested.start);
          if (nestedSize < bestMatchSize) {
            bestMatch = nested;
            bestMatchSize = nestedSize;
            Logger.debug(
              `Found better match in unwrapped: ${nested.type}, size: ${nestedSize}`,
            );
          }
          continue;
        }
      }

      // 检查是否有更好的匹配
      if (stmtSize < bestMatchSize) {
        bestMatch = stmt as StatementWithSpan;
        bestMatchSize = stmtSize;
        Logger.debug(`New best match: ${stmt.type}, size: ${stmtSize}`);
      }

      // 递归检查嵌套的语句块
      const nestedStatements = this.getNestedStatements(stmt);
      Logger.debug(
        `Extracting nested statements from ${stmt.type}: found ${nestedStatements.length}`,
      );

      if (nestedStatements.length > 0) {
        const nested = this.findContainingStatement(
          nestedStatements,
          code,
          targetLine,
        );
        if (nested) {
          const nestedSize =
            this.offsetToLine(code, nested.end) -
            this.offsetToLine(code, nested.start);
          if (nestedSize < bestMatchSize) {
            bestMatch = nested;
            bestMatchSize = nestedSize;
            Logger.debug(
              `Found better match in nested: ${nested.type}, size: ${nestedSize}`,
            );
          }
        }
      }
    }

    Logger.debug(`Best match result: ${bestMatch?.type || 'null'}`);
    return bestMatch;
  }

  /**
   * 检查语句是否具有有效的 span
   */
  private static hasValidSpan(stmt: Statement): stmt is StatementWithSpan {
    return (
      'type' in stmt &&
      'start' in stmt &&
      'end' in stmt &&
      typeof stmt.start === 'number' &&
      typeof stmt.end === 'number'
    );
  }

  /**
   * 类型守卫:检查是否为 Export 声明
   */
  private static isExportDeclaration(
    stmt: Statement,
  ): stmt is ExportDeclaration {
    return (
      stmt.type === 'ExportNamedDeclaration' ||
      stmt.type === 'ExportDefaultDeclaration'
    );
  }

  /**
   * 展开 export 声明,获取内部的实际声明
   */
  private static unwrapExportDeclaration(stmt: Statement): Statement | null {
    if (this.isExportDeclaration(stmt)) {
      const declaration = stmt.declaration;
      if (declaration && this.hasValidSpan(declaration)) {
        return declaration;
      }
    }
    return null;
  }

  /**
   * 类型守卫:检查是否为 IfStatement
   */
  private static isIfStatement(stmt: Statement): stmt is IfStatementNode {
    return stmt.type === 'IfStatement';
  }

  /**
   * 类型守卫:检查是否为 SwitchStatement
   */
  private static isSwitchStatement(
    stmt: Statement,
  ): stmt is SwitchStatementNode {
    return stmt.type === 'SwitchStatement';
  }

  /**
   * 类型守卫:检查是否为 TryStatement
   */
  private static isTryStatement(stmt: Statement): stmt is TryStatementNode {
    return stmt.type === 'TryStatement';
  }

  /**
   * 类型守卫:检查是否为循环语句
   */
  private static isLoopStatement(stmt: Statement): stmt is LoopStatement {
    return (
      stmt.type === 'ForStatement' ||
      stmt.type === 'ForInStatement' ||
      stmt.type === 'ForOfStatement' ||
      stmt.type === 'WhileStatement' ||
      stmt.type === 'DoWhileStatement'
    );
  }

  /**
   * 类型守卫:检查是否有 body 属性且为数组
   */
  private static hasBodyArray(stmt: Statement): stmt is BlockStatement {
    return 'body' in stmt && Array.isArray((stmt as BlockStatement).body);
  }

  /**
   * 获取语句中的嵌套语句
   * 需要深入到所有可能包含语句的地方,包括:
   * - BlockStatement 的 body
   * - FunctionExpression/ArrowFunctionExpression 的 body
   * - CallExpression 的参数
   * - IfStatement 的分支
   * - 循环语句的 body
   * 等等
   */
  private static getNestedStatements(stmt: Statement): Statement[] {
    const nested: Statement[] = [] as Statement[];

    // BlockStatement, FunctionDeclaration 等有 body 数组
    if (this.hasBodyArray(stmt)) {
      nested.push(...stmt.body);
      return nested;
    }

    // 如果有 body 但不是数组,可能是包含 BlockStatement 的对象
    if ('body' in stmt) {
      const body = (stmt as { body: unknown }).body;
      if (body && typeof body === 'object' && 'body' in body) {
        const innerBody = (body as { body: unknown }).body;
        if (Array.isArray(innerBody)) {
          nested.push(...innerBody);
        }
      }
    }

    // VariableDeclaration: 需要检查初始化表达式
    if (stmt.type === 'VariableDeclaration') {
      const varDecl = stmt as Statement & {
        declarations: Array<{
          init?: unknown;
        }>;
      };
      for (const declarator of varDecl.declarations) {
        if (declarator.init) {
          // 递归提取表达式中的语句
          nested.push(...this.extractStatementsFromExpression(declarator.init));
        }
      }
    }

    // ExpressionStatement: 检查表达式中的语句
    if (stmt.type === 'ExpressionStatement') {
      const exprStmt = stmt as Statement & { expression: unknown };
      nested.push(...this.extractStatementsFromExpression(exprStmt.expression));
    }

    // IfStatement 有 consequent 和 alternate
    if (this.isIfStatement(stmt)) {
      if (stmt.consequent) {
        if (this.hasBodyArray(stmt.consequent)) {
          nested.push(...stmt.consequent.body);
        } else {
          nested.push(stmt.consequent);
        }
      }
      if (stmt.alternate) {
        if (this.hasBodyArray(stmt.alternate)) {
          nested.push(...stmt.alternate.body);
        } else {
          nested.push(stmt.alternate);
        }
      }
    }

    // SwitchStatement 有 cases
    if (this.isSwitchStatement(stmt)) {
      for (const caseClause of stmt.cases) {
        if (Array.isArray(caseClause.consequent)) {
          nested.push(...caseClause.consequent);
        }
      }
    }

    // TryStatement 有 block, handler, finalizer
    if (this.isTryStatement(stmt)) {
      if (stmt.block && this.hasBodyArray(stmt.block)) {
        nested.push(...stmt.block.body);
      }
      if (stmt.handler?.body && this.hasBodyArray(stmt.handler.body)) {
        nested.push(...stmt.handler.body.body);
      }
      if (stmt.finalizer && this.hasBodyArray(stmt.finalizer)) {
        nested.push(...stmt.finalizer.body);
      }
    }

    // ForStatement, WhileStatement, DoWhileStatement 等循环语句
    if (this.isLoopStatement(stmt)) {
      if (stmt.body) {
        if (this.hasBodyArray(stmt.body)) {
          nested.push(...stmt.body.body);
        } else {
          nested.push(stmt.body);
        }
      }
    }

    return nested;
  }

  /**
   * 从表达式中提取语句
   * 处理 CallExpression, ArrowFunctionExpression, FunctionExpression 等
   */
  private static extractStatementsFromExpression(expr: unknown): Statement[] {
    const statements: Statement[] = [];

    if (!expr || typeof expr !== 'object') {
      return statements;
    }

    const exprObj = expr as { type?: string; [key: string]: unknown };

    // ArrowFunctionExpression 或 FunctionExpression
    if (
      exprObj.type === 'ArrowFunctionExpression' ||
      exprObj.type === 'FunctionExpression'
    ) {
      const body = exprObj.body;

      // 如果 body 是 BlockStatement
      if (body && typeof body === 'object' && 'body' in body) {
        const bodyStatements = (body as { body: unknown }).body;
        if (Array.isArray(bodyStatements)) {
          statements.push(...bodyStatements);
        }
      }
    }

    // CallExpression: 检查参数
    if (exprObj.type === 'CallExpression') {
      const args = exprObj.arguments;
      if (Array.isArray(args)) {
        for (const arg of args) {
          statements.push(...this.extractStatementsFromExpression(arg));
        }
      }
    }

    // ArrayExpression: 检查元素
    if (exprObj.type === 'ArrayExpression') {
      const elements = exprObj.elements;
      if (Array.isArray(elements)) {
        for (const element of elements) {
          statements.push(...this.extractStatementsFromExpression(element));
        }
      }
    }

    // ObjectExpression: 检查属性值
    if (exprObj.type === 'ObjectExpression') {
      const properties = exprObj.properties;
      if (Array.isArray(properties)) {
        for (const prop of properties) {
          if (prop && typeof prop === 'object' && 'value' in prop) {
            statements.push(
              ...this.extractStatementsFromExpression(prop.value),
            );
          }
        }
      }
    }

    return statements;
  }

  /**
   * 将字符偏移转换为行号
   */
  private static offsetToLine(code: string, offset: number): number {
    let line = 0;
    for (let i = 0; i < offset && i < code.length; i++) {
      if (code[i] === '\n') {
        line++;
      }
    }
    return line;
  }

  /**
   * 检测语言类型
   */
  private static detectLanguage(
    languageId: string,
  ): 'js' | 'jsx' | 'ts' | 'tsx' {
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
   * 提取行缩进
   */
  private static extractIndent(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }
}
