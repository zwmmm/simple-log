/**
 * Simple-Log Types
 * 核心类型定义
 */

import * as vscode from 'vscode';

/**
 * 日志配置接口
 */
export interface LogConfig {
  /** 日志前缀 */
  prefix: string;

  /** 是否使用反引号（模板字符串） */
  useBackticks: boolean;

  /** 是否包含时间戳 */
  includeTimestamp: boolean;

  /** 是否包含文件名 */
  includeFilename: boolean;

  /** 是否包含行号 */
  includeLineNumber?: boolean;
}

/**
 * 插入位置分析结果
 */
export interface InsertPosition {
  /** 插入行号 */
  line: number;
  /** 缩进字符串 */
  indent: string;
}

/**
 * 语言适配器接口
 */
export interface ILanguageAdapter {
  /** 语言 ID */
  readonly languageId: string;

  /**
   * 格式化日志语句
   * @param variable 变量名
   * @param config 配置项
   * @returns 格式化后的日志语句
   */
  formatLog(variable: string, config: LogConfig): string;

  /**
   * 获取注释语法
   * @returns 注释符号（如 '//', '#'）
   */
  getCommentSyntax(): string;

  /**
   * 获取变量识别正则表达式
   * @returns 用于匹配变量的正则
   */
  getVariablePattern(): RegExp;

  /**
   * 获取日志识别模式（用于批量操作）
   * @returns 用于识别本语言日志语句的正则
   */
  getLogPattern(): RegExp;

  /**
   * 检查日志语句是否由插件生成（通过前缀识别）
   * @param logStatement 日志语句内容
   * @param prefix 配置的前缀
   * @returns 是否为插件生成的日志
   */
  isPluginGeneratedLog(logStatement: string, prefix: string): boolean;

  /**
   * 分析并返回最佳插入位置
   * @param document 文档
   * @param cursorLine 光标所在行号
   * @returns 插入位置，或 null 表示使用简单模式（下一行）
   */
  analyzeInsertPosition?(
    document: vscode.TextDocument,
    cursorLine: number
  ): Promise<InsertPosition | null>;
}

/**
 * 日志类型
 */
export type LogType = 'log' | 'info' | 'debug' | 'warn' | 'error';

/**
 * 日志条目
 */
export interface LogEntry {
  id: string;
  line: number;
  content: string;
  variable: string;
  type: LogType;
  language: string;
  isCommented: boolean;
  fileUri: string;
}

/**
 * 统计信息
 */
export interface LogStats {
  total: number;
  byType: Record<LogType, number>;
  byLanguage: Record<string, number>;
  commented: number;
  active: number;
}

/**
 * 自定义语言配置
 */
export interface CustomLanguageConfig {
  logTemplate: string;
  commentSyntax: string;
  variablePattern: string;
  logPattern: string;
}
