/*
 * 會考自然補給站 — 無套件、純前端單頁筆記檢視器
 * 模板與新增內容規範：請先閱讀根目錄 AGENTS.md
 */
(() => {
  'use strict';

  const notes = Array.isArray(globalThis.EXAM_NOTES) ? globalThis.EXAM_NOTES : [];
  const app = document.getElementById('app');
  if (!app) return;

  const subjects = [
    { key: 'biology', title: '生物', en: 'BIOLOGY', icon: 'leaf', color: 'green', description: '從細胞到生態系，連結生命的運作方式。' },
    { key: 'physical', title: '理化', en: 'PHYSICAL SCIENCE', icon: 'flask', color: 'blue', description: '一起學物理與化學，把公式與現象讀懂。' },
    { key: 'earth', title: '地球科學', en: 'EARTH SCIENCE', icon: 'earth', color: 'orange', description: '探索板塊、氣象與天文，建立地球觀。' }
  ];
  const LS_KEY = 'science-notes-read-v1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = selector => document.querySelector(selector);
  const icon = (name, size = 22) => {
    const icons = {
      leaf: '<path d="M20 4c-9 0-16 4-16 12a4 4 0 0 0 4 4c8 0 12-7 12-16Z"/><path d="M4 20c2-5 6-8 11-11"/>',
      flask: '<path d="M9 3h6M10 3v7l-5.5 8.5A2.2 2.2 0 0 0 6.3 22h11.4a2.2 2.2 0 0 0 1.8-3.5L14 10V3"/><path d="M7.2 16h9.6"/>',
      earth: '<circle cx="12" cy="12" r="9"/><path d="M3.7 9h4l2 3-1 2 2 2-1 4M16 4l-2 4 2 2h4.5M14 19l3-3 3 .5"/>',
      arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
      back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      book: '<path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1V5Zm8 1v14"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
      spark: '<path d="m12 2 2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1Z"/>',
      bookmark: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
      refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 10a7 7 0 0 1 12-3L20 12M4 12l2.5 5a7 7 0 0 0 12-3"/>',
      award: '<circle cx="12" cy="8" r="5"/><path d="m8 13-2 9 6-3 6 3-2-9"/>',
      alert: '<path d="M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01"/>'
    };
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
  };

  function loadRead() {
    try { const value = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); return new Set(Array.isArray(value) ? value.filter(v => typeof v === 'string') : []); }
    catch { return new Set(); }
  }
  const read = loadRead();
  function setRead(slug, status) {
    if (status) read.add(slug); else read.delete(slug);
    try { localStorage.setItem(LS_KEY, JSON.stringify([...read])); } catch { /* no persistent storage in private mode */ }
  }
  const countRead = () => notes.filter(n => read.has(n.slug)).length;
  const getSubject = key => subjects.find(s => s.key === key) || subjects[0];
  const url = params => `./index.html?${new URLSearchParams(params).toString()}`;
  const noteUrl = slug => url({ note: slug });
  const plural = n => `${n} 個單元`;
  const subjectTag = n => n.subject === 'physical' && n.strand ? `理化 · ${n.strand}` : getSubject(n.subject).title;

  function card(n) {
    const s = getSubject(n.subject);
    return `<a class="note-card" href="${esc(noteUrl(n.slug))}" aria-label="閱讀${esc(n.title)}">
      <div class="note-card-top"><span class="category-dot ${s.color}"></span><span>${esc(subjectTag(n))}</span><span class="read-flag ${read.has(n.slug) ? 'is-read' : ''}">${read.has(n.slug) ? icon('check', 14) + ' 已完成' : '尚未閱讀'}</span></div>
      <h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p>
      <div class="note-card-footer"><span>${icon('clock', 15)} ${esc(n.minutes)} 分鐘閱讀</span><span class="card-arrow">${icon('arrow', 19)}</span></div>
    </a>`;
  }
  function top(title, kicker, desc) {
    return `<div class="section-head"><div><span class="eyebrow">${esc(kicker)}</span><h2>${esc(title)}</h2>${desc ? `<p>${esc(desc)}</p>` : ''}</div></div>`;
  }
  function updateNav(mode) {
    $('#nav-home')?.classList.toggle('active', mode !== 'quiz');
    $('#nav-quiz')?.classList.toggle('active', mode === 'quiz');
    if (mode === 'quiz') $('#nav-quiz')?.setAttribute('aria-current', 'page'); else $('#nav-quiz')?.removeAttribute('aria-current');
    if (mode !== 'quiz') $('#nav-home')?.setAttribute('aria-current', 'page'); else $('#nav-home')?.removeAttribute('aria-current');
  }

  let filter = 'all';
  let query = '';
  function home() {
    document.title = '會考自然補給站｜生物・理化・地球科學';
    updateNav('home');
    app.innerHTML = `
      <section class="hero"><div class="hero-content"><div class="hero-label">${icon('spark', 16)} 為國中自然會考準備的學習空間</div>
      <h1>科學不難，<br><em>只是需要好懂的筆記。</em></h1>
      <p>把生物、理化、地球科學整理成簡單好讀的重點。每次讀懂一個觀念，就離自己的目標更近一步。</p>
      <div class="hero-actions"><a class="button button-dark" href="#notes">探索筆記 ${icon('arrow', 18)}</a><a class="button button-light" href="./index.html?mode=quiz">試試五題快測</a></div>
      <div class="hero-foot"><span>${icon('book', 16)} ${notes.length} 個重點單元</span><span>${icon('check', 16)} 三大科分類</span><span>${icon('clock', 16)} 每章約 7–10 分鐘</span></div></div>
      <div class="hero-graphic" aria-hidden="true"><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="orbit orbit-c"></div><div class="hero-core">${icon('flask', 63)}</div><div class="orbit-dot orbit-dot-a"></div><div class="orbit-dot orbit-dot-b"></div><div class="orbit-dot orbit-dot-c"></div><div class="floating-label label-a">01 / BIOLOGY</div><div class="floating-label label-b">02 / PHYSICAL</div><div class="floating-label label-c">03 / EARTH</div></div></section>
      <section class="progress-panel" aria-label="閱讀進度"><div class="progress-icon">${icon('bookmark', 24)}</div><div class="progress-info"><div class="progress-heading"><strong>你的複習進度</strong><span><b id="progress-num">${countRead()}</b> / ${notes.length} 章已完成</span></div><div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:${notes.length ? countRead() * 100 / notes.length : 0}%"></div></div><small>閱讀完筆記，記得點選「標記已讀」。進度只保存在目前這台裝置。</small></div></section>
      <section class="subject-section" aria-labelledby="subject-title"><div class="section-head"><div><span class="eyebrow">SUBJECTS</span><h2 id="subject-title">從你想讀的科目開始</h2><p>三大分類，一個單元一個單元慢慢累積。</p></div></div>
      <div class="subject-grid">${subjects.map((s, i) => `<button class="subject-card ${s.color}" data-subject="${s.key}" type="button"><div class="subject-card-head"><div class="subject-icon">${icon(s.icon, 30)}</div><span>0${i+1} / ${s.en}</span></div><h3>${s.title}</h3><p>${s.description}</p><div class="subject-card-bottom"><span>${plural(notes.filter(n => n.subject === s.key).length)}</span>${icon('arrow', 19)}</div></button>`).join('')}</div></section>
      <section class="notes-section" id="notes" aria-labelledby="notes-title">${top('所有重點筆記', 'THE NOTEBOOK', '選一章先讀，或直接搜尋你現在想複習的觀念。')}
      <div class="filter-row"><div class="filter-chips" role="group" aria-label="按科目篩選">
      <button type="button" data-filter="all" class="filter-chip selected">全部</button>${subjects.map(s=>`<button type="button" data-filter="${s.key}" class="filter-chip">${s.title}</button>`).join('')}</div>
      <label class="search-box">${icon('search', 19)}<span class="sr-only">搜尋筆記</span><input id="search-input" type="search" placeholder="搜尋章節、公式或關鍵字" autocomplete="off"></label></div>
      <div id="filter-note" class="filter-status" role="status"></div><div class="notes-grid" id="note-list"></div></section>
      <section class="bottom-banner"><div><span class="eyebrow">READY FOR A CHALLENGE?</span><h2>讀完重點，就來測試看看。</h2><p>從所有章節抽出五題，選完就能看到解答與解析。</p></div><a class="button button-dark" href="./index.html?mode=quiz">開始五題快測 ${icon('arrow', 18)}</a></section>
    `;
    $('#search-input').addEventListener('input', e => {query = e.target.value.trim().toLocaleLowerCase('zh-TW');renderList();});
    document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>{filter=el.dataset.filter;updateFilters();renderList();}));
    document.querySelectorAll('[data-subject]').forEach(el=>el.addEventListener('click',()=>{filter=el.dataset.subject;updateFilters();renderList();$('#notes').scrollIntoView({behavior:'smooth'});}));
    filter = new URLSearchParams(location.search).get('subject') || 'all';
    if (!['all',...subjects.map(s=>s.key)].includes(filter)) filter='all';
    query = '';
    updateFilters();renderList();
  }
  function updateFilters(){document.querySelectorAll('[data-filter]').forEach(b=>{const isOn=b.dataset.filter===filter;b.classList.toggle('selected',isOn);b.setAttribute('aria-pressed',String(isOn));});}
  function renderList(){
    const list = notes.filter(n => (filter === 'all' || filter === n.subject) && (!query || [n.title, n.unit, n.summary, ...n.keywords, n.strand || '',...n.takeaways].join(' ').toLocaleLowerCase('zh-TW').includes(query)));
    $('#note-list').innerHTML = list.length ? list.map(card).join('') : '<div class="empty-state">找不到符合條件的筆記。試試其他關鍵字，或切換科目。</div>';
    $('#filter-note').textContent = `顯示 ${list.length} / ${notes.length} 個單元`;
  }

  function article(n) {
    const s = getSubject(n.subject);
    const subjectNotes = notes.filter(x=>x.subject===n.subject);
    const i = subjectNotes.findIndex(x=>x.slug===n.slug);
    const next = subjectNotes[(i + 1) % subjectNotes.length];
    document.title = `${n.title}｜會考自然補給站`;
    updateNav('home');
    app.innerHTML = `<div class="breadcrumbs"><a href="./index.html">首頁</a><span>/</span><a href="${esc(url({subject:n.subject}))}">${s.title}</a><span>/</span><span>${esc(n.title)}</span></div>
    <div class="article-layout"><article class="article-body">
      <header class="article-hero"><div class="article-subject"><span class="category-dot ${s.color}"></span> ${esc(subjectTag(n))}<span class="article-unit">${esc(n.unit)}</span></div><h1>${esc(n.title)}</h1><p>${esc(n.summary)}</p><div class="article-meta"><span>${icon('clock', 17)} 約 ${esc(n.minutes)} 分鐘</span><span>${icon('book', 17)} 觀念筆記</span></div></header>
      <section class="takeaway-box"><span class="eyebrow">KEY TAKEAWAYS</span><h2>這章先記住三件事</h2><ul>${n.takeaways.map(x=>`<li>${icon('check', 17)}<span>${esc(x)}</span></li>`).join('')}</ul></section>
      ${n.sections.map((part, idx)=>`<section class="article-section"><div class="section-number">0${idx+1}</div><h2>${esc(part.title)}</h2><p>${esc(part.text)}</p><ul class="regular-list">${part.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join('')}
      ${n.formula ? `<section class="formula-panel"><span class="eyebrow">FORMULA</span><h2>${esc(n.formula.label)}</h2><div class="formula-expression">${esc(n.formula.expression)}</div><p>${esc(n.formula.explanation)}</p></section>` : ''}
      <section class="trap-box"><div class="box-heading">${icon('alert', 20)} <h2>最容易搞錯的地方</h2></div><p>${esc(n.trap)}</p></section>
      <section class="memory-box"><div class="box-heading">${icon('spark', 20)} <h2>一個好記的方法</h2></div><p>${esc(n.memory)}</p></section>
      <section class="practice" id="practice"><span class="eyebrow">CHECK YOURSELF</span><h2>讀懂了嗎？試一題看看</h2><p class="question-stem">${esc(n.question.stem)}</p><div class="options" id="article-options" role="group" aria-label="單元測驗選項">${n.question.options.map((o,j)=>`<button class="option" type="button" data-answer="${j}"><span>${'ABCD'[j]}</span>${esc(o)}</button>`).join('')}</div><div id="article-feedback" class="answer-feedback" role="status" aria-live="polite"></div></section>
      <div class="article-actions"><button id="mark-read" type="button" class="button ${read.has(n.slug) ? 'button-done' : 'button-dark'}">${icon('check',18)} ${read.has(n.slug) ? '已完成閱讀 · 點我取消' : '標記已讀'}</button><a class="button button-light" href="${esc(noteUrl(next.slug))}">閱讀下一章 ${icon('arrow',18)}</a></div>
    </article>
    <aside class="article-sidebar"><div class="sidebar-box"><span class="eyebrow">IN THIS NOTE</span><h3>本篇重點</h3><ol><li>三個核心觀念</li>${n.sections.map(part=>`<li>${esc(part.title)}</li>`).join('')}<li>常見迷思與小測驗</li></ol></div><div class="sidebar-next"><span class="eyebrow">KEEP READING</span><strong>下一個單元</strong><a href="${esc(noteUrl(next.slug))}">${esc(next.title)} ${icon('arrow',17)}</a></div><a class="sidebar-back" href="${esc(url({subject:n.subject}))}">${icon('back',17)} 回到${esc(s.title)}筆記</a></aside></div>`;
    document.querySelectorAll('#article-options button').forEach(btn => btn.addEventListener('click', () => {
      const selected = Number(btn.dataset.answer);
      const good = selected === n.question.answer;
      document.querySelectorAll('#article-options button').forEach(b=>{ b.disabled=true; if(Number(b.dataset.answer)===n.question.answer) b.classList.add('is-correct'); if(b===btn && !good)b.classList.add('is-wrong'); });
      const response = $('#article-feedback'); response.className=`answer-feedback visible ${good?'success':'error'}`;
      response.innerHTML=`<strong>${good?'答對了！':'再記住這個觀念。'}</strong><p>${esc(n.question.explanation)}</p><button id="retry-question" class="text-button" type="button">再練一次 ${icon('refresh',15)}</button>`;
      $('#retry-question').addEventListener('click',()=>{ document.querySelectorAll('#article-options button').forEach(b=>{ b.disabled=false; b.classList.remove('is-correct','is-wrong'); }); response.className='answer-feedback'; response.textContent=''; });
    }));
    $('#mark-read').addEventListener('click',()=>{const mark=!read.has(n.slug);setRead(n.slug,mark);const b=$('#mark-read');b.className=`button ${mark?'button-done':'button-dark'}`;b.innerHTML=`${icon('check',18)} ${mark?'已完成閱讀 · 點我取消':'標記已讀'}`;});
  }

  let game = null;
  function startQuiz(){
    const pool=[...notes];
    // Fisher–Yates shuffle; 5 questions from different units in the current question bank.
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    game={questions:pool.slice(0,Math.min(5,pool.length)),index:0,score:0,answered:false};
    renderQuiz();
  }
  function quizPage(){
    document.title='五題快測｜會考自然補給站';updateNav('quiz');startQuiz();
  }
  function renderQuiz(){
    if(!game.questions.length){app.innerHTML='<div class="empty-state">目前沒有題庫內容。</div>';return;}
    const q = game.questions[game.index];
    if(!q){app.innerHTML=`<div class="quiz-end"><div class="quiz-end-icon">${icon('award',38)}</div><span class="eyebrow">QUIZ COMPLETED</span><h1>完成這次的小測驗！</h1><div class="final-score"><strong>${game.score}</strong><span> / ${game.questions.length} 題答對</span></div><p>${game.score===game.questions.length?'五題全對！可以再挑其他章節挑戰。':'知道哪裡還不熟，就是複習的第一步。回到筆記再練一次吧！'}</p><div class="quiz-end-buttons"><button type="button" class="button button-dark" id="replay">重新抽題 ${icon('refresh',18)}</button><a class="button button-light" href="./index.html">回到筆記 ${icon('arrow',18)}</a></div></div>`;$('#replay').addEventListener('click',startQuiz);return;}
    const number=game.index+1;
    app.innerHTML=`<div class="quiz-screen"><a class="quiz-back" href="./index.html">${icon('back',17)} 返回筆記</a><div class="quiz-wrapper"><div class="quiz-intro"><span class="eyebrow">SCIENCE CHALLENGE</span><h1>五題快測</h1><p>不用急著看答案，先用自己的理解判斷。</p></div><div class="quiz-card"><div class="quiz-count"><span>QUESTION <strong>${number.toString().padStart(2,'0')}</strong> / ${game.questions.length.toString().padStart(2,'0')}</span><span>目前答對 ${game.score} 題</span></div><div class="quiz-progress"><div style="width:${(number-1)*100/game.questions.length}%"></div></div><span class="quiz-subject">${esc(subjectTag(q))} / ${esc(q.title)}</span><h2>${esc(q.question.stem)}</h2><div class="options quiz-options">${q.question.options.map((option,i)=>`<button class="option" type="button" data-quiz-answer="${i}"><span>${'ABCD'[i]}</span>${esc(option)}</button>`).join('')}</div><div id="quiz-feedback" class="answer-feedback" aria-live="polite" role="status"></div><div class="quiz-next-slot" id="quiz-next-slot"></div></div></div></div>`;
    document.querySelectorAll('[data-quiz-answer]').forEach(button=>button.addEventListener('click',()=>{
      if(game.answered)return;game.answered=true;
      const selected=Number(button.dataset.quizAnswer);const correct=selected===q.question.answer;if(correct)game.score++;
      document.querySelectorAll('[data-quiz-answer]').forEach(b=>{b.disabled=true;if(Number(b.dataset.quizAnswer)===q.question.answer)b.classList.add('is-correct');if(b===button&&!correct)b.classList.add('is-wrong');});
      const result=$('#quiz-feedback');result.className=`answer-feedback visible ${correct?'success':'error'}`;
      result.innerHTML=`<strong>${correct?'答對了！':'這題的正確答案是 '+ 'ABCD'[q.question.answer]+'。'}</strong><p>${esc(q.question.explanation)}</p>`;
      $('#quiz-next-slot').innerHTML=`<button class="button button-dark" id="next-question" type="button">${number===game.questions.length?'查看總分':'下一題'} ${icon('arrow',18)}</button>`;
      $('#next-question').addEventListener('click',()=>{game.index++;game.answered=false;renderQuiz();window.scrollTo({top:0,behavior:'smooth'});});
    }));
  }

  function main(){
    const params=new URLSearchParams(location.search);
    const noteSlug=params.get('note');
    const pageNote=notes.find(n=>n.slug===noteSlug);
    if(noteSlug && !pageNote){document.title='找不到筆記｜會考自然補給站';app.innerHTML=`<div class="empty-state missing-note"><h1>找不到這篇筆記</h1><p>這個連結可能已過期，或章節尚未建立。</p><a class="button button-dark" href="./index.html">回到首頁</a></div>`;return;}
    if(pageNote) article(pageNote);
    else if(params.get('mode')==='quiz') quizPage();
    else home();
  }
  main();
})();
