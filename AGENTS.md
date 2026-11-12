# AGENTS.md — 會考自然補給站

> 這份文件是 AI 開發助理的「長期維護規則」。在修改、擴充網站前，**先讀完本檔**，再閱讀相關檔案。目標是讓不同 AI 也能用相同方法持續新增筆記，不需要每次從零設計頁面。

## 1. 專案目的與使用者

- 名稱：**會考自然補給站（Science Notes）**。
- 使用者：準備臺灣國中教育會考的國中生，尤其是需要課後複習與家教輔助的學生。
- 核心功能：依科目找筆記、搜尋概念、讀取重點、查看易錯提醒、單題自測、五題快測、在本機儲存已讀進度。
- 教學原則：**先解釋概念，再給規則或公式，最後用題目驗證理解**。文字要清楚、簡短，避免超出國中程度的推導；必須說明公式條件與單位。
- 公開網站為自編輔助教材，**不是**官方會考網站、**不是**歷屆官方題庫，也不宣稱完整涵蓋所有命題範圍。

## 2. 唯一正確的科目架構

**只能有以下三個頂層科目，不得改為四科：**

| 顯示名稱 | `subject` 值 | 內容示例 | 備註 |
| --- | --- | --- | --- |
| 生物 | `biology` | 細胞、遺傳、生態 | 不需 `strand` |
| 理化 | `physical` | 物質、酸鹼、運動、電路 | 物理與化學**合併**為「理化」；用 `strand` 細分 |
| 地球科學 | `earth` | 地震、天氣、天文 | 不需 `strand` |

- `subject: "physical"` 時，`strand` **必須**為 `"物理"` 或 `"化學"`。
- `subject: "biology"` 或 `"earth"` 時，**不可**設定 `strand`。
- 「理化」是唯一的首頁分類；物理與化學只在單元卡片與筆記標籤中作為次分類。

## 3. 專案結構（不可任意搬動）

```text
cap-science-notes/
├── AGENTS.md                  # 本文件：AI 的專案規格與擴充方法
├── README.md                  # 給使用者的使用與 GitHub Pages 部署說明
├── index.html                 # 首頁／筆記頁／五題快測的共用入口
├── guide.html                 # 讀書方法與網站使用指南
├── styles.css                 # 共用視覺設計與手機版排版
├── app.js                     # 由筆記資料渲染頁面與互動的程式
├── data/
│   └── notes.js               # **所有筆記與題目唯一資料來源**
├── assets/
│   └── favicon.svg            # 網站圖示
├── scripts/
│   └── check-content.mjs      # 資料格式與基本內容完整度驗證
├── templates/
│   └── note-template.txt      # 新單元資料範例
└── .nojekyll                  # GitHub Pages 不使用 Jekyll
```

## 4. 技術與部署約束

1. 網站使用 **HTML + CSS + 原生 JavaScript**；不使用 React、Vue、建置工具、資料庫、API Key 或後端。
2. 以 GitHub Pages 的 **branch `main`、folder `/ (root)`** 直接部署；確保資料、路徑都可從 `https://<帳號>.github.io/<倉庫名稱>/` 正常載入。
3. CSS/JS/連結一律使用相對路徑（例如 `./index.html?note=cell-and-osmosis`、`data/notes.js`），**不要**把網址硬寫為特定 GitHub 使用者。
4. 新增筆記**只改** `data/notes.js`；既有 `app.js` 會根據資料自動產生首頁卡片、搜尋結果、文章頁與題庫，不要為單一章節另外複製 HTML。
5. 除非新增「全站功能」才修改 `app.js` / `styles.css`。改動共用程式不得破壞現有文章、篩選、題目或本機進度。
6. 禁止把學生姓名、電話、學校、成績等個資寫到程式碼或公開倉庫。

## 5. `data/notes.js` 的固定資料格式

`data/notes.js` 宣告 `globalThis.EXAM_NOTES = [ ... ];`，每一個物件是一個單元。固定欄位：

| 欄位 | 型別 | 規則 |
| --- | --- | --- |
| `slug` | string | 唯一、英文小寫 kebab-case，如 `light-refraction`；上線後勿隨意改，否則舊連結失效 |
| `subject` | string | 僅 `biology` / `physical` / `earth` |
| `strand` | string（條件必填） | 理化限定：`物理` 或 `化學` |
| `unit` | string | 所屬單元，如「光與聲」 |
| `title` | string | 清楚的中文標題，適合國中生 |
| `summary` | string | 約 1 句，說明這章會讀到什麼 |
| `minutes` | number | 預估閱讀分鐘數，正整數，建議 5–15 |
| `keywords` | string[] | 至少 3 個方便搜尋的繁體中文關鍵字 |
| `takeaways` | string[] | **恰好 3 項**核心觀念 |
| `sections` | object[] | 至少 2 段；每段有 `title`、`text`、`bullets`（至少 2 條） |
| `formula` | object（可選） | 公式章節才加：`label`、`expression`、`explanation`（含參數、單位、適用條件） |
| `trap` | string | 一個常見易錯觀念，包含為什麼錯 |
| `memory` | string | 一句有助記憶的提示，但不可用口訣取代正確說明 |
| `question` | object | `stem` 題幹、`options` **4** 選項、`answer` **0–3** 的整數索引、`explanation` 完整解析 |

- 寫法請直接複製 `templates/note-template.txt` 中的格式，新增在 `EXAM_NOTES` 陣列內；確保逗號、括號正確。
- 題目只能有一個**明確正確**答案，不能模稜兩可。`answer: 0` 表示選項 A、`answer: 1` 表示 B，依此類推。
- 任何內容須為自編／重新整理，不可直接複製參考書全文或未授權題目。

## 6. 每次新增一章的標準 SOP

當使用者說「新增一章：光的折射」時，AI 必須：

1. 讀 `AGENTS.md`、`data/notes.js`、`templates/note-template.txt`。
2. 判斷科目：光的折射為 `subject: "physical"`、`strand: "物理"`。
3. 選擇未使用的 `slug`（如 `light-refraction`），確認原有連結不受影響。
4. 填完整的 `unit`、摘要、關鍵字、**3 個**核心觀念、至少兩段正文、易錯觀念、記憶方式及**1 題 4 選 1**原創測驗。有公式才加入 `formula`。
5. 將**唯一一個新物件**加進 `data/notes.js`，不要另建 `light-refraction.html`。
6. 執行 `node scripts/check-content.mjs`，確認輸出「資料檢查通過」。
7. 預覽並檢查：首頁的「理化」數量增加；搜尋新標題找得到；點進文章可閱讀；題目正解與解析正確；手機版無溢出；「標記已讀」可正常切換。
8. 告知使用者：新增了什麼、改了哪個檔案、驗證結果、有無需要老師覆核的地方。

若只是**修改既有章節**：依 `slug` 找到原物件後直接更新，保持 `slug` 不變，避免進度遺失。

## 7. 網頁視覺與文字規則

- 語言：**繁體中文（臺灣用語）**。如「質量」「體積」「地球科學」「理化」，不要自動改成簡體字或中國教材術語。
- 風格：乾淨、易讀、溫和且不幼稚。奶白背景、森林綠主色、理化藍、生物綠、地科暖橘。
- 顏色、字級、版面優先沿用 `styles.css` 中既有變數與元件（`.note-card`、`.takeaway-box`、`.practice` 等）。**勿為同一功能再造一套設計**。
- 頁面需支援手機（窄至 360px），可用鍵盤操作按鈕，題目選項有清楚的作答後狀態。
- 內文多用短段落與列點；公式一定說明符號、單位、條件；避免誤導性的「永遠」「一定」與過度簡化。
- 模擬題必須標示為**本站原創練習**，不稱為「會考真題」或暗示為歷屆試題。
- 如發現概念不確定，先查核可靠教材或官方資料，**不要自行猜測**；必要時標記待教師確認。

## 8. 功能不變條件（回歸檢查）

- 首頁科目**正好三個**：「生物、理化、地球科學」。
- 理化內包含物理與化學筆記，**不**顯示成第四個頂層科目。
- 搜尋可找到 `title`、`unit`、`summary`、`keywords` 與 `takeaways` 內容。
- `index.html?note=<slug>` 可直接開啟對應筆記；找不到的 slug 顯示友善訊息。
- 單元題目答題後顯示正確答案與解說，能再次作答。
- 五題快測從現有章節抽出最多五題，能檢視解析、總分並重新開始。
- 已讀進度存於瀏覽器 `localStorage`，**不**宣稱跨裝置同步。不得儲存學生可識別資料。
- 靜態站點離線可從本機或 HTTP server 預覽；不依賴外部 API 才能顯示筆記。

## 9. 上傳前驗收清單

- [ ] `node scripts/check-content.mjs` 通過。
- [ ] `index.html`、`guide.html` 都可開啟。
- [ ] 三科分類、搜尋、文章詳情、題目回饋、五題快測、已讀標記正常。
- [ ] 電腦與手機畫面正常；連結無 404、瀏覽器無 JS 錯誤。
- [ ] GitHub 倉庫**公開**，根目錄有 `AGENTS.md`。
- [ ] GitHub Pages 已啟用，公開網址實測能看到首頁與文章。
- [ ] README / 提交內容的 Repo 和 Pages 連結已改成**真實可開啟**的網址。

## 10. 給未來 AI 的指令範例

> 請先閱讀專案根目錄 AGENTS.md，遵守三科分類與資料 schema。現在新增一篇「光的折射」國中會考自然筆記，放在「理化／物理」，包含 3 個核心觀念、至少 2 段說明、常見誤區、公式（如適用）與 1 題原創四選一。只更新 `data/notes.js`，執行 `node scripts/check-content.mjs`，不要新增獨立 HTML 頁面，也不要改動全站色系或其他筆記。
