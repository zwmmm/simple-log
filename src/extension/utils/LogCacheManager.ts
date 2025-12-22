import * as vscode from 'vscode';
import { LogEntry } from '../types';
import { Logger } from './Logger';

/**
 * 文件缓存项
 */
interface FileCacheEntry {
  /** 文件 URI */
  uri: string;
  /** 文件修改时间戳 (毫秒) */
  mtime: number;
  /** 扫描到的日志列表 */
  logs: LogEntry[];
}

/**
 * 日志缓存管理器
 *
 * 职责：
 * 1. 缓存每个文件的扫描结果和修改时间
 * 2. 根据文件修改时间判断是否需要重新扫描
 * 3. 提供增量扫描能力
 */
export class LogCacheManager {
  /** 文件缓存 Map: fileUri -> FileCacheEntry */
  private cache = new Map<string, FileCacheEntry>();

  /**
   * 获取缓存的文件扫描结果
   * @param fileUri 文件 URI 字符串
   * @returns 缓存的日志列表,如果不存在返回 undefined
   */
  get(fileUri: string): LogEntry[] | undefined {
    return this.cache.get(fileUri)?.logs;
  }

  /**
   * 设置文件的扫描结果到缓存
   * @param fileUri 文件 URI 字符串
   * @param mtime 文件修改时间戳
   * @param logs 扫描到的日志列表
   */
  set(fileUri: string, mtime: number, logs: LogEntry[]): void {
    this.cache.set(fileUri, {
      uri: fileUri,
      mtime,
      logs
    });
  }

  /**
   * 检查文件是否需要重新扫描
   * @param fileUri 文件 URI
   * @returns true 表示需要重新扫描(文件已修改或不在缓存中)
   */
  async needsRescan(fileUri: vscode.Uri): Promise<boolean> {
    const cached = this.cache.get(fileUri.toString());

    if (!cached) {
      // 缓存中不存在,需要扫描
      return true;
    }

    try {
      // 获取文件当前的修改时间
      const stat = await vscode.workspace.fs.stat(fileUri);
      const currentMtime = stat.mtime;

      // 对比修改时间
      return currentMtime !== cached.mtime;
    } catch {
      // 文件不存在或读取失败,需要从缓存中移除
      this.cache.delete(fileUri.toString());
      return true;
    }
  }

  /**
   * 获取文件的修改时间
   * @param fileUri 文件 URI
   * @returns 修改时间戳,失败返回 0
   */
  async getFileMtime(fileUri: vscode.Uri): Promise<number> {
    try {
      const stat = await vscode.workspace.fs.stat(fileUri);
      return stat.mtime;
    } catch (error) {
      Logger.error(`Failed to get mtime for ${fileUri.fsPath}`, error);
      return 0;
    }
  }

  /**
   * 从缓存中移除指定文件
   * @param fileUri 文件 URI 字符串
   */
  remove(fileUri: string): void {
    this.cache.delete(fileUri);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { totalFiles: number; totalLogs: number } {
    let totalLogs = 0;

    for (const entry of this.cache.values()) {
      totalLogs += entry.logs.length;
    }

    return {
      totalFiles: this.cache.size,
      totalLogs
    };
  }

  /**
   * 批量检查多个文件,返回需要重新扫描的文件列表
   * @param fileUris 文件 URI 列表
   * @returns 需要重新扫描的文件 URI 列表
   */
  async filterFilesToRescan(fileUris: vscode.Uri[]): Promise<vscode.Uri[]> {
    const needsRescanList: vscode.Uri[] = [];

    // 并发检查所有文件
    const checks = fileUris.map(async (uri) => {
      const needsRescan = await this.needsRescan(uri);
      if (needsRescan) {
        needsRescanList.push(uri);
      }
    });

    await Promise.all(checks);

    return needsRescanList;
  }

  /**
   * 获取所有缓存的日志
   * @returns 所有日志的数组
   */
  getAllLogs(): LogEntry[] {
    const allLogs: LogEntry[] = [];

    for (const entry of this.cache.values()) {
      allLogs.push(...entry.logs);
    }

    return allLogs;
  }
}
