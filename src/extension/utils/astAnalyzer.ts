import type { Statement } from 'oxc-parser';
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
 * AST 分析器 - 基于语句类型的智能插入
 *
 * 核心策略:
 * 1. 根据语句类型智能选择插入方向:
 *    - 声明语句 → 向下插入(打印声明的变量)
 *      • 变量声明: const/let/var (包括解构赋值)
 *      • 类声明: class
 *      • 函数声明: function
 *      • 导入声明: import
 *      • 赋值表达式: = (包括解构赋值)
 *    - 条件/循环/调用语句(if/map/return等) → 向上插入(在使用前打印)
 * 2. 通过语法检查验证插入位置的正确性
 * 3. 语法检查失败时,根据语句类型插入到语句边界
 * 4. 所有失败情况都有合理的降级策略
 *
 * 优点:
 * - 符合调试习惯:声明后打印,使用前检查
 * - 自动处理各种嵌套情况
 * - 全面支持 JavaScript/TypeScript 各种声明方式
 * - 逻辑简单清晰,易于维护
 */
export class AstAnalyzer {
  private static parser: OxcParserLoader | null = null;
  private static initPromise: Promise<void> | null = null;

  /**
   * 预加载 parser (扩展激活时调用,避免首次使用卡顿)
   */
  static async preload(): Promise<void> {
    await this.init();
  }

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
        Logger.debug('Parser not available, falling back to simple mode');
        return null;
      }

      // 始终使用完整文件分析
      const code = document.getText();

      // 解析并找到插入位置(不会返回 null,总是返回一个位置)
      const insertLine = this.findInsertLine(
        code,
        0, // 始终从第 0 行开始
        cursorPosition.line,
        document.languageId,
      );

      // 如果返回 null(parser 不可用),降级到简单模式
      if (insertLine === null) {
        Logger.debug('Parser returned null, falling back to simple mode');
        return null;
      }

      // 获取插入行的缩进
      const insertLineText = document.lineAt(insertLine).text;
      const indent = this.extractIndent(insertLineText);

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
   * 核心方法:找到最佳插入行
   *
   * 新策略:
   * 1. 判断光标所在语句类型:
   *    - 声明语句 → 向下插入
   *      (VariableDeclaration, ClassDeclaration, FunctionDeclaration,
   *       ImportDeclaration, AssignmentExpression)
   *    - 其他语句(if/map/return等) → 向上插入
   * 2. 先尝试插入,通过语法检查验证
   * 3. 如果语法错误,查找包含光标的语句,插入到语句结束后
   * 4. 如果查找失败,降级到向下插入
   */
  private static findInsertLine(
    code: string,
    startLine: number,
    cursorLine: number,
    languageId: string,
  ): number | null {
    if (!this.parser) return null;

    try {
      const relativeCursorLine = cursorLine - startLine;
      const nextLine = relativeCursorLine + 1;
      const prevLine = relativeCursorLine;

      // 步骤 1: 解析代码,找到包含光标的语句
      const lang = this.detectLanguage(languageId);
      const result = this.parser.parseSync('temp.js', code, {
        lang,
        sourceType: 'module',
        range: true,
      });

      if (result.errors && result.errors.length > 0) {
        return startLine + nextLine;
      }

      if (!result.program?.body || !Array.isArray(result.program.body)) {
        return startLine + nextLine;
      }

      // 找到包含光标的语句
      const statement = this.findContainingStatement(
        result.program.body,
        code,
        relativeCursorLine,
      );

      if (!statement) {
        return startLine + nextLine;
      }

      const stmtStartLine = this.offsetToLine(code, statement.start);

      // 步骤 2: 判断插入方向
      const shouldInsertAfter = this.shouldInsertAfterStatement(statement, relativeCursorLine, stmtStartLine);

      if (shouldInsertAfter) {
        // 尝试向下插入
        const testCode = this.insertTestLogAtLine(code, nextLine);
        if (this.isValidSyntax(testCode, languageId)) {
          return startLine + nextLine;
        }
      } else {
        // 尝试向上插入
        const testCode = this.insertTestLogAtLine(code, prevLine);
        if (this.isValidSyntax(testCode, languageId)) {
          return startLine + prevLine;
        }
      }

      // 步骤 3: 语法检查失败,使用语句边界
      const stmtEndLine = this.offsetToLine(code, statement.end);

      // 特殊处理 ReturnStatement: 插入在 return 之前
      if (statement.type === 'ReturnStatement' && relativeCursorLine === stmtStartLine) {
        return startLine + stmtStartLine;
      }

      // 特殊处理 FunctionDeclaration: 插入在函数体开始
      if (statement.type === 'FunctionDeclaration' && relativeCursorLine === stmtStartLine) {
        const functionBodyStart = this.findFunctionBodyStart(
          code,
          statement.start,
          statement.end,
        );
        if (functionBodyStart !== null) {
          return startLine + functionBodyStart;
        }
      }

      // 根据之前的判断决定插入位置
      if (shouldInsertAfter) {
        return startLine + stmtEndLine + 1;
      } else {
        return startLine + stmtStartLine;
      }
    } catch (error) {
      Logger.error('Error in findInsertLine', error);
      // 发生错误时降级到下一行
      return startLine + (cursorLine - startLine + 1);
    }
  }

  /**
   * 判断是否应该在语句之后插入
   *
   * 返回 true: 声明语句或函数参数 → 向下插入
   * 返回 false: 其他语句 → 向上插入
   */
  private static shouldInsertAfterStatement(
    statement: StatementWithSpan,
    cursorLine: number,
    stmtStartLine: number,
  ): boolean {
    // 1. 变量声明: const/let/var (包括解构赋值)
    if (statement.type === 'VariableDeclaration') {
      return true;
    }

    // 2. 类声明: class
    if (statement.type === 'ClassDeclaration') {
      return true;
    }

    // 3. 函数声明: function (且光标在函数签名行,向下插入到函数体内)
    if (statement.type === 'FunctionDeclaration' && cursorLine === stmtStartLine) {
      return true;
    }

    // 4. 导入声明: import
    if (statement.type === 'ImportDeclaration') {
      return true;
    }

    // 5. 赋值表达式 (包括解构赋值)
    if (statement.type === 'ExpressionStatement') {
      const exprStmt = statement as Statement & { expression?: any };
      if (exprStmt.expression?.type === 'AssignmentExpression') {
        return true;
      }
    }

    // 其他情况,向上插入
    return false;
  }

  /**
   * 在指定行插入测试日志
   */
  private static insertTestLogAtLine(code: string, line: number): string {
    const lines = code.split('\n');
    if (line < 0 || line > lines.length) {
      return code;
    }

    // 获取插入行的缩进
    const indent = line < lines.length ? this.extractIndent(lines[line]) : '';

    // 插入一个简单的 console.log 语句
    const testLog = `${indent}console.log('test');`;
    lines.splice(line, 0, testLog);

    return lines.join('\n');
  }

  /**
   * 检查代码语法是否正确
   */
  private static isValidSyntax(code: string, languageId: string): boolean {
    if (!this.parser) return false;

    try {
      const lang = this.detectLanguage(languageId);
      const result = this.parser.parseSync('temp.js', code, {
        lang,
        sourceType: 'module',
        range: true,
      });

      // 没有错误就是语法正确
      return !result.errors || result.errors.length === 0;
    } catch (error) {
      return false;
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
      return null;
    }

    let bestMatch: StatementWithSpan | null = null;
    let bestMatchSize = Infinity;

    for (const stmt of statements) {
      if (!this.hasValidSpan(stmt)) {
        continue;
      }

      const stmtStartLine = this.offsetToLine(code, stmt.start);
      const stmtEndLine = this.offsetToLine(code, stmt.end);

      // 检查目标行是否在语句范围内
      if (targetLine < stmtStartLine || targetLine > stmtEndLine) {
        continue;
      }

      const stmtSize = stmtEndLine - stmtStartLine;

      // 处理 export 包装语句,深入到内部声明
      const unwrapped = this.unwrapExportDeclaration(stmt);
      if (unwrapped && unwrapped !== stmt) {
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
          }
          continue;
        }
      }

      // 检查是否有更好的匹配
      if (stmtSize < bestMatchSize) {
        bestMatch = stmt as StatementWithSpan;
        bestMatchSize = stmtSize;
      }

      // 递归检查嵌套的语句块
      const nestedStatements = this.getNestedStatements(stmt);

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
          }
        } else if (nestedStatements.length > 0) {
          // 如果有嵌套语句但没找到匹配的,可能光标在函数签名行
          // 检查第一个嵌套语句是否在目标行之后
          const firstNested = nestedStatements[0];
          if (this.hasValidSpan(firstNested)) {
            const firstNestedLine = this.offsetToLine(code, firstNested.start);
            if (firstNestedLine > targetLine) {
              // 光标在嵌套语句开始之前,使用当前语句作为最佳匹配
              // 这种情况下,bestMatch 已经设置为当前语句了,不需要额外处理
            }
          }
        }
      }
    }

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

    // ReturnStatement: 检查返回值表达式中的语句
    if (stmt.type === 'ReturnStatement') {
      const returnStmt = stmt as Statement & { argument?: unknown };
      if (returnStmt.argument) {
        const extracted = this.extractStatementsFromExpression(returnStmt.argument);
        nested.push(...extracted);
      }
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

    // JSXElement: 检查 children 中的表达式
    if (exprObj.type === 'JSXElement' || exprObj.type === 'JSXFragment') {
      const children = exprObj.children;
      if (Array.isArray(children)) {
        for (const child of children) {
          const childStatements = this.extractStatementsFromExpression(child);
          statements.push(...childStatements);
        }
      }
    }

    // JSXExpressionContainer: 提取表达式
    if (exprObj.type === 'JSXExpressionContainer') {
      const expression = exprObj.expression;
      if (expression) {
        const exprStatements = this.extractStatementsFromExpression(expression);
        statements.push(...exprStatements);
      }
    }

    // ParenthesizedExpression: 提取括号内的表达式
    if (exprObj.type === 'ParenthesizedExpression') {
      const expression = exprObj.expression;
      if (expression) {
        statements.push(...this.extractStatementsFromExpression(expression));
      }
    }

    return statements;
  }

  /**
   * 找到函数体的开始行(第一个 { 之后的第一行)
   */
  private static findFunctionBodyStart(
    code: string,
    start: number,
    end: number,
  ): number | null {
    // 找到函数的代码片段
    const functionCode = code.substring(start, end);

    // 找到第一个 { 的位置
    const openBraceIndex = functionCode.indexOf('{');
    if (openBraceIndex === -1) {
      // 可能是箭头函数没有花括号的情况
      return null;
    }

    // 计算 { 之后的第一个换行符位置
    const afterBrace = start + openBraceIndex + 1;
    let currentPos = afterBrace;

    // 跳过 { 后的空白字符,找到下一行
    while (currentPos < code.length) {
      if (code[currentPos] === '\n') {
        // 找到换行符,返回下一行的行号
        return this.offsetToLine(code, currentPos + 1);
      }
      currentPos++;
    }

    // 如果没有找到换行符,返回 { 所在行的下一行
    return this.offsetToLine(code, afterBrace) + 1;
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
