/**
 * 在 cap-science-notes 倉庫根目錄執行：node apply-light-unit.mjs
 * 僅更新 data/notes.js；若資料驗證失敗，會還原該檔案。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repo = process.cwd();
const notesPath = path.join(repo, 'data', 'notes.js');
const checkPath = path.join(repo, 'scripts', 'check-content.mjs');
const packageDir = path.dirname(fileURLToPath(import.meta.url));
const additionPath = path.join(packageDir, 'light-notes-addition.txt');

for (const p of [notesPath, checkPath, additionPath]) {
  if (!fs.existsSync(p)) throw new Error(`找不到檔案：${p}\n請在專案根目錄執行，並確認下載檔案位於同一資料夾。`);
}
const original = fs.readFileSync(notesPath, 'utf8');
const addition = fs.readFileSync(additionPath, 'utf8').trimEnd();
const slugs = ['light-straight-reflection', 'light-refraction', 'lenses-and-images'];
for (const slug of slugs) {
  if (new RegExp(`slug:\\s*["']${slug}["']`).test(original)) {
    throw new Error(`已有 slug ${slug}。為避免重複，未做任何修改。`);
  }
}
if (!/^  \{/m.test(addition) || !addition.endsWith('  }')) {
  throw new Error('筆記資料片段格式不符，未做任何修改。');
}
const end = /\r?\n\];\s*$/.exec(original);
if (!end) throw new Error('找不到 EXAM_NOTES 陣列結尾的「];」，未做任何修改。');
const updated = original.slice(0, end.index) + ',\n' + addition + '\n];\n';
fs.writeFileSync(notesPath, updated);
try {
  const result = execFileSync(process.execPath, [checkPath], { cwd: repo, encoding: 'utf8' });
  console.log(result.trim());
  console.log('已新增三篇「光」筆記；僅修改 data/notes.js。');
  console.log('可上傳更新後的 data/notes.js 至 GitHub。');
} catch (e) {
  fs.writeFileSync(notesPath, original);
  console.error(e.stdout?.toString() || e.stderr?.toString() || e.message);
  throw new Error('資料驗證失敗，已自動還原 data/notes.js。');
}
