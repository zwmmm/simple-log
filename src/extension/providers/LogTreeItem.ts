import * as path from 'path';
import * as vscode from 'vscode';
import { LogEntry } from '../types';

/**
 * TreeView 节点类型
 */
export type LogTreeItemType = 'folder' | 'file' | 'log';

/**
 * TreeView 节点数据
 */
export interface LogTreeNodeData {
  type: LogTreeItemType;
  label: string;
  /** 文件系统路径（文件夹和文件节点） */
  fsPath?: string;
  /** 相对路径（用于显示） */
  relativePath?: string;
  /** 该节点下的日志数量 */
  logCount: number;
  /** 子节点（文件夹和文件节点） */
  children?: LogTreeNodeData[];
  /** 日志详情（仅日志节点） */
  logEntry?: LogEntry;
}

/**
 * TreeView Item 类
 */
export class LogTreeItem extends vscode.TreeItem {
  constructor(
    public readonly nodeData: LogTreeNodeData,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(nodeData.label, collapsibleState);

    // 设置 contextValue 用于菜单条件判断
    this.contextValue = nodeData.type;

    // 设置图标和 resourceUri
    if (nodeData.type === 'file' && nodeData.fsPath) {
      this.iconPath = vscode.ThemeIcon.File;
      this.resourceUri = vscode.Uri.file(nodeData.fsPath);
    } else {
      // 其他类型使用自定义 ThemeIcon
      this.iconPath = this.getIcon();
    }

    // 设置 tooltip
    this.tooltip = this.getTooltip();

    // 设置 description（右侧辅助信息）
    this.description = this.getDescription();

    // 日志节点支持点击跳转
    if (nodeData.type === 'log' && nodeData.logEntry) {
      this.command = {
        command: 'simple-log.jumpToLog',
        title: 'Jump to Source',
        arguments: [this],
      };
    }
  }

  /**
   * 获取图标
   */
  private getIcon(): vscode.ThemeIcon {
    const { type, logEntry } = this.nodeData;

    switch (type) {
      case 'folder':
        return new vscode.ThemeIcon('folder');

      case 'file':
        // 文件类型在构造函数中已处理,这里不会被调用
        return vscode.ThemeIcon.File;

      case 'log':
        if (!logEntry) {
          return new vscode.ThemeIcon('circle-outline');
        }
        return this.getLogTypeIcon(logEntry.type);

      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }

  /**
   * 获取日志类型图标
   */
  private getLogTypeIcon(logType: LogEntry['type']): vscode.ThemeIcon {
    const iconMap: Record<
      LogEntry['type'],
      { id: string; color?: vscode.ThemeColor }
    > = {
      log: {
        id: 'circle-filled',
        color: new vscode.ThemeColor('testing.iconPassed'),
      },
      info: {
        id: 'info',
        color: new vscode.ThemeColor('notificationsInfoIcon.foreground'),
      },
      warn: {
        id: 'warning',
        color: new vscode.ThemeColor('editorWarning.foreground'),
      },
      error: {
        id: 'error',
        color: new vscode.ThemeColor('editorError.foreground'),
      },
      debug: {
        id: 'debug',
        color: new vscode.ThemeColor('debugIcon.startForeground'),
      },
    };

    const icon = iconMap[logType] || iconMap.log;
    return new vscode.ThemeIcon(icon.id, icon.color);
  }

  /**
   * 获取 Tooltip
   */
  private getTooltip(): string | vscode.MarkdownString {
    const { type, fsPath, relativePath, logCount, logEntry } = this.nodeData;

    switch (type) {
      case 'folder':
        return `${relativePath || fsPath}\n${logCount} logs`;

      case 'file':
        return `${relativePath || fsPath}\n${logCount} logs`;

      case 'log':
        if (!logEntry) {
          return 'Log entry';
        }
        return this.createLogTooltip(logEntry);

      default:
        return '';
    }
  }

  /**
   * 创建日志 Tooltip（Markdown 格式）
   */
  private createLogTooltip(logEntry: LogEntry): vscode.MarkdownString {
    const tooltip = new vscode.MarkdownString();
    tooltip.supportHtml = true;
    tooltip.isTrusted = true;

    const fileUri = vscode.Uri.parse(logEntry.fileUri);
    const fileName = path.basename(fileUri.fsPath);

    tooltip.appendMarkdown(`**File:** \`${fileName}\`\n\n`);
    tooltip.appendMarkdown(`**Line:** ${logEntry.line + 1}\n\n`);
    tooltip.appendMarkdown(`**Variable:** \`${logEntry.variable}\`\n\n`);
    tooltip.appendMarkdown(`**Type:** ${logEntry.type}\n\n`);
    tooltip.appendMarkdown(
      `**Status:** ${logEntry.isCommented ? '💤 Commented' : '✅ Active'}\n\n`,
    );
    tooltip.appendMarkdown(
      `**Code:**\n\`\`\`${logEntry.language}\n${logEntry.content}\n\`\`\`\n`,
    );

    return tooltip;
  }

  /**
   * 获取 Description（右侧辅助信息）
   */
  private getDescription(): string {
    const { type, logCount, logEntry } = this.nodeData;

    switch (type) {
      case 'folder':
      case 'file':
        return logCount > 0 ? `(${logCount})` : '';

      case 'log':
        return logEntry?.isCommented ? '💤' : '';

      default:
        return '';
    }
  }
}
