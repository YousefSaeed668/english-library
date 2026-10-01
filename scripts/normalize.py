"""Rebuild dependency-free browser data from all original Markdown sources."""
import re, json, hashlib, difflib
from pathlib import Path
from collections import Counter, defaultdict
ROOT=Path(__file__).resolve().parents[1]
NAMES=['Conversation starters','Clarifying & remembering','Opinions & priorities','Agreement & reactions','Reasons & connections','Uncertainty & expectations','Stories & experiences','Time & scheduling','Plans & decisions','Feelings & emotions','People & behaviour','Relationships & social life','Problems & solutions','Change & habits','Work & responsibilities','Learning & skills','Home & routines','Money & shopping','Food & eating out','Travel & transport','Health & energy','Digital life & entertainment','Descriptions & comparisons','Everyday actions','Requests & boundaries','Explaining ideas','Preferences & interests','Services & bookings']
CATS=[{'id':f'c{i+1:02}','name':n} for i,n in enumerate(NAMES)]
SIMPLE_MAP=[1,3,4,6,5,7,8,9,27,10,11,12,12,25,13,13,15,16,17,18,28,20,21,19,22,23]
def clean(s): return s.strip().replace('**','').replace('\\|','|')
def key(s): return re.sub(r'[.!?,;:]+$','',re.sub(r'\s+',' ',s.lower().replace('’',"'").replace('‘',"'"))).strip()
def uid(prefix,s): return prefix+hashlib.sha256(s.encode()).hexdigest()[:12]
def dump(name,data): (ROOT/'data'/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
files=sorted((ROOT/'sources').glob('*.md')); raw=[]; patterns=[]; counts={}; intro={}; prompts={}; skipped=[]
for f in files:
    text=f.read_text(encoding='utf-8'); intro[f.name]=text
    if f.name.startswith('spoken'):
        rich='1040' in f.name; category=None; original=''; n=0
        for ln,line in enumerate(text.splitlines(),1):
            m=re.match(r'## (?:Part )?(\d+)[. ]+[— ]*(.*)',line)
            if m:
                num=int(m[1]); category=f'c{(num if rich else SIMPLE_MAP[num-1]):02}'; original=line[3:]
            if rich and line.startswith('**Speak:'):
                prompts[category]=line.removeprefix('**Speak:**').strip()
            if not line.startswith('|'): continue
            cells=[clean(x) for x in re.split(r'(?<!\\)\|',line)[1:-1]]
            if rich:
                if not cells or not cells[0].isdigit(): continue
                assert len(cells)==6,(f.name,ln,cells)
                number,eng,ar,typ,ex,use=cells; number=int(number)
            else:
                if len(cells)!=2 or cells[0]=='English' or set(cells[0])<={'-',' '}:continue
                eng,ar=cells; typ='';ex='';use='';number=n+1
            assert category and eng and ar,(f.name,ln)
            raw.append({'english':eng,'arabic':ar,'type':typ,'example':ex,'usage':'' if use=='—' else use,'category':category,'source':f.name,'sourceNumber':number,'sourceCategory':original,'line':ln});n+=1
        counts[f.name]=n
    else:
        matches=list(re.finditer(r'^\*\*(\d+)\. (.+?)\*\*\s*$',text,re.M))
        for i,m in enumerate(matches):
            block=text[m.end():matches[i+1].start() if i+1<len(matches) else len(text)]
            block=block.split('\n---')[0]
            before=block.split('**Variations:**')[0].strip().splitlines()
            arabic=[];notes=[]
            for line in before:
                s=line.strip()
                if not s:continue
                if s.startswith('*'):notes.append(s.strip('*'))
                else:arabic.append(s)
            variations=[]
            for line in block.splitlines():
                if line.startswith('- '):
                    pair=line[2:].split(' — ',1);assert len(pair)==2,(f.name,m[1],line)
                    variations.append({'english':pair[0].strip(),'arabic':pair[1].strip()})
            assert len(variations)==3,(f.name,m[1],variations)
            patterns.append({'id':f'p{int(m[1]):03}','kind':'pattern','english':m[2],'arabic':' '.join(arabic),'usage':notes,'variations':variations,'source':f.name,'sourceNumber':int(m[1]),'categories':[]})
        counts[f.name]=len(matches)
# Manually inspected communication purposes. Frames with different grammar remain distinct.
groups={1:[*range(1,11),101,103,106,110,100],2:[*range(11,19),*range(111,121),109,128],3:[21,22,23,24,121,122,125,126,130],4:[*range(25,31),*range(91,97),102],5:[105,67,68,69,75,172,176,177,178,179,192],6:[19,20,73,136,137,138,139,140,155,180],7:[*range(53,67),*range(161,172),173,174,175,107,108],8:[42,48,70,*range(181,189)],9:[*range(71,81),104,157,189,190,97,98],10:[35,36,37,38,40,*range(131,136),123],12:[193,194,195,196,197,198,199,200],13:[43,44,45,47,151,152,153,154,156,158,159,160],14:[39,41,46,50,51,52,141,142,143,144,145,148,149,191],15:[49,146,147,150],25:[*range(81,91),79,80,96,99],27:[31,32,33,34,127],23:[113,124,129]}
for p in patterns:
    p['categories']=[f'c{c:02}' for c,nums in groups.items() if p['sourceNumber'] in nums]
    assert p['categories'],p
# Exact headword grouping retains source-attached senses, rather than blending translations.
buckets=defaultdict(list)
DISTINCT={'turn down':{'c12':'reject','c22':'volume'},'work out':{'c13':'solve','c21':'exercise'},'turn up':{'c24':'appear','c22':'volume'},'get out of':{'c24':'avoid-obligation','c20':'exit-vehicle'},'take off':{'c24':'remove-clothing','c20':'flight'}}
for row in raw:
    head=key(row['english']); sense=DISTINCT.get(head,{}).get(row['category'])
    buckets[head+('::'+sense if sense else '')].append(row)
vocab=[]; overlaps=[]
for k,rows in buckets.items():
    rows.sort(key=lambda x:not bool(x['example']))
    typ=next((r['type'] for r in rows if r['type']),None)
    # Only derive phrase/single-word shape for untyped entries; never guess a grammatical class.
    typ=typ or ('Expression' if len(k.split())>1 else 'Unclassified')
    item={'id':uid('v',k),'kind':'vocabulary','english':rows[0]['english'],'arabic':rows[0]['arabic'],'types':list(dict.fromkeys(r['type'] for r in rows if r['type'])) or [typ],'type':typ,'categories':list(dict.fromkeys(r['category'] for r in rows)),'translations':list(dict.fromkeys(r['arabic'] for r in rows)),'examples':list(dict.fromkeys(r['example'] for r in rows if r['example'])),'usage':list(dict.fromkeys(r['usage'] for r in rows if r['usage'])),'senses':rows}
    # Context recall is an exact, bounded occurrence, with punctuation/apostrophe normalization only.
    target=key(item['english'])
    if not re.search(r'\b(?:someone|something)\b|…|/',target):
        rx=re.compile(r'(?<!\w)'+re.escape(target)+r'(?!\w)',re.I)
        for ex in item['examples']:
            norm=ex.replace('’',"'").replace('‘',"'")
            if len(rx.findall(norm))==1:
                hit=rx.search(norm);item['context']={'prompt':ex[:hit.start()]+'______'+ex[hit.end():],'answer':ex[hit.start():hit.end()],'example':ex};break
    vocab.append(item)
    if len(rows)>1:overlaps.append({'english':item['english'],'rows':len(rows),'translations':item['translations'],'categories':item['categories']})
# Conservative lexical links: full multiword expression present in a frame/variation.
for p in patterns:
    corpus=' '.join([p['english']]+[v['english'] for v in p['variations']]);norm=key(corpus)
    p['related']=[]
    for v in vocab:
        term=key(v['english'])
        if (key(v['english']) not in DISTINCT or set(v['categories'])&set(p['categories'])) and len(term.split())>=2 and re.search(r'(?<!\w)'+re.escape(term)+r'(?!\w)',norm): p['related'].append(v['id'])
for v in vocab: v['related']=[p['id'] for p in patterns if v['id'] in p['related']]
# Detect near matches, but do not merge shorter phrases or different grammatical frames.
near=[]
for i,p in enumerate(patterns):
    for q in patterns[i+1:]:
        ratio=difflib.SequenceMatcher(None,key(p['english']),key(q['english'])).ratio()
        if ratio>=.70:near.append({'first':p['id'],'second':q['id'],'similarity':round(ratio,3),'patterns':[p['english'],q['english']]})
vocab_near=[]
for i,v in enumerate(vocab):
    a=key(v['english'])
    for w in vocab[i+1:]:
        b=key(w['english'])
        if a==b or abs(len(a)-len(b))>4 or a[:2]!=b[:2]:continue
        matcher=difflib.SequenceMatcher(None,a,b)
        if matcher.quick_ratio()>=.9 and matcher.ratio()>=.9:
            vocab_near.append({'first':v['id'],'second':w['id'],'expressions':[v['english'],w['english']],'similarity':round(matcher.ratio(),3),'decision':'Retain distinct source expressions; do not infer identical meanings from spelling.'})
for c in CATS:
    c['prompt']=prompts.get(c['id'],'Choose three expressions. Make a true sentence with each, then speak for one minute without reading.')
    c['vocabularyCount']=sum(c['id'] in x['categories'] for x in vocab);c['patternCount']=sum(c['id'] in x['categories'] for x in patterns)
assert counts['spoken-english-1040(1).md']==1040
assert counts['spoken-english-vocabulary-arabic(1).md']==1040
assert len(patterns)==200 and sum(len(p['variations']) for p in patterns)==600
assert len({x['id'] for x in vocab+patterns})==len(vocab)+200
meta={'sourceCounts':counts,'vocabularyCount':len(vocab),'patternCount':len(patterns),'variationCount':600,'sourceRows':len(raw),'consolidatedRows':len(raw)-len(vocab),'contextCount':sum('context' in v for v in vocab),'overlappingHeadwords':len(overlaps)}
for name,value in [('vocabulary.json',vocab),('patterns.json',patterns),('categories.json',CATS),('audit.json',{'summary':meta,'overlaps':overlaps,'nearPatterns':near,'nearVocabulary':vocab_near})]:dump(name,value)
# Classic scripts make direct file opening work, with no fetch or module CORS dependency.
(ROOT/'js/data.js').write_text('/* Generated by scripts/normalize.py. Edit source Markdown, then regenerate. */\nwindow.ENGLISH_LIBRARY = '+json.dumps({'vocabulary':vocab,'patterns':patterns,'categories':CATS,'meta':meta},ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps(meta,indent=2));print('Near-pattern candidates:',len(near));print('Near-vocabulary candidates:',len(vocab_near));print('All source rows, 600 variations and source-attached meanings retained.')
