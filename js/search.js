window.LibrarySearch = (() => {
  const normalize = value => String(value).toLowerCase().replace(/[’‘]/g,"'").normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي');
  const rows=[...ENGLISH_LIBRARY.vocabulary,...ENGLISH_LIBRARY.patterns];
  const index=new Map(rows.map(item=>[item.id, normalize(JSON.stringify(item))]));
  const escape = text => String(text ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function matches(item,query){return normalize(query).trim().split(/\s+/).filter(Boolean).every(word=>index.get(item.id).includes(word));}
  function highlight(text,query){
    if(!query.trim())return escape(text);
    // Use offset mapping so accent-insensitive Arabic matches keep the original glyphs.
    let normalized='',offsets=[];for(let i=0;i<text.length;i++){const n=normalize(text[i]);normalized+=n;for(let k=0;k<n.length;k++)offsets.push(i);}
    const ranges=[];for(const term of normalize(query).trim().split(/\s+/).filter(Boolean)){let at=0;while((at=normalized.indexOf(term,at))>=0){ranges.push([offsets[at],offsets[at+term.length-1]+1]);at+=term.length;}}
    ranges.sort((a,b)=>a[0]-b[0]);let end=0,result='';for(const [a,b]of ranges){if(a<end)continue;result+=escape(text.slice(end,a))+'<mark>'+escape(text.slice(a,b))+'</mark>';end=b;}return result+escape(text.slice(end));
  }
  return {normalize,matches,highlight,escape};
})();
