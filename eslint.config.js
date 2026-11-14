// 審查報告 M-19：原始碼裡早就有 eslint-disable 註解，卻沒有 ESLint。
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'test-results', 'playwright-report', 'docs', 'public', 'scripts'] },
  js.configs.recommended,
  // 全形空白（　）是文案裡刻意用的字，只在程式碼本身（不是字串、樣板、JSX 文字）出現才算錯
  { rules: { 'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true, skipJSXText: true, skipComments: true }] } },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    // 只開 hooks 的兩條老規則：呼叫規則與依賴陣列（報告要的是「有人在檢查依賴」）。
    // react-hooks 7 附的 React Compiler 系列規則（refs、set-state-in-effect…）會把現有刻意的寫法（用 ref 鏡像最新 state）全部標紅，
    // 等哪天真的要採用 React Compiler 再一起處理。
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn' },
  },
)
