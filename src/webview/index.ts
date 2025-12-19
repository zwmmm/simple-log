import './styles/main.css';

// 获取 VSCode API
const vscode = acquireVsCodeApi();

// 数据类型定义
interface LogEntry {
  line: number;
  content: string;
  variable: string;
  type: 'log' | 'info' | 'debug' | 'warn' | 'error';
  isCommented: boolean;
}

interface LogStats {
  total: number;
  active: number;
  commented: number;
  byType: Record<string, number>;
}

interface AppData {
  logs: LogEntry[];
  stats: LogStats;
  fileName: string;
}

// 全局函数供 HTML 调用
(window as any).refresh = () => {
  vscode.postMessage({ command: 'refresh' });
};

(window as any).commentAll = () => {
  if (confirm('Comment all logs in current file?')) {
    vscode.postMessage({ command: 'commentAll' });
  }
};

(window as any).deleteAll = () => {
  if (confirm('Delete all logs? This cannot be undone!')) {
    vscode.postMessage({ command: 'deleteAll' });
  }
};

(window as any).jumpToLine = (line: number) => {
  vscode.postMessage({ command: 'jumpToLine', line });
};

(window as any).commentLog = (line: number) => {
  vscode.postMessage({ command: 'commentLog', line });
};

(window as any).deleteLog = (line: number) => {
  if (confirm('Delete this log?')) {
    vscode.postMessage({ command: 'deleteLog', line });
  }
};

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 渲染应用
 */
function render(data: AppData) {
  const { logs, stats, fileName } = data;
  const app = document.getElementById('app');

  if (!app) {
    console.error('App container not found');
    return;
  }

  const typeColors: Record<string, { bg: string; text: string }> = {
    log: { bg: 'bg-blue-500', text: 'text-blue-400' },
    info: { bg: 'bg-cyan-500', text: 'text-cyan-400' },
    debug: { bg: 'bg-purple-500', text: 'text-purple-400' },
    warn: { bg: 'bg-yellow-500', text: 'text-yellow-400' },
    error: { bg: 'bg-red-500', text: 'text-red-400' }
  };

  // 生成单个日志项 HTML
  const getLogItemHtml = (log: LogEntry): string => {
    const colors = typeColors[log.type] || typeColors.log;
    const statusText = log.isCommented ? '💤 Commented' : '✅ Active';
    const commentBtnText = log.isCommented ? '✏️ Uncomment' : '💬 Comment';

    return `
      <div class="bg-gray-800 bg-opacity-30 border ${
        log.isCommented ? 'border-gray-600' : 'border-blue-500'
      } border-opacity-30 rounded-lg p-4 hover:border-opacity-60 transition ${
        log.isCommented ? 'opacity-60' : ''
      }">
        <div class="flex items-center gap-3 mb-3 text-sm">
          <span class="px-2 py-1 bg-gray-700 bg-opacity-50 rounded font-mono text-xs">Line ${log.line + 1}</span>
          <span class="px-2 py-1 ${colors.bg} bg-opacity-20 rounded uppercase text-xs font-semibold ${colors.text}">${log.type}</span>
          <span class="text-xs opacity-70">${statusText}</span>
        </div>
        <div class="bg-black bg-opacity-40 rounded p-3 mb-3 overflow-x-auto">
          <code class="font-mono text-sm">${escapeHtml(log.content)}</code>
        </div>
        <div class="text-sm opacity-70 mb-3">Variable: <strong class="text-green-400 font-mono">${escapeHtml(log.variable)}</strong></div>
        <div class="flex gap-2 flex-wrap">
          <button onclick="jumpToLine(${log.line})" class="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition">
            📍 Jump
          </button>
          <button onclick="commentLog(${log.line})" class="px-3 py-1.5 text-sm bg-yellow-700 hover:bg-yellow-600 rounded transition">
            ${commentBtnText}
          </button>
          <button onclick="deleteLog(${log.line})" class="px-3 py-1.5 text-sm bg-red-700 hover:bg-red-600 rounded transition">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  };

  // 生成日志列表
  const logListHtml = logs.length === 0
    ? '<div class="text-center py-20 opacity-50 text-lg">No logs found in current file</div>'
    : logs.map(log => getLogItemHtml(log)).join('');

  // 完整 HTML
  app.innerHTML = `
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-2">📝 Log Manager</h1>
      <p class="text-sm opacity-70 font-mono">${escapeHtml(fileName)}</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-5 text-center hover:-translate-y-0.5 transition">
        <div class="text-4xl font-bold mb-2 text-blue-400">${stats.total}</div>
        <div class="text-xs opacity-70 uppercase tracking-wider">Total Logs</div>
      </div>
      <div class="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg p-5 text-center hover:-translate-y-0.5 transition">
        <div class="text-4xl font-bold mb-2 text-green-400">${stats.active}</div>
        <div class="text-xs opacity-70 uppercase tracking-wider">Active</div>
      </div>
      <div class="bg-orange-500 bg-opacity-10 border border-orange-500 border-opacity-30 rounded-lg p-5 text-center hover:-translate-y-0.5 transition">
        <div class="text-4xl font-bold mb-2 text-orange-400">${stats.commented}</div>
        <div class="text-xs opacity-70 uppercase tracking-wider">Commented</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 mb-6 flex-wrap">
      <button onclick="refresh()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm hover:-translate-y-0.5 hover:shadow-lg transition">
        🔄 Refresh
      </button>
      <button onclick="commentAll()" class="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium text-sm hover:-translate-y-0.5 hover:shadow-lg transition">
        💬 Comment All
      </button>
      <button onclick="deleteAll()" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium text-sm hover:-translate-y-0.5 hover:shadow-lg transition">
        🗑️ Delete All
      </button>
    </div>

    <!-- Log List -->
    <div class="flex flex-col gap-4">
      ${logListHtml}
    </div>
  `;
}

/**
 * 初始化
 */
function init() {
  // 从内联数据读取
  const dataElement = document.getElementById('inline-data');
  if (!dataElement) {
    console.error('Data element not found');
    return;
  }

  try {
    const data: AppData = JSON.parse(dataElement.textContent || '{}');
    render(data);
    console.log('📝 Simple Log Manager webview loaded');
  } catch (error) {
    console.error('Failed to parse data:', error);
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
