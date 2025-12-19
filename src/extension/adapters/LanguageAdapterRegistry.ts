import { ILanguageAdapter } from '../types';
import { JavaScriptAdapter, TypeScriptAdapter } from './JavaScriptAdapter';
import { PythonAdapter } from './PythonAdapter';
import { JavaAdapter } from './JavaAdapter';
import { GoAdapter } from './GoAdapter';
import { VueAdapter } from './VueAdapter';
import { GenericAdapter } from './GenericAdapter';

/**
 * 语言适配器注册表
 * 管理所有语言适配器的注册和获取
 */
export class LanguageAdapterRegistry {
  private static adapters = new Map<string, ILanguageAdapter>();
  private static initialized = false;

  /**
   * 注册适配器
   */
  static register(adapter: ILanguageAdapter): void {
    this.adapters.set(adapter.languageId, adapter);
  }

  /**
   * 获取适配器
   * 如果找不到特定语言的适配器，返回通用适配器
   */
  static get(languageId: string): ILanguageAdapter {
    if (!this.initialized) {
      this.initialize();
    }

    return this.adapters.get(languageId) || new GenericAdapter();
  }

  /**
   * 初始化所有内置适配器
   */
  static initialize(): void {
    if (this.initialized) {
      return;
    }

    // 注册 JavaScript/TypeScript
    const jsAdapter = new JavaScriptAdapter();
    this.register(jsAdapter);
    this.adapters.set('javascriptreact', jsAdapter);

    const tsAdapter = new TypeScriptAdapter();
    this.register(tsAdapter);
    this.adapters.set('typescriptreact', tsAdapter);

    // 注册 Python
    this.register(new PythonAdapter());

    // 注册 Java
    this.register(new JavaAdapter());

    // 注册 Go
    this.register(new GoAdapter());

    // 注册 Vue
    this.register(new VueAdapter());

    this.initialized = true;
  }

  /**
   * 获取所有已注册的语言 ID
   */
  static getSupportedLanguages(): string[] {
    if (!this.initialized) {
      this.initialize();
    }

    return Array.from(this.adapters.keys());
  }

  /**
   * 检查是否支持某个语言
   */
  static isSupported(languageId: string): boolean {
    if (!this.initialized) {
      this.initialize();
    }

    return this.adapters.has(languageId);
  }
}
