/* Device-local notebook. A single versioned record is exportable and restorable. */
window.Notebook = (() => {
  const KEY = 'spoken-english-notebook-v1';
  const records = new Map([...ENGLISH_LIBRARY.vocabulary, ...ENGLISH_LIBRARY.patterns].map(x => [x.id,x]));
  const ids = new Set(records.keys());
  const statuses = ['new', 'learning', 'learned', 'difficult'];
  const fresh = () => ({version: 1, items: {}, session: null, lastOpened: null});
  const stamp = x => Number.isFinite(x) && x >= 0 ? x : null;
  function validate(raw) {
    if (!raw || raw.version !== 1 || !raw.items || typeof raw.items !== 'object' || Array.isArray(raw.items)) throw new Error('Choose a version 1 Spoken English Library backup.');
    const out = fresh();
    for (const [id, state] of Object.entries(raw.items)) {
      if (!ids.has(id)) continue;
      if (!state || !statuses.includes(state.status) || typeof state.saved !== 'boolean' || !Number.isInteger(state.reviews) || state.reviews < 0) throw new Error('This backup has invalid learning records.');
      out.items[id] = {status: state.status, saved: state.saved, reviews: state.reviews, lastReviewed: stamp(state.lastReviewed), savedAt: stamp(state.savedAt)};
    }
    if (raw.session) {
      const s = raw.session;
      if (!Array.isArray(s.ids) || s.ids.length > 5000 || !s.ids.every(id => ids.has(id)) || !Number.isInteger(s.index) || s.index < 0 || s.index > s.ids.length || !['en-ar','ar-en','context','pattern'].includes(s.mode)) throw new Error('This backup has an invalid study session.');
      if ((s.mode === 'context' && !s.ids.every(id => records.get(id).context)) || (s.mode === 'pattern' && !s.ids.every(id => records.get(id).kind === 'pattern')) || (s.ratings !== undefined && (!Number.isInteger(s.ratings) || s.ratings < 0))) throw new Error('This backup has incompatible study cards.');
      out.session = {ids:s.ids.slice(), index:s.index, mode:s.mode, revealed: !!s.revealed, originalCount:Math.max(1, Math.min(30, Number(s.originalCount)||20)), ratings:Number(s.ratings)||0, hideArabic:!!s.hideArabic, hideExamples:!!s.hideExamples};
    }
    if (ids.has(raw.lastOpened)) out.lastOpened=raw.lastOpened;
    return out;
  }
  let state=fresh(), available=true;
  try { const stored=localStorage.getItem(KEY); if(stored) state=validate(JSON.parse(stored)); } catch(e) {available=false;}
  function persist() {
    try {localStorage.setItem(KEY, JSON.stringify(state)); available=true;return true;} catch(e) {available=false;return false;}
  }
  const get=id => state.items[id] || {status:'new',saved:false,reviews:0,lastReviewed:null,savedAt:null};
  function update(id, patch) {if(!ids.has(id))return;state.items[id]={...get(id),...patch};persist();}
  return {get,update,validate,persist,all:()=>state.items,session:()=>state.session,last:()=>state.lastOpened,available:()=>available,
    save(id){const current=get(id);update(id,{saved:!current.saved,savedAt:!current.saved?Date.now():null});},
    status(id,status){if(statuses.includes(status))update(id,{status});},
    review(id,rating){const current=get(id);update(id,{status:rating==='know'?'learned':rating==='hard'?'difficult':'learning',reviews:current.reviews+1,lastReviewed:Date.now()});},
    setSession(s){state.session=s;persist();},open(id){state.lastOpened=id;persist();},
    export:()=>JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2),
    import(raw){const next=validate(raw);state=next;persist();},reset(){state=fresh();persist();}
  };
})();
