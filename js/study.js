window.LibraryStudy = (() => {
  const all=[...ENGLISH_LIBRARY.vocabulary,...ENGLISH_LIBRARY.patterns];
  const byId=new Map(all.map(x=>[x.id,x]));
  function shuffle(list){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function eligible(options){return all.filter(x=>(options.content==='both'||(options.content==='patterns'?x.kind==='pattern':x.kind==='vocabulary'))&&(!options.category||x.categories.includes(options.category))&&(!options.collection||options.collection==='all'||(options.collection==='saved'?Notebook.get(x.id).saved:Notebook.get(x.id).status===options.collection))&&(options.mode!=='context'||!!x.context)&&(options.mode!=='pattern'||x.kind==='pattern'));}
  function start(options){
    let pool=eligible(options);if(!pool.length)return false;
    if(options.daily){const difficult=shuffle(pool.filter(x=>Notebook.get(x.id).status==='difficult')).slice(0,6);const unseen=shuffle(pool.filter(x=>Notebook.get(x.id).status==='new')).slice(0,10);const known=shuffle(pool.filter(x=>Notebook.get(x.id).status==='learned')).slice(0,4);const picked=[...difficult,...unseen,...known];const used=new Set(picked.map(x=>x.id));pool=[...shuffle(picked),...shuffle(pool.filter(x=>!used.has(x.id)))];}else pool=shuffle(pool);
    const chosen=pool.slice(0,options.size||20);Notebook.setSession({ids:chosen.map(x=>x.id),index:0,mode:options.mode||'en-ar',originalCount:chosen.length,revealed:false,ratings:0,hideArabic:false,hideExamples:false});return true;
  }
  function current(){const s=Notebook.session();return s?byId.get(s.ids[s.index]):null;}
  function mutate(fn){const s=Notebook.session();if(!s)return;fn(s);Notebook.setSession(s);}
  function rate(rating){const item=current();if(!item)return;Notebook.review(item.id,rating);mutate(s=>{if(rating==='again'&&s.ids.length<5000)s.ids.push(item.id);s.ratings++;s.index++;s.revealed=false;});}
  return {start,current,eligible,shuffle,mutate,rate,next(){mutate(s=>{s.index=Math.min(s.index+1,s.ids.length);s.revealed=false;});},previous(){mutate(s=>{s.index=Math.max(0,s.index-1);s.revealed=false;});},reveal(){mutate(s=>s.revealed=true);},shuffleSession(){mutate(s=>{s.ids=[...s.ids.slice(0,s.index),...shuffle(s.ids.slice(s.index))];s.revealed=false;});}};
})();
