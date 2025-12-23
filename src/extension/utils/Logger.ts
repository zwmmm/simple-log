import * as vscode from 'vscode';

/**
 * 日志管理器
 * 提供统一的日志输出到 VSCode Output Channel
 */
export class Logger {
  private static outputChannel: vscode.OutputChannel;

  /**
   * 初始化日志输出通道
   */
  static initialize(context: vscode.ExtensionContext): void {
    this.outputChannel = vscode.window.createOutputChannel('Simple Log');
    context.subscriptions.push(this.outputChannel);
    this.info('Simple Log extension activated');
  }

  /**
   * 输出信息日志
   */
  static info(message: string, ...args: any[]): void {
    const formattedMessage = this.formatMessage('INFO', message, args);
    this.outputChannel.appendLine(formattedMessage);
  }

  /**
   * 输出警告日志
   */
  static warn(message: string, ...args: any[]): void {
    const formattedMessage = this.formatMessage('WARN', message, args);
    this.outputChannel.appendLine(formattedMessage);
  }

  /**
   * 输出错误日志
   */
  static error(message: string, error?: any): void {
    const errorDetail = error
      ? `\n${error.stack || error.message || JSON.stringify(error)}`
      : '';
    const formattedMessage = this.formatMessage('ERROR', message) + errorDetail;
    this.outputChannel.appendLine(formattedMessage);
  }

  /**
   * 输出调试日志
   */
  static debug(message: string, ...args: any[]): void {
    const formattedMessage = this.formatMessage('DEBUG', message, args);
    this.outputChannel.appendLine(formattedMessage);
  }

  /**
   * 显示输出面板
   */
  static show(): void {
    this.outputChannel.show();
  }

  /**
   * 格式化日志消息
   */
  private static formatMessage(
    level: string,
    message: string,
    args?: any[]
  ): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const argsStr = args && args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level}] ${message}${argsStr}`;
  }
}
