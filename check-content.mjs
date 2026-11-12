/** 會考自然補給站 — 零依賴的章節格式檢查器。執行：node scripts/check-content.mjs */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'data', 'notes.js'), 'utf8');
const sandbox = {};
const errors = [];
try { vm.runInNewContext(src, sandbox, { filename: 'data/notes.js', timeout: 1000 }); }
catch (e) { console.error('JavaScript 語法錯誤：', e.message); process.exit(1); }
const notes = sandbox.EXAM_NOTES;
const isStr = v => typeof v === 'string' && !!v.trim();
const requiredString = (v, label) => { if (!isStr(v)) errors.push(`${label} 不可空白`); };
if (!Array.isArray(notes) || !notes.length) errors.push('EXAM_NOTES 必須是非空陣列');
const allowed = new Set(['biology','physical','earth']);
const used = new Set();
if (Array.isArray(notes)) for (const [i, n] of notes.entries()) {
  const prefix = `[單元 ${i + 1}: ${n?.slug ?? '(無 slug)'}]`;
  const err = message => errors.push(`${prefix} ${message}`);
  if (!n || typeof n !== 'object') {err('資料須為物件'); continue;}
  requiredString(n.slug, `${prefix} slug`);
  if (isStr(n.slug) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.slug)) err('slug 僅允許小寫英文、數字及連字號');
  if (used.has(n.slug)) err('slug 重複'); else used.add(n.slug);
  if (!allowed.has(n.subject)) err('subject 只能為 biology / physical / earth');
  if (n.subject === 'physical' && !['物理','化學'].includes(n.strand)) err('理化必須有 strand: 物理或化學');
  if (n.subject !== 'physical' && 'strand' in n) err('非理化不可設定 strand');
  for (const key of ['unit','title','summary','trap','memory']) requiredString(n[key], `${prefix} ${key}`);
  if (!Number.isInteger(n.minutes) || n.minutes <= 0) err('minutes 必須是正整數');
  if (!Array.isArray(n.keywords) || n.keywords.length < 3 || !n.keywords.every(isStr)) err('keywords 至少 3 個非空白字串');
  if (!Array.isArray(n.takeaways) || n.takeaways.length !== 3 || !n.takeaways.every(isStr)) err('takeaways 必須恰好 3 項');
  if (!Array.isArray(n.sections) || n.sections.length < 2) err('sections 至少兩段');
  else for (const [j, sec] of n.sections.entries()) {
    if (!isStr(sec?.title) || !isStr(sec?.text) || !Array.isArray(sec?.bullets) || sec.bullets.length < 2 || !sec.bullets.every(isStr)) err(`sections[${j}] 須含 title / text / 至少 2 條 bullets`);
  }
  if (n.formula && (!isStr(n.formula.label) || !isStr(n.formula.expression) || !isStr(n.formula.explanation))) err('formula 須含 label / expression / explanation');
  const q = n.question;
  if (!q || !isStr(q.stem) || !Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(isStr) || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3 || !isStr(q.explanation)) err('question 需題幹、4 選項、0–3 的正確答案與解析');
}
if (errors.length) {
  console.error(`資料檢查失敗：${errors.length} 項問題\n` + errors.map(x=>'  - '+x).join('\n'));
  process.exit(1);
}
const counts = Object.fromEntries(['biology','physical','earth'].map(s=>[s,notes.filter(n=>n.subject===s).length]));
console.log(`資料檢查通過：共 ${notes.length} 篇（生物 ${counts.biology}、理化 ${counts.physical}、地球科學 ${counts.earth}），slug / 類別 / 章節 / 題目格式均正確。`);
