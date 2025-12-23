/**
 * OXC Parser 加载器 (简化版)
 *
 * 策略:
 * - 直接使用 libs/oxc-parser,利用其内部的 bindings.js 自动加载逻辑
 * - libs/oxc-parser/src-js/ 已包含所有平台的 .node 文件
 * - 无需手动实现平台检测,oxc-parser 会自动处理
 */

import { Logger } from './Logger';

/**
 * 解析选项
 */
export interface ParseOptions {
  lang: 'js' | 'jsx' | 'ts' | 'tsx';
  sourceType: 'module' | 'script';
  range: boolean;
}

/**
 * 解析错误
 */
export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

/**
 * 解析结果
 */
export interface ParseResult {
  program: any;
  errors: ParseError[];
}

/**
 * OXC Parser 接口
 */
export interface OxcParser {
  parseSync: (
    filename: string,
    sourceText: string,
    options?: ParseOptions,
  ) => ParseResult;
}

/**
 * 加载 OXC Parser
 *
 * @returns OxcParser 实例,如果加载失败返回 null
 */
export async function loadOxcParser(): Promise<OxcParser | null> {
  try {
    Logger.info('Loading oxc-parser...');

    // 尝试从打包的 libs 目录加载 (生产环境)
    try {
      // out/libs/oxc-parser 包含完整的 oxc-parser 及所有平台 binding
      // 其内部的 bindings.js 会自动检测平台并加载对应的 .node 文件
      const parser = require('./libs/oxc-parser');

      if (parser && typeof parser.parseSync === 'function') {
        Logger.info('✅ Loaded oxc-parser from libs/ (bundled)');
        return parser;
      }
    } catch (err) {
      Logger.debug('Failed to load from libs:', err);
    }

    // 降级: 从 node_modules 加载 (开发环境)
    try {
      const parser = require('oxc-parser');

      if (parser && typeof parser.parseSync === 'function') {
        Logger.info('✅ Loaded oxc-parser from node_modules (dev mode)');
        return parser;
      }
    } catch (err) {
      Logger.debug('Failed to load from node_modules:', err);
    }

    Logger.error('Failed to load oxc-parser from any source');
    return null;
  } catch (error) {
    Logger.error('Unexpected error in loadOxcParser:', error);
    return null;
  }
}

/**
 * 单例缓存
 */
let cachedParser: OxcParser | null | undefined = undefined;

/**
 * 获取 OXC Parser 实例 (单例模式)
 */
export async function getOxcParser(): Promise<OxcParser | null> {
  if (cachedParser !== undefined) {
    return cachedParser;
  }

  cachedParser = await loadOxcParser();
  return cachedParser;
}
