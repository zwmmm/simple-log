import * as vscode from 'vscode';
import * as path from 'path';
import { LogScanner } from '../utils/LogScanner';
import { LogTreeItem, LogTreeNodeData } from './LogTreeItem';
import { LogEntry } from '../types';
import { LogCacheManager } from '../utils/LogCacheManager';
import { Logger } from '../utils/Logger';

/**
 * TreeView 数据提供器
 */
export class LogTreeDataProvider
  implements vscode.TreeDataProvider<LogTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    LogTreeItem | undefined | null
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  /** 缓存管理器 */
  private cacheManager = new LogCacheManager();

  constructor(private workspaceRoot: string) {}

  /**
   * 刷新树视图
   */
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * 清空缓存(不刷新视图)
   * 用于自动内存管理
   */
  clearCache(): void {
    this.cacheManager.clear();
    Logger.debug('Cache cleared');
  }

  /**
   * 清空缓存并刷新
   * 用于强制重新扫描所有文件
   */
  clearCacheAndRefresh(): void {
    this.clearCache();
    this.refresh();
  }

  /**
   * 获取 TreeItem
   */
  getTreeItem(element: LogTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * 获取子节点
   */
  async getChildren(element?: LogTreeItem): Promise<LogTreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No workspace opened');
      return [];
    }

    if (!element) {
      // 根节点：扫描工作区，构建文件夹树
      const logs = await this.scanWorkspace();
      if (logs.length === 0) {
        return [];
      }
      const tree = this.buildFolderTree(logs);
      return tree.map((node) => this.createTreeItem(node));
    }

    // 子节点
    const { nodeData } = element;
    if (nodeData.children && nodeData.children.length > 0) {
      return nodeData.children.map((child) => this.createTreeItem(child));
    }

    return [];
  }

  /**
   * 扫描工作区中的所有日志(带缓存优化 + 异步分批扫描)
   */
  private async scanWorkspace(): Promise<LogEntry[]> {
    const allLogs: LogEntry[] = [];

    try {
      // 获取过滤配置
      const config = vscode.workspace.getConfiguration('simple-log.treeView');
      const excludePatterns = config.get<string[]>('excludeFolders', [
        'node_modules',
        'dist',
        'build',
        'out',
        '.git',
        'coverage',
        '.next',
        '.nuxt',
        'vendor',
      ]);
      const includePatterns = config.get<string[]>('includeFolders', []);

      // 编译正则表达式
      const excludeRegexes = excludePatterns
        .map((pattern) => {
          try {
            return new RegExp(pattern);
          } catch (error) {
            Logger.error(`Invalid exclude pattern: ${pattern}`, error);
            return null;
          }
        })
        .filter(Boolean) as RegExp[];

      const includeRegexes =
        includePatterns.length > 0
          ? (includePatterns
              .map((pattern) => {
                try {
                  return new RegExp(pattern);
                } catch (error) {
                  Logger.error(`Invalid include pattern: ${pattern}`, error);
                  return null;
                }
              })
              .filter(Boolean) as RegExp[])
          : null;

      // 查找支持的文件类型
      const files = await vscode.workspace.findFiles(
        '**/*.{ts,js,tsx,jsx,vue,py,java,go}',
        '**/node_modules/**',
      );

      Logger.debug(`Found ${files.length} files to scan`);

      // 过滤文件列表
      const filteredFiles: vscode.Uri[] = [];
      for (const fileUri of files) {
        const relativePath = path.relative(this.workspaceRoot, fileUri.fsPath);

        // 检查 exclude 规则
        const isExcluded = excludeRegexes.some((regex) =>
          regex.test(relativePath),
        );
        if (isExcluded) {
          continue;
        }

        // 检查 include 规则(如果指定了)
        if (includeRegexes) {
          const isIncluded = includeRegexes.some((regex) =>
            regex.test(relativePath),
          );
          if (!isIncluded) {
            continue;
          }
        }

        filteredFiles.push(fileUri);
      }

      Logger.debug(
        `Filtered to ${filteredFiles.length} files after exclude/include rules`,
      );

      // 🚀 增量扫描: 只扫描变更的文件
      const filesToRescan = await this.cacheManager.filterFilesToRescan(
        filteredFiles,
      );
      Logger.debug(
        `Need to rescan ${filesToRescan.length} files (${
          filteredFiles.length - filesToRescan.length
        } from cache)`,
      );

      // 🎯 异步分批扫描，避免阻塞 UI
      await this.scanFilesInBatches(filesToRescan);

      // 从所有文件（包括缓存的）收集日志
      for (const fileUri of filteredFiles) {
        const cachedLogs = this.cacheManager.get(fileUri.toString());
        if (cachedLogs) {
          allLogs.push(...cachedLogs);
        }
      }

      Logger.info(`Total logs found: ${allLogs.length}`);
      const stats = this.cacheManager.getStats();
      Logger.debug(
        `Cache stats: ${stats.totalFiles} files, ${stats.totalLogs} logs`,
      );
    } catch (error) {
      Logger.error('Failed to scan workspace', error);
      vscode.window.showErrorMessage(`Failed to scan workspace: ${error}`);
    }

    return allLogs;
  }

  /**
   * 分批异步扫描文件，避免阻塞 UI
   * @param files 需要扫描的文件列表
   */
  private async scanFilesInBatches(files: vscode.Uri[]): Promise<void> {
    const BATCH_SIZE = 50; // 每批处理 50 个文件
    const totalBatches = Math.ceil(files.length / BATCH_SIZE);

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const currentBatch = Math.floor(i / BATCH_SIZE) + 1;

      Logger.debug(
        `Processing batch ${currentBatch}/${totalBatches} (${batch.length} files)`,
      );

      // 并发扫描当前批次的所有文件
      await Promise.all(
        batch.map(async (fileUri) => {
          try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const logs = LogScanner.scanDocument(document);

            // 获取文件修改时间
            const mtime = await this.cacheManager.getFileMtime(fileUri);

            // 更新缓存
            this.cacheManager.set(fileUri.toString(), mtime, logs);

            if (logs.length > 0) {
              Logger.debug(
                `Found ${logs.length} logs in ${fileUri.fsPath}`,
              );
            }
          } catch (error) {
            Logger.error(`Failed to scan file ${fileUri.fsPath}`, error);
          }
        }),
      );

      // 让出控制权，避免长时间阻塞
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  /**
   * 构建文件夹树结构
   */
  private buildFolderTree(logs: LogEntry[]): LogTreeNodeData[] {
    // 按文件分组
    const fileMap = new Map<string, LogEntry[]>();

    for (const log of logs) {
      const fileUri = log.fileUri;
      if (!fileMap.has(fileUri)) {
        fileMap.set(fileUri, []);
      }
      fileMap.get(fileUri)!.push(log);
    }

    // 构建树结构 - 使用嵌套的 Map 来管理层级关系
    const rootMap = new Map<string, any>();

    for (const [fileUri, fileLogs] of fileMap) {
      const uri = vscode.Uri.parse(fileUri);
      const relativePath = path.relative(this.workspaceRoot, uri.fsPath);
      const parts = relativePath.split(path.sep);

      // 导航到正确的嵌套位置
      let currentMap = rootMap;
      let currentPath = '';

      // 遍历所有路径部分（包括文件名）
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;

        if (!currentMap.has(part)) {
          if (isFile) {
            // 这是文件节点
            currentMap.set(part, {
              type: 'file',
              logs: fileLogs,
              path: uri.fsPath,
              relativePath: relativePath,
            });
          } else {
            // 这是文件夹节点
            currentPath = currentPath ? path.join(currentPath, part) : part;
            currentMap.set(part, {
              type: 'folder',
              children: new Map(),
              path: path.join(this.workspaceRoot, currentPath),
              relativePath: currentPath,
            });
          }
        }

        // 如果不是文件，继续深入下一层
        if (!isFile) {
          const node = currentMap.get(part);
          currentMap = node.children;
        }
      }
    }

    // 转换 Map 结构为 TreeNodeData 数组
    const result = this.convertMapToTree(rootMap);

    // 计算日志数量
    this.calculateLogCounts(result);

    // 排序
    this.sortTree(result);

    return result;
  }

  /**
   * 将嵌套 Map 结构转换为 TreeNodeData 数组
   */
  private convertMapToTree(map: Map<string, any>): LogTreeNodeData[] {
    const result: LogTreeNodeData[] = [];

    for (const [name, node] of map) {
      if (node.type === 'folder') {
        const folderNode: LogTreeNodeData = {
          type: 'folder',
          label: name,
          fsPath: node.path,
          relativePath: node.relativePath,
          logCount: 0,
          children: this.convertMapToTree(node.children),
        };
        result.push(folderNode);
      } else if (node.type === 'file') {
        const fileNode: LogTreeNodeData = {
          type: 'file',
          label: name, // 直接使用文件名,不做特殊处理
          fsPath: node.path,
          relativePath: node.relativePath,
          logCount: node.logs.length,
          children: node.logs.map((log: LogEntry) => ({
            type: 'log' as const,
            label: this.formatLogLabel(log),
            logCount: 1,
            logEntry: log,
          })),
        };
        result.push(fileNode);
      }
    }

    return result;
  }

  /**
   * 计算每个节点的日志总数（递归）
   */
  private calculateLogCounts(nodes: LogTreeNodeData[]): number {
    let total = 0;

    for (const node of nodes) {
      if (node.type === 'log') {
        total += 1;
      } else if (node.children) {
        node.logCount = this.calculateLogCounts(node.children);
        total += node.logCount;
      }
    }

    return total;
  }

  /**
   * 排序树节点（文件夹在前，文件在后，同类型按名称排序）
   */
  private sortTree(nodes: LogTreeNodeData[]): void {
    nodes.sort((a, b) => {
      // 文件夹优先
      if (a.type === 'folder' && b.type !== 'folder') {
        return -1;
      }
      if (a.type !== 'folder' && b.type === 'folder') {
        return 1;
      }

      // 同类型按名称排序
      return a.label.localeCompare(b.label);
    });

    // 递归排序子节点
    for (const node of nodes) {
      if (node.children) {
        this.sortTree(node.children);
      }
    }
  }

  /**
   * 格式化日志标签
   */
  private formatLogLabel(log: LogEntry): string {
    const lineNumber = log.line + 1;
    const snippet =
      log.content.length > 50
        ? log.content.substring(0, 47) + '...'
        : log.content;

    return `Line ${lineNumber}: ${snippet}`;
  }

  /**
   * 创建 TreeItem
   */
  private createTreeItem(nodeData: LogTreeNodeData): LogTreeItem {
    let collapsibleState: vscode.TreeItemCollapsibleState;

    if (nodeData.type === 'log') {
      collapsibleState = vscode.TreeItemCollapsibleState.None;
    } else if (nodeData.children && nodeData.children.length > 0) {
      collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    } else {
      collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    return new LogTreeItem(nodeData, collapsibleState);
  }

  /**
   * 获取节点的文件路径（用于删除操作）
   */
  getNodePath(item: LogTreeItem): string | undefined {
    return item.nodeData.fsPath;
  }

  /**
   * 获取节点的所有日志（用于批量删除）
   */
  getNodeLogs(item: LogTreeItem): LogEntry[] {
    const logs: LogEntry[] = [];

    const collectLogs = (node: LogTreeNodeData) => {
      if (node.type === 'log' && node.logEntry) {
        logs.push(node.logEntry);
      } else if (node.children) {
        for (const child of node.children) {
          collectLogs(child);
        }
      }
    };

    collectLogs(item.nodeData);
    return logs;
  }
}
