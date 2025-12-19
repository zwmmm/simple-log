import { JavaScriptAdapter } from './JavaScriptAdapter';

/**
 * Vue 适配器
 * Vue 文件使用 JavaScript/TypeScript，因此继承 JavaScriptAdapter
 */
export class VueAdapter extends JavaScriptAdapter {
  readonly languageId = 'vue';

  getVariablePattern(): RegExp {
    // Vue 支持 JavaScript 和 TypeScript 语法
    // 包括: const/let/var 声明, 解构赋值, 以及 Vue 3 Composition API
    return /(?:const|let|var)\s+(\w+)(?::\s*\w+)?|(\w+)\s*=/;
  }
}
