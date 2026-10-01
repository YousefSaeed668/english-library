/* Hash-routed static application; all learning state belongs to this browser. */
(() => {
  'use strict';
  const data=ENGLISH_LIBRARY, all=[...data.vocabulary,...data.patterns], byId=new Map(all.map(x=>[x.id,x]));
  const categoryMap=new Map(data.categories.map(x=>[x.id,x]));
  const $=s=>document.querySelector(s), esc=LibrarySearch.escape;
  const main=$('#main'), details=$('#details');
  let route='home',query='',page=1,category='',type='',status='',sort='source',detailed=false,savedKind='',focus=false,detailId=null;
  let studyOptions={content:'both',collection:'all',category:'',size:20,mode:'en-ar'};
  let searchTimer,toastTimer;
  const fmt=n=>Number(n).toLocaleString('en');
  const name=id=>categoryMap.get(id)?.name||'';
  const options=(rows,value)=>rows.map(([id,label])=>`<option value="${esc(id)}" ${String(id)===String(value)?'selected':''}>${esc(label)}</option>`).join('');
  const categoryOptions=value=>options([['','Every category'],...data.categories.map(c=>[c.id,c.name])],value);
  const link=(id,label)=>`<button data-action="detail" data-id="${id}">${esc(label)}</button>`;
  function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
  function persistCheck(){if(!Notebook.available())toast('Progress is kept for this visit. Export a backup to keep it.');}
  function heading(title,subtitle,extra=''){return `<div class="page-head"><div><p class="eyebrow">YOUR SPEAKING NOTEBOOK</p><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${extra}</div>`;}
  const button=(action,label,extra='')=>`<button data-action="${action}" ${extra}>${label}</button>`;
  function template(text){return esc(text).replace(/…/g,'<span class="template-slot" aria-label="replaceable part">…</span>');}
  function entry(item){
    const s=Notebook.get(item.id),title=query?LibrarySearch.highlight(item.english,query):item.kind==='pattern'?template(item.english):esc(item.english);
    const arabic=LibrarySearch.highlight(item.arabic,query);
    const example=item.examples?.[0]||item.variations?.[0]?.english;
    return `<article class="entry" data-item="${item.id}"><div><div class="entry-type">${esc(item.kind==='pattern'?'Sentence pattern · '+name(item.categories[0]):item.type+' · '+name(item.categories[0]))}</div><button class="entry-title" data-action="detail" data-id="${item.id}">${title}</button><p class="arabic" lang="ar" dir="rtl">${arabic}</p>${detailed&&example?`<p class="inline-example">${LibrarySearch.highlight(example,query)}</p>`:''}${detailed&&item.usage?.length?`<p class="meta">${esc(item.usage[0])}</p>`:''}</div><div class="entry-actions"><span class="status ${s.status}">${s.status==='new'?'':s.status}</span><button class="save-button" data-action="save" data-id="${item.id}" aria-pressed="${s.saved}" aria-label="${s.saved?'Unsave':'Save'} ${esc(item.english)}">${s.saved?'♥':'♡'}</button></div></article>`;
  }
  function categoryTile(c,i){return `<a class="category-tile" href="#category/${c.id}"><span class="index">${String(i+1).padStart(2,'0')} / EXPLORE</span><h3>${esc(c.name)}</h3><p>${fmt(c.vocabularyCount)} words & phrases${c.patternCount?` · ${c.patternCount} patterns`:''}</p></a>`;}
  function home(){
    const resume=Notebook.session(),saved=all.filter(x=>Notebook.get(x.id).saved).length,difficult=all.filter(x=>Notebook.get(x.id).status==='difficult').length;
    const learned=all.filter(x=>Notebook.get(x.id).status==='learned').length;
    const hasResume=resume&&resume.index<resume.ids.length;
    const last=byId.get(Notebook.last());
    main.innerHTML=`<div class="home-intro"><p class="eyebrow">WORDS INTO CONVERSATIONS</p><h1>Build English you<br>can actually use.</h1><p>Your personal library of words, expressions and reusable speaking patterns.</p></div>
    <div class="home-grid"><section class="practice-panel"><p class="eyebrow">${hasResume?'CONTINUE WHERE YOU LEFT OFF':"A FEW MINUTES, WELL SPENT"}</p><h2>${hasResume?'Pick up your practice.':"Today’s speaking practice"}</h2><p>${hasResume?`${resume.index+1} of ${resume.ids.length} · ${esc(byId.get(resume.ids[resume.index])?.english||'Your next item')}`:'Recall 20 useful items, then make a few sentences about your own life.'}</p>${button(hasResume?'resume':'daily',hasResume?'Continue studying →':'Start 20 items →','class="primary"')}</section>
    <div class="quick-links"><a href="#vocabulary" class="quick-link"><span class="quick-icon">Aa</span><span><strong>Explore vocabulary</strong><small>${fmt(data.vocabulary.length)} words & expressions</small></span><span class="arrow">↗</span></a><a href="#patterns" class="quick-link"><span class="quick-icon">≋</span><span><strong>Find a speaking pattern</strong><small>${data.patterns.length} templates to make your own</small></span><span class="arrow">↗</span></a><a href="#saved" class="quick-link"><span class="quick-icon">♡</span><span><strong>Your saved collection</strong><small>${saved?`${saved} items worth coming back to`:'Keep the language that feels useful'}</small></span><span class="arrow">↗</span></a></div></div>
    <div class="section-head"><h2>What would you like to say?</h2><a href="#toolbox">All ${data.categories.length} topics ↗</a></div><div class="category-grid">${[0,2,9,12,6,8].map(i=>categoryTile(data.categories[i],i)).join('')}</div>
    <div class="section-head"><h2>A small next step</h2>${button('random','Random 10 ↗','class="text-button"')}</div><p class="muted">${difficult?`${difficult} difficult items are ready for another try. ${button('difficult','Review difficult items','class="text-button"')}`:'Try saying one true sentence out loud. Change the person, the time, or the reason.'}</p>${last?`<p class="meta">Last opened: ${link(last.id,last.english)}</p>`:''}<div class="footer-note"><span>${fmt(data.vocabulary.length)} vocabulary entries · ${data.patterns.length} patterns · ${learned} learned</span><span>English ↔ العربية</span></div>`;
  }
  function collection(){
    let rows=route==='vocabulary'?data.vocabulary:route==='patterns'?data.patterns:all;
    let title=route==='search'?'Search the library':route==='saved'?'Your saved items':route.startsWith('category/')?name(category):route==='patterns'?'Sentence patterns':'Vocabulary';
    let subtitle=route==='patterns'?'Reusable structures. Natural variations. Your own sentences.':route==='saved'?'The language you want to keep close.':route==='search'?'Search words, meanings, examples and complete patterns.':'Words and expressions for real conversations.';
    if(route==='saved') rows=rows.filter(x=>Notebook.get(x.id).saved);
    if(savedKind&&route==='saved')rows=rows.filter(x=>savedKind==='patterns'?x.kind==='pattern':x.kind==='vocabulary');
    if(category)rows=rows.filter(x=>x.categories.includes(category));
    if(type)rows=rows.filter(x=>x.types?.includes(type));
    if(status)rows=rows.filter(x=>Notebook.get(x.id).status===status);
    if(query)rows=rows.filter(x=>LibrarySearch.matches(x,query));
    if(sort==='az')rows=rows.slice().sort((a,b)=>a.english.localeCompare(b.english,'en'));
    if(sort==='review')rows=rows.slice().sort((a,b)=>(Notebook.get(a.id).lastReviewed||0)-(Notebook.get(b.id).lastReviewed||0));
    if(sort==='saved')rows=rows.slice().sort((a,b)=>(Notebook.get(b.id).savedAt||0)-(Notebook.get(a.id).savedAt||0));
    const totalPages=Math.max(1,Math.ceil(rows.length/40));page=Math.min(page,totalPages);
    const isCategory=route.startsWith('category/');
    const types=[...new Set(data.vocabulary.flatMap(x=>x.types))].sort();
    main.innerHTML=heading(title,subtitle,`<span class="head-stat" role="status">${fmt(rows.length)} ${route==='patterns'?'patterns':'items'}</span>`)+
      (isCategory?`<div class="speaking-note"><h3>Put it into words</h3><p>${esc(categoryMap.get(category)?.prompt||'')}</p>${button('study-category','Study this topic →','class="text-button"')}</div>`:'')+
      `<div class="filters">${!isCategory?`<label>Topic<select id="filter-category">${categoryOptions(category)}</select></label>`:''}${route!=='patterns'?`<label>Type<select id="filter-type">${options([['','All words & phrases'],...types.map(x=>[x,x])],type)}</select></label>`:''}<label>Learning state<select id="filter-status">${options([['','Every state'],['new','New'],['learning','Learning'],['learned','Learned'],['difficult','Difficult']],status)}</select></label><label>Sort<select id="filter-sort">${options([['source','Collection order'],['az','A → Z'],['review','Least recently reviewed'],['saved','Recently saved']],sort)}</select></label>${route==='saved'?`<label>Collection<select id="saved-kind">${options([['','Vocabulary & patterns'],['vocabulary','Vocabulary'],['patterns','Patterns']],savedKind)}</select></label>`:''}</div>
      <div class="filter-bar"><span>${rows.length?`${(page-1)*40+1}–${Math.min(page*40,rows.length)} of ${fmt(rows.length)}`:'No matching items'}${query?' · '+esc(query):''}</span><span class="push"></span>${button('clear-filters','Clear filters','class="text-button"')}${button('view','Detailed view',`class="toggle" aria-pressed="${detailed}"`)}${button('study-filtered','Study these →','class="toggle"')}</div>
      ${rows.length?`<div class="item-list">${rows.slice((page-1)*40,page*40).map(entry).join('')}</div><div class="pagination">${button('prev-page','← Previous',page===1?'disabled':'')}<span>Page ${page} / ${totalPages}</span>${button('next-page','Next →',page===totalPages?'disabled':'')}</div>`:`<div class="empty"><h2>${route==='saved'&&!query&&!status&&!category?'A notebook starts with one useful phrase.':'No matches yet.'}</h2><p>${route==='saved'?'Tap the heart beside any word or pattern to save it here.':'Try a shorter search, in English or Arabic, or clear the filters.'}</p><a href="#vocabulary">Explore vocabulary →</a></div>`}`;
    main.dataset.filtered=JSON.stringify(rows.map(x=>x.id));
  }
  function toolbox(){main.innerHTML=heading('Speaking toolbox','Find language for what you want to communicate.')+`<div class="category-grid">${data.categories.map(categoryTile).join('')}</div>`;}
  function showDetails(id){
    const item=byId.get(id);if(!item)return;detailId=id;Notebook.open(id);const s=Notebook.get(id);
    details.innerHTML=`<div class="dialog-top"><div><p class="eyebrow">${esc(item.kind==='pattern'?'SENTENCE PATTERN':item.type)}</p><h2 id="detail-title">${item.kind==='pattern'?template(item.english):esc(item.english)}</h2></div>${button('close-detail','×','class="close" aria-label="Close item details"')}</div><p class="arabic detail-arabic" lang="ar" dir="rtl">${esc(item.arabic)}</p><div class="related">${item.categories.map(c=>`<button data-action="category" data-category="${c}">${esc(name(c))} ↗</button>`).join('')}</div>
      ${item.kind==='pattern'?`<section class="detail-section"><h3>Change the ending. Make it yours.</h3><p class="meta">The marked dots are parts you can replace. Some expressions can also be used as complete replies.</p><details open><summary>${item.variations.length} natural variations</summary>${item.variations.map(v=>`<div class="variation"><p>${esc(v.english)}</p><p class="arabic" lang="ar" dir="rtl">${esc(v.arabic)}</p></div>`).join('')}</details></section>`:
      item.examples.length?`<section class="detail-section"><h3>In conversation</h3>${item.examples.map(ex=>`<p class="example">“${esc(ex)}”</p>`).join('')}</section>`:''}
      ${item.usage.length?`<section class="detail-section"><h3>Usage notes</h3>${item.usage.map(u=>`<p dir="auto">${esc(u)}</p>`).join('')}</section>`:''}
      ${item.senses?.length>1?`<details class="detail-section"><summary>Source meanings & contexts (${item.senses.length})</summary><p class="meta">Each meaning stays attached to its source example. Similar wording can have different uses.</p>${item.senses.map(r=>`<div class="sense"><small>${esc(r.sourceCategory)} · ${esc(r.source)}</small><p class="arabic" lang="ar" dir="rtl">${esc(r.arabic)}</p>${r.example?`<p>${esc(r.example)}</p>`:''}${r.usage?`<p class="meta">${esc(r.usage)}</p>`:''}</div>`).join('')}</details>`:''}
      <div class="detail-actions">${button('save',s.saved?'♥ Saved':'♡ Save',`data-id="${id}" aria-pressed="${s.saved}"`)}${button('learned','✓ Learned',`data-id="${id}" aria-pressed="${s.status==='learned'}"`)}${button('difficult','! Difficult',`data-id="${id}" aria-pressed="${s.status==='difficult'}"`)}${button('learning','Learning',`data-id="${id}" aria-pressed="${s.status==='learning'}"`)}${button('copy','Copy English',`data-id="${id}"`)}${button('practice-item','Practice →',`data-id="${id}"`)}</div>
      ${item.related?.length?`<section class="detail-section"><h3>${item.kind==='pattern'?'Words inside these sentences':'Patterns using this expression'}</h3><div class="related">${item.related.slice(0,8).map(id=>link(id,byId.get(id).english)).join('')}</div></section>`:''}<p class="source-note detail-section">${item.kind==='pattern'?`${esc(item.source)} · Pattern ${item.sourceNumber}`:`${item.senses.length} source row${item.senses.length>1?'s':''} preserved`}</p>`;
    if(!details.open)details.showModal();
  }
  function study(){
    const s=Notebook.session();
    if(s){renderSession();return;}
    main.innerHTML=heading('A little speaking practice','Recall first. Reveal second. Then say something of your own.')+
    `<section class="study-options"><div class="filters"><label>Material<select id="study-content">${options([['both','Vocabulary & patterns'],['vocabulary','Vocabulary'],['patterns','Patterns']],studyOptions.content)}</select></label><label>Practice mode<select id="study-mode">${options([['en-ar','English → Arabic'],['ar-en','Arabic → English'],['context','Context recall'],['pattern','Pattern practice']],studyOptions.mode)}</select></label><label>Collection<select id="study-collection">${options([['all','Everything'],['new','New'],['learning','Learning'],['difficult','Difficult'],['saved','Saved'],['learned','Learned']],studyOptions.collection)}</select></label><label>Topic<select id="study-category">${categoryOptions(studyOptions.category)}</select></label><label>Session length<select id="study-size">${options([[10,'10 items'],[20,'20 items'],[30,'30 items']],studyOptions.size)}</select></label></div><p class="meta" id="eligible-count">${LibraryStudy.eligible(studyOptions).length} items available${studyOptions.mode==='context'?' · Only reliable source examples are included.':''}</p>${button('start-study','Start practice →','class="primary"')}</section><div class="collection-links">${button('daily',"Today’s practice · 20")}${button('difficult','Difficult items')}${button('random','Random 10')}${button('patterns-study','Pattern practice')}</div><div class="speaking-note" style="margin-top:30px"><h3>Make it useful</h3><p>After you recall an item, use it in a true sentence. Finish with a one-minute story using three things you practised.</p></div>`;
  }
  function renderSession(){
    const s=Notebook.session(),item=LibraryStudy.current();
    document.body.classList.toggle('focus-mode',focus);
    if(!item){main.innerHTML=heading('A good moment to stop.','Say a short story using three expressions you just reviewed.')+`<div class="empty"><h2>${s.ratings} recalls reviewed</h2><p>Your progress is saved. Keep your next session small and useful.</p>${button('new-session','Choose another session →','class="primary"')} ${button('daily','Practise 20 more')}</div>`;return;}
    const mode=item.kind==='pattern'&&s.mode==='context'?'pattern':s.mode;
    const prompt=mode==='ar-en'?esc(item.arabic):mode==='context'?esc(item.context.prompt):item.kind==='pattern'?template(item.english):esc(item.english);
    const label=mode==='ar-en'?'RECALL THE ENGLISH':mode==='context'?'COMPLETE THE SOURCE SENTENCE':item.kind==='pattern'?'MAKE THREE SENTENCES OF YOUR OWN':'RECALL THE MEANING';
    let answer='';
    if(s.revealed){
      if(mode==='ar-en')answer=`<p>${esc(item.english)}</p>`;
      else if(mode==='context')answer=`<p>${esc(item.context.answer)}</p>${!s.hideArabic?`<p class="arabic" lang="ar" dir="rtl">${esc(item.arabic)}</p>`:''}`;
      else answer=!s.hideArabic?`<p class="arabic" lang="ar" dir="rtl">${esc(item.arabic)}</p>`:'';
      if(!s.hideExamples)answer+=item.kind==='pattern'?item.variations.map(v=>`<div class="variation"><p>${esc(v.english)}</p>${!s.hideArabic?`<p class="arabic" lang="ar" dir="rtl">${esc(v.arabic)}</p>`:''}</div>`).join(''):item.examples[0]?`<p class="example">${esc(item.examples[0])}</p>`:'';
      if(item.usage?.length&&!s.hideExamples)answer+=`<p class="meta" dir="auto">${esc(item.usage[0])}</p>`;
    }
    main.innerHTML=`<div class="session-top"><a href="#home">← Library</a><span>${s.index+1} / ${s.ids.length} · ${mode==='context'?'Context recall':item.kind==='pattern'?'Pattern practice':mode==='ar-en'?'Arabic → English':'English → Arabic'}</span>${button('focus',focus?'Exit focus':'Focus mode','class="text-button"')}</div><div class="session-meter"><span style="width:${s.index/s.ids.length*100}%"></span></div><section class="study-card" aria-label="Recall card"><p class="eyebrow">${label}</p><h1 class="study-prompt ${mode==='ar-en'?'arabic':''}" ${mode==='ar-en'?'lang="ar" dir="rtl"':''}>${prompt}</h1>${s.revealed?`<div class="study-answer">${answer}</div><div class="ratings">${button('rate-again','Again')}${button('rate-hard','Hard')}${button('rate-know','Know it','class="primary"')}</div>`:button('reveal',mode==='ar-en'?'Show English':mode==='context'?'Reveal expression':item.kind==='pattern'?'Show variations':'Show meaning','class="primary reveal"')}<p class="meta" style="margin:18px 0 0">${s.revealed?'Again repeats this item later. Hard adds it to Difficult.':'Try saying your answer aloud before revealing.'}</p></section><div class="study-controls"><div>${button('previous','← Previous',s.index===0?'disabled':'')} ${button('next','Skip →')}</div><div>${button('shuffle','Shuffle')} ${button('save',Notebook.get(item.id).saved?'♥ Saved':'♡ Save',`data-id="${item.id}" aria-pressed="${Notebook.get(item.id).saved}"`)}</div><div class="check-group"><label><input id="hide-arabic" type="checkbox" ${s.hideArabic?'checked':''}> Hide Arabic</label><label><input id="hide-examples" type="checkbox" ${s.hideExamples?'checked':''}> Hide examples</label></div></div><div class="section-head">${button('new-session','Change session','class="text-button"')}<span class="meta">Space to reveal · 1 / 2 / 3 to review</span></div>`;
  }
  function progress(){
    function block(items,title){let counts={learned:0,learning:0,difficult:0};for(const item of items){let status=Notebook.get(item.id).status;if(status in counts)counts[status]++;}return `<section class="progress-block"><h2>${title}</h2><p class="total">${fmt(items.length)} in the collection</p><div class="numbers">${Object.entries(counts).map(([k,v])=>`<div><strong>${v}</strong><span>${k}</span></div>`).join('')}</div><progress value="${counts.learned}" max="${items.length}" aria-label="${title} learned"></progress></section>`;}
    const reviewed=all.filter(x=>Notebook.get(x.id).lastReviewed).sort((a,b)=>Notebook.get(b.id).lastReviewed-Notebook.get(a.id).lastReviewed).slice(0,5);
    const saved=all.filter(x=>Notebook.get(x.id).saved).sort((a,b)=>Notebook.get(b.id).savedAt-Notebook.get(a.id).savedAt).slice(0,5);
    const difficult=all.filter(x=>Notebook.get(x.id).status==='difficult').length;
    main.innerHTML=heading('Your progress','A practical record of what you know and what needs another try.')+`<div class="progress-grid">${block(data.vocabulary,'Vocabulary')}${block(data.patterns,'Patterns')}</div><div class="section-head"><h2>Needs another try</h2>${button('difficult','Review difficult items →','class="text-button"')}</div><p class="muted">${difficult?`${difficult} items in your difficult collection.`:'Mark an item Difficult to keep it ready for review.'}</p><div class="section-head"><h2>Recently studied</h2></div>${reviewed.length?`<div class="item-list">${reviewed.map(entry).join('')}</div>`:'<p class="muted">Your first study session will appear here.</p>'}<div class="section-head"><h2>Recently saved</h2><a href="#saved">All saved items ↗</a></div>${saved.length?`<div class="item-list">${saved.map(entry).join('')}</div>`:'<p class="muted">Save a useful expression with the heart button.</p>'}<div class="footer-note"><span>Progress stays in this browser. Export a backup to move it to another device.</span>${button('settings','Settings & backup','class="text-button"')}</div>`;
  }
  function settings(){
    $('#settings').innerHTML=`<div class="dialog-top"><h2 id="settings-title">Your notebook settings</h2>${button('close-settings','×','class="close" aria-label="Close settings"')}</div><div class="settings-row"><div><h3>Appearance</h3><p>Light or dark. Your choice is remembered.</p></div>${button('theme','Switch theme')}</div><div class="settings-row"><div><h3>Export progress</h3><p>Save bookmarks, learning states and your current session.</p></div>${button('export','Export JSON')}</div><div class="settings-row"><div><h3>Restore progress</h3><p>Import replaces your current notebook. Export a backup first.</p></div>${button('import','Import JSON')}<input type="file" id="import-file" accept=".json,application/json" hidden></div><div class="settings-row"><div><h3>Start fresh</h3><p>Clear learning progress and bookmarks on this device.</p></div>${button('reset','Reset progress','class="danger"')}</div><p class="source-note">${fmt(data.meta.sourceRows)} vocabulary rows consolidated into ${fmt(data.vocabulary.length)} entries. All 200 patterns and 600 translated variations preserved. Meanings and examples remain attached to their sources.</p><p class="source-note">Original material: <a href="sources/spoken-english-1040(1).md">Vocabulary with examples</a> · <a href="sources/spoken-english-vocabulary-arabic(1).md">Vocabulary</a> · <a href="sources/100-everyday-english-speaking-patterns(1).md">Patterns 1–100</a> · <a href="sources/100-more-english-speaking-patterns-101-200(1).md">Patterns 101–200</a></p>`;$('#settings').showModal();
  }
  function render(){
    document.body.classList.toggle('focus-mode',route==='study'&&focus);
    document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===route;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    if(route==='home')home();else if(route==='study')study();else if(route==='progress')progress();else if(route==='toolbox')toolbox();else collection();
  }
  function navigate(){const next=location.hash.slice(1)||'home';const valid=['home','vocabulary','patterns','study','saved','progress','toolbox','search'];route=valid.includes(next)||/^category\/c\d{2}$/.test(next)&&categoryMap.has(next.split('/')[1])?next:'home';category=route.startsWith('category/')?route.split('/')[1]:'';type='';status='';page=1;savedKind='';if(route!=='search'){query='';$('#search').value='';}$('#sidebar').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');render();window.scrollTo(0,0);main.focus({preventScroll:true});}
  function begin(options){if(!LibraryStudy.start(options)){toast('No items match this session. Try another collection or mode.');return;}if(location.hash==='#study')render();else location.hash='study';persistCheck();}
  async function copy(text){try{await navigator.clipboard.writeText(text);toast('English copied.');}catch(e){const el=document.createElement('textarea');el.value=text;el.style.position='fixed';el.style.opacity='0';(document.querySelector('dialog[open]')||document.body).append(el);el.select();const ok=document.execCommand('copy');el.remove();toast(ok?'English copied.':'Copy is unavailable in this browser.');}}
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action,id=b.dataset.id;
    if(action==='detail'){showDetails(id);return;}if(action==='close-detail'){details.close();return;}
    if(action==='save'){Notebook.save(id);if(details.open)showDetails(id);else render();persistCheck();return;}
    if(['learned','learning','difficult'].includes(action)&&id){Notebook.status(id,Notebook.get(id).status===action?'new':action);if(details.open)showDetails(id);else render();persistCheck();return;}
    if(action==='copy'){await copy(byId.get(id)?.english||'');return;}
    if(action==='category'){details.close();location.hash='category/'+b.dataset.category;return;}
    if(action==='practice-item'){const item=byId.get(id);details.close();Notebook.setSession({ids:[id],index:0,mode:item.kind==='pattern'?'pattern':'en-ar',originalCount:1,ratings:0,revealed:false});if(route==='study')render();else location.hash='study';return;}
    if(action==='settings'){settings();return;}if(action==='close-settings'){$('#settings').close();return;}
    if(action==='theme'){toggleTheme();return;}
    if(action==='export'){const blob=new Blob([Notebook.export()],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='spoken-english-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(action==='import'){$('#import-file').click();return;}
    if(action==='reset'){if(confirm('Reset all bookmarks, learning states and study progress on this device?')){Notebook.reset();$('#settings').close();render();toast('Your notebook is ready for a fresh start.');}return;}
    if(action==='daily'){begin({content:'both',mode:'en-ar',size:20,collection:'all',daily:true});return;}
    if(action==='random'){begin({content:'both',mode:'en-ar',size:10,collection:'all'});return;}
    if(action==='difficult'){begin({content:'both',mode:'en-ar',size:20,collection:'difficult'});return;}
    if(action==='patterns-study'){begin({content:'patterns',mode:'pattern',size:10,collection:'all'});return;}
    if(action==='resume'){location.hash='study';return;}
    if(action==='study-category'){begin({content:'both',mode:'en-ar',size:20,category,collection:'all'});return;}
    if(action==='study-filtered'){const ids=JSON.parse(main.dataset.filtered||'[]');if(!ids.length){toast('There are no matching items to study.');return;}const chosen=LibraryStudy.shuffle(ids).slice(0,20);Notebook.setSession({ids:chosen,index:0,mode:route==='patterns'?'pattern':'en-ar',originalCount:chosen.length,ratings:0,revealed:false});location.hash='study';return;}
    if(action==='view'){detailed=!detailed;render();return;}if(action==='clear-filters'){category=route.startsWith('category/')?route.split('/')[1]:'';type='';status='';query='';savedKind='';$('#search').value='';page=1;render();return;}
    if(action==='next-page'||action==='prev-page'){page+=action==='next-page'?1:-1;render();main.scrollIntoView();return;}
    if(action==='new-session'){Notebook.setSession(null);focus=false;render();return;}
    if(action==='start-study'){begin(studyOptions);return;}
    if(action==='focus'){focus=!focus;render();return;}
    if(action==='reveal'){LibraryStudy.reveal();render();return;}
    if(action==='next'){LibraryStudy.next();render();return;}if(action==='previous'){LibraryStudy.previous();render();return;}if(action==='shuffle'){LibraryStudy.shuffleSession();render();toast('Remaining items shuffled.');return;}
    if(action.startsWith('rate-')){LibraryStudy.rate(action.slice(5));render();persistCheck();}
  });
  document.addEventListener('change',async e=>{
    const id=e.target.id,value=e.target.value;
    if(id.startsWith('filter-')||id==='saved-kind'){if(id==='filter-category')category=value;if(id==='filter-type')type=value;if(id==='filter-status')status=value;if(id==='filter-sort')sort=value;if(id==='saved-kind')savedKind=value;page=1;render();}
    if(id.startsWith('study-')){const key=id.slice(6);studyOptions[key]=key==='size'?Number(value):value;const count=LibraryStudy.eligible(studyOptions).length;$('#eligible-count').textContent=`${count} items available${studyOptions.mode==='context'?' · Only exact source examples are included.':''}`;}
    if(id==='hide-arabic'||id==='hide-examples'){LibraryStudy.mutate(s=>s[id==='hide-arabic'?'hideArabic':'hideExamples']=e.target.checked);render();}
    if(id==='import-file'&&e.target.files[0]){try{const file=e.target.files[0];if(file.size>5*1024*1024)throw new Error('Choose a backup smaller than 5 MB.');const raw=JSON.parse(await file.text());Notebook.validate(raw);if(confirm('Replace your current progress with this backup?')){Notebook.import(raw);$('#settings').close();render();toast('Your notebook has been restored.');persistCheck();}}catch(err){toast(err.message||'Could not read this backup.');}e.target.value='';}
  });
  function toggleTheme(){const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('sel-theme',theme);}catch(e){toast('Theme changed for this visit.');}$('#theme').setAttribute('aria-label',`Switch to ${theme==='dark'?'light':'dark'} mode`);}
  $('#theme').addEventListener('click',toggleTheme);
  $('#menu').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open));});
  $('#search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{query=$('#search').value.trim();page=1;if(route!=='search'){route='search';category='';type='';status='';history.pushState(null,'','#search');}render();},120);});
  window.addEventListener('hashchange',navigate);window.addEventListener('popstate',navigate);
  document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable;if((e.key==='/'&&!typing||(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')&&!details.open&&!$('#settings').open){e.preventDefault();$('#search').focus();}if(e.key==='Escape'){$('#sidebar').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');if(focus){focus=false;render();}}if(!typing&&!details.open&&!$('#settings').open&&route==='study'&&LibraryStudy.current()){if(e.code==='Space'){e.preventDefault();LibraryStudy.reveal();render();}const ratings={'1':'again','2':'hard','3':'know'};if(ratings[e.key]&&Notebook.session().revealed){LibraryStudy.rate(ratings[e.key]);render();}}});
  [details,$('#settings')].forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));
  details.addEventListener('close',()=>{detailId=null;render();});
  if ('serviceWorker' in navigator && /^(https?:)$/.test(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(() => {});
  navigate();
  if(!Notebook.available())toast('Local storage is unavailable or your old record needs attention. Export progress to keep a backup.');
})();
