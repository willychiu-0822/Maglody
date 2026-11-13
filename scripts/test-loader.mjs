import { registerHooks } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import ts from 'typescript'

// 使用專案已安裝的編譯器；Node 直接載入前端 TS/TSX，不產生測試 build 檔。
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL)
      for (const ext of ['', '.ts', '.tsx']) {
        if (existsSync(new URL(url.href + ext)) && /\.tsx?$/.test(url.pathname + ext)) return next(url.href + ext, context)
      }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    // 樣式檔在 Node 測試中不需要內容，回傳空模組即可。
    if (/\.css$/.test(new URL(url).pathname)) return { format: 'module', source: 'export {}', shortCircuit: true }
    if (/\.tsx?$/.test(new URL(url).pathname)) {
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        fileName: new URL(url).pathname,
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      }).outputText
      return { format: 'module', source, shortCircuit: true }
    }
    return next(url, context)
  },
})
