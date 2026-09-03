// Project B59: The Vault : core app (catalog, detail, extropy reader, crypto wars, routing)
(function(){
'use strict';
var R = window.B59_RECORDS || [];
var B59_REDIRECT = {}; // old flat/provisional id -> BDC id (vault-app/id-redirect.json, loaded at boot)
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };

// Format labels only, no per-type colour coding. The B59 Decimal class (below)
// is the vault's real taxonomy now; format is a plain mono label everywhere.
var TYPES = {
  writing:{label:'Writing'},
  website:{label:'Website'},
  video:{label:'Video'},
  audio:{label:'Audio'},
  image:{label:'Image'},
  code:{label:'Code'}
};

// ── B59 Decimal Classification ──────────────────────────────
var CLASSES = [
  {id:'0', name:'Reference & archive meta'},
  {id:'1', name:'Cryptography'},
  {id:'2', name:'Digital cash & payments'},
  {id:'3', name:'Cypherpunks & privacy'},
  {id:'4', name:'Consensus & distributed systems'},
  {id:'5', name:'Smart contracts & digital law'},
  {id:'6', name:'Economics & monetary theory'},
  {id:'7', name:'Extropians & transhumanism'},
  {id:'8', name:'Artificial intelligence'},
  {id:'9', name:'Virtual worlds & games'}
];
function classOf(rec){
  if(rec.id==='B59-000') return null; // the keystone, no class
  var m = /^B59-(\d)/.exec(rec.id);
  return m ? m[1] : null;
}
function classNameOf(rec){
  var c = classOf(rec);
  return c ? (CLASSES.filter(function(x){return x.id===c;})[0]||{}).name : (rec.id==='B59-000' ? 'Keystone' : '');
}

// Curated cross-cuts. Tag lists are kept tight so the sidebar counts stay honest
// against the full 240-record corpus; the B59 Decimal class (the id prefix) is the
// primary taxonomy.
var COLLECTIONS = [
  {id:'hal',      name:'Hal Finney Papers',        tags:['hal-finney']},
  {id:'szabo',    name:'Szabo & Smart Contracts',  tags:['nick-szabo']},
  {id:'lists',    name:'Lists & Remailers',        tags:['remailers','mixmaster','mailing-list']},
  {id:'cash',     name:'Digital Cash',             tags:['digital-cash','blind-signatures','b-money','bit-gold','ecash','digicash']},
  {id:'wars',     name:'The Crypto Wars',          tags:['crypto-wars','export-controls','clipper-chip','des','bernstein']},
  {id:'extropy',  name:'Extropians',               tags:['extropians','transhumanism','max-more','cryonics']},
  {id:'markets',  name:'Digital Markets',          tags:['phil-salin','amix','information-markets','agoric']},
  {id:'ai',       name:'Artificial Intelligence',  tags:['neural-networks','deep-learning','reinforcement-learning','ai-safety','machine-learning']},
  {id:'gaming',   name:'Virtual Worlds & Games',   tags:['video-games','game-design','virtual-worlds','habitat','mud','intellivision','atari']},
  {id:'research', name:'Research & Reference',     tags:['research-compilation','external-reference']}
];

function collFor(rec){
  var out = [];
  COLLECTIONS.forEach(function(c){
    if((rec.tags||[]).some(function(t){ return c.tags.indexOf(t)>=0; })) out.push(c.id);
  });
  return out;
}
R.forEach(function(r){ r._colls = collFor(r); });

var state = { q:'', type:null, coll:null, cls:null, view:'archive', sort:'date-desc', yrFrom:null, yrTo:null };

// ── Routing ────────────────────────────────────────────────
var VIEWS = ['archive','timeline','extropy','cryptowars','people','boards','feed','network','reader','thread'];
function route(){
  var h = (location.hash||'').replace(/^#\/?/,'');
  var parts = h.split('/');
  // Overlays (record detail, Channel 59, donate) float on top of whatever
  // view is showing and were previously only closed by their own × button,
  // Escape, or a backdrop click, never by navigation. That left a stale
  // overlay stuck on screen after following any link out of it, e.g.
  // "Read in the vault": the destination rendered correctly underneath,
  // just invisibly, behind the still-open record card. Close everything
  // not tied to the route we're headed to before acting on it.
  closeCh59();
  var donateOv = document.getElementById('bz-donate-overlay');
  if(donateOv) donateOv.classList.remove('open');
  if(parts[0]!=='record') closeRecord();
  if(parts[0]==='record' && parts[1]){ show('archive'); openRecord(B59_REDIRECT[parts[1]] || parts[1]); return; }
  if(parts[0]==='people' && parts[1] && window.B59People){ show('people'); window.B59People.openPerson(parts[1]); return; }
  if(parts[0]==='read' && parts[1] && window.B59Reader){ show('reader'); window.B59Reader.open(B59_REDIRECT[parts[1]] || parts[1]); return; }
  if(parts[0]==='thread' && parts[1] && window.B59Thread){ show('thread'); window.B59Thread.open(parts[1]); return; }
  var v = VIEWS.indexOf(parts[0])>=0 ? parts[0] : 'archive';
  show(v);
}
function show(v){
  state.view = v;
  VIEWS.forEach(function(x){
    var el = document.getElementById('view-'+x);
    if(el) el.style.display = (x===v)?'':'none';
    var nav = document.querySelector('[data-nav="'+x+'"]');
    if(nav) nav.classList.toggle('act', x===v);
  });
  if(v==='boards' && window.B59Boards) window.B59Boards.ensure();
  if(v==='feed' && window.B59Feed) window.B59Feed.init();
  if(v==='people' && window.B59People) window.B59People.ensure();
  if(v==='timeline' && window.B59Timeline){ window.B59Timeline.init(); } else if(window.B59Timeline){ window.B59Timeline.stop(); }
  var nhb = document.getElementById('new-here-banner');
  if(nhb) nhb.style.display = (v==='archive') ? 'none' : '';
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', route);

// ── Facets ─────────────────────────────────────────────────
function counts(){
  var t={}, c={}, k={};
  R.forEach(function(r){
    t[r.type]=(t[r.type]||0)+1;
    r._colls.forEach(function(id){ c[id]=(c[id]||0)+1; });
    var cl = classOf(r); if(cl) k[cl]=(k[cl]||0)+1;
  });
  return {types:t, colls:c, classes:k};
}
function renderFacets(){
  var n = counts();
  var el = document.getElementById('facets');
  var html = '<div class="facet"><h3>Class <span style="text-transform:none;letter-spacing:0;color:#5a6172">B59 Decimal</span></h3><ul>';
  html += '<li data-cls="" class="'+(!state.cls?'act':'')+'">All records <span class="n">'+R.length+'</span></li>';
  CLASSES.forEach(function(c){
    if(!n.classes[c.id]) return;
    html += '<li data-cls="'+c.id+'" class="'+(state.cls===c.id?'act':'')+'"><span><span class="mono" style="color:var(--lime)">'+c.id+'</span>&nbsp; '+esc(c.name)+'</span><span class="n">'+(n.classes[c.id]||0)+'</span></li>';
  });
  html += '</ul></div>';
  html += '<div class="facet"><h3>Collections</h3><ul>';
  html += '<li data-coll="" class="'+(!state.coll?'act':'')+'">All records <span class="n">'+R.length+'</span></li>';
  COLLECTIONS.forEach(function(c){
    html += '<li data-coll="'+c.id+'" class="'+(state.coll===c.id?'act':'')+'">'+esc(c.name)+' <span class="n">'+(n.colls[c.id]||0)+'</span></li>';
  });
  html += '</ul></div><div class="facet"><h3>Format</h3><ul>';
  html += '<li data-type="" class="'+(!state.type?'act':'')+'">All formats <span class="n">'+R.length+'</span></li>';
  Object.keys(TYPES).forEach(function(k2){
    if(!n.types[k2]) return;
    html += '<li data-type="'+k2+'" class="'+(state.type===k2?'act':'')+'">'+TYPES[k2].label+' <span class="n">'+n.types[k2]+'</span></li>';
  });
  html += '</ul></div>';
  html += '<div class="facet"><h3>Availability</h3><ul>'+
    '<li data-off="1" class="'+(state.off?'act':'')+'">Hosted copy in vault <span class="n">'+R.filter(function(r){return r.local;}).length+'</span></li></ul></div>';
  el.innerHTML = html;
  el.querySelectorAll('[data-cls]').forEach(function(li){
    li.addEventListener('click', function(){ state.cls = li.getAttribute('data-cls')||null; renderFacets(); renderResults(); });
  });
  el.querySelectorAll('[data-coll]').forEach(function(li){
    li.addEventListener('click', function(){ state.coll = li.getAttribute('data-coll')||null; renderFacets(); renderResults(); });
  });
  el.querySelectorAll('[data-type]').forEach(function(li){
    li.addEventListener('click', function(){ state.type = li.getAttribute('data-type')||null; renderFacets(); renderResults(); });
  });
  el.querySelectorAll('[data-off]').forEach(function(li){
    li.addEventListener('click', function(){ state.off = !state.off; renderFacets(); renderResults(); });
  });
}

// ── Results ────────────────────────────────────────────────
// Query operators: author: tag: year: (single or a-b range) class: has:offline.
// Anything left over after pulling operators out is a free-text substring match
// against id/title/author/description/tags/hash.
function parseQuery(raw){
  var out = {free:[], author:null, tag:null, year:null, cls:null, has:null, inText:false};
  (raw||'').split(/\s+/).filter(Boolean).forEach(function(tok){
    var m = /^(author|tag|year|class|has|in):(.+)$/i.exec(tok);
    if(!m){ out.free.push(tok); return; }
    var k = m[1].toLowerCase(), v = m[2].toLowerCase();
    if(k==='author') out.author = v;
    else if(k==='tag') out.tag = v;
    else if(k==='class') out.cls = v;
    else if(k==='has') out.has = v;
    else if(k==='in'){ if(v==='text') out.inText = true; }
    else if(k==='year'){
      var r = /^(\d{3,4})-(\d{3,4})$/.exec(v);
      out.year = r ? [+r[1], +r[2]] : [+v, +v];
    }
  });
  out.free = out.free.join(' ');
  return out;
}
// ── Full-text index (vault-app/fulltext-index.json) ─────────
// Record id -> array of body paragraphs, built offline by tools/build-
// fulltext-index.js from each record's primary HTML file. Fetched once,
// lazily, the first time a search is attempted; cached in FT thereafter.
// A static JSON file, so this stays true to the offline-first, no-build-
// -step client. The index just ships as one more asset in the repo.
var FT = null, FT_PROMISE = null;
function loadFullText(){
  if(FT_PROMISE) return FT_PROMISE;
  FT_PROMISE = fetch('vault-app/fulltext-index.json').then(function(r){ return r.ok?r.json():{}; })
    .then(function(j){ FT = j; return FT; }).catch(function(){ FT = {}; return FT; });
  return FT_PROMISE;
}
function fullTextHits(term, limit){
  if(!FT || !term) return [];
  term = term.toLowerCase();
  var out = [];
  for(var id in FT){
    var paras = FT[id];
    for(var i=0;i<paras.length;i++){
      var idx = paras[i].toLowerCase().indexOf(term);
      if(idx>=0){ out.push({id:id, para:i, text:paras[i], at:idx}); break; }
    }
    if(limit && out.length>=limit) break;
  }
  return out;
}
function matchesQuery(r, pq){
  if(pq.author && !(r.author||'').toLowerCase().includes(pq.author)) return false;
  if(pq.tag && (r.tags||[]).indexOf(pq.tag)<0 && !(r.tags||[]).some(function(t){return t.indexOf(pq.tag)>=0;})) return false;
  if(pq.cls && classOf(r)!==pq.cls) return false;
  if(pq.has==='offline' && !r.local) return false;
  if(pq.year){
    var y = +((r.date||'').slice(0,4));
    if(!y || y<pq.year[0] || y>pq.year[1]) return false;
  }
  if(pq.free){
    if(pq.inText){
      if(!FT) return false; // index still loading; loadFullText() triggers a re-render when it lands
      var paras = FT[r.id];
      if(!paras || !paras.some(function(p){ return p.toLowerCase().indexOf(pq.free.toLowerCase())>=0; })) return false;
    } else {
      var hay = (r.id+' '+r.title+' '+(r.author||'')+' '+(r.description||'')+' '+(r.tags||[]).join(' ')+' '+(r.hash||'')).toLowerCase();
      if(hay.indexOf(pq.free.toLowerCase())<0) return false;
    }
  }
  return true;
}
function filtered(){
  var pq = parseQuery(state.q);
  var list = R.filter(function(r){
    if(state.type && r.type!==state.type) return false;
    if(state.coll && r._colls.indexOf(state.coll)<0) return false;
    if(state.cls && classOf(r)!==state.cls) return false;
    if(state.off && !r.local) return false;
    if(state.yrFrom || state.yrTo){
      var y = +((r.date||'').slice(0,4));
      if(!y) return false;
      if(state.yrFrom!=null && y<state.yrFrom) return false;
      if(state.yrTo!=null && y>state.yrTo) return false;
    }
    return matchesQuery(r, pq);
  });
  if(state.sort==='id') list.sort(function(a,b){ return a.id<b.id?-1:a.id>b.id?1:0; });
  else{
    list.sort(function(a,b){ return (a.date||'').localeCompare(b.date||''); });
    if(state.sort==='date-desc') list.reverse();
  }
  return list;
}
function renderResults(){
  var list = filtered();
  document.getElementById('result-count').textContent = list.length + ' of ' + R.length + ' records';
  var el = document.getElementById('results');
  el.innerHTML = list.map(function(r){
    var year = (r.date||'').slice(0,4);
    var cls = classOf(r);
    return '<article class="rec" data-id="'+r.id+'">'+
      '<div class="call">'+r.id+(cls?' <span class="cls-badge">'+cls+'</span>':'')+'<span class="era">'+esc(year)+' · '+esc((TYPES[r.type]||{}).label||r.type)+'</span></div>'+
      '<div><div class="title">'+esc(r.title)+'</div>'+
      '<p class="desc">'+esc((r.description||'').slice(0,220))+((r.description||'').length>220?'…':'')+'</p>'+
      '<div class="meta">'+
        '<span><b>'+esc(r.author||'Unknown')+'</b></span>'+
        (r.hash?'<span>hash <b>'+esc(r.hash.slice(0,4))+'…'+esc(r.hash.slice(-4))+'</b></span>':'')+
        (r.local?'<span class="off-badge">● hosted copy</span>':(r.external_url?'<span class="pend-badge">↗ linked, copyrighted</span>':'<span class="pend-badge">○ source pending</span>'))+
      '</div></div></article>';
  }).join('') || '<div class="empty">Nothing matches. Clear a filter or try the Archivist.</div>';
  el.querySelectorAll('.rec').forEach(function(a){
    a.addEventListener('click', function(){ openRecord(a.getAttribute('data-id')); });
  });
}

// ── Record detail ──────────────────────────────────────────
function plainCitation(r){
  if(r.citation) return r.citation;
  var bits = [r.author||'Unknown']; if(r.date) bits.push('('+r.date.slice(0,4)+')');
  bits.push('"'+r.title+'."'); bits.push(r.id+'.'); bits.push('Project B59 Archive.');
  if(r.hash) bits.push('SHA-256 '+r.hash.slice(0,8)+'…'+r.hash.slice(-8)+'.');
  return bits.join(' ');
}
function seeAlso(r){
  if(r.see_also && r.see_also.length){
    return r.see_also.map(function(id){ id = B59_REDIRECT[id]||id; return R.filter(function(x){return x.id===id;})[0]; }).filter(Boolean);
  }
  if(!r.tags || !r.tags.length) return [];
  var scored = R.filter(function(x){ return x.id!==r.id; }).map(function(x){
    var n = (x.tags||[]).filter(function(t){ return r.tags.indexOf(t)>=0; }).length;
    return {x:x, n:n};
  }).filter(function(s){ return s.n>0; }).sort(function(a,b){ return b.n-a.n; });
  return scored.slice(0,3).map(function(s){ return s.x; });
}
function openRecord(id){
  var r = R.filter(function(x){ return x.id===id; })[0];
  if(!r) return;
  var ov = document.getElementById('detail-overlay');
  var gh = 'https://github.com/ProjectB59/projectb59/tree/main/' + (r.content_path || ('content/'+r.id));
  var files = (r.files||[]).map(function(f){
    return '<li>'+esc(f.path)+' <span class="n">'+(f.size>1048576?(f.size/1048576).toFixed(1)+' MB':Math.round(f.size/1024)+' KB')+'</span></li>';
  }).join('');
  var cls = classOf(r), clsName = classNameOf(r);
  var related = seeAlso(r);
  var entryFile = (r.files||[]).filter(function(f){ return f.entry; })[0] || (r.files||[])[0];
  var raw = (r.files||[]).filter(function(f){ return !f.entry; })[0] || (r.files||[])[0];
  var readable = !!(entryFile && /\.(html?|mht)$/i.test(entryFile.path));
  ov.innerHTML = '<div class="detail" role="dialog" aria-label="'+esc(r.title)+'">'+
    '<button class="d-close" aria-label="Close">×</button>'+
    '<div class="d-call">'+r.id+' · '+esc((TYPES[r.type]||{}).label||r.type)+
      (cls?' <span class="cls-badge">'+cls+' · '+esc(clsName)+'</span>':(r.id==='B59-000'?' <span class="cls-badge">keystone</span>':''))+
    '</div>'+
    '<h2 class="d-title">'+esc(r.title)+'</h2>'+
    '<div class="d-byline">'+esc(r.author||'Unknown')+' · '+esc(r.date||'')+'</div>'+
    (r.excerpt?'<blockquote class="d-quote">'+esc(r.excerpt)+'</blockquote>':'')+
    '<p class="d-desc">'+esc(r.description||'')+'</p>'+
    '<dl class="d-meta">'+
      (r.citation?'<dt>Citation</dt><dd>'+esc(r.citation)+'</dd>':'')+
      (r.provenance?'<dt>Provenance</dt><dd>'+esc(r.provenance)+'</dd>':'')+
      (r.hash?'<dt>SHA-256</dt><dd class="d-hash">'+esc(r.hash)+'</dd>':'')+
      (r.external_url?'<dt>Source</dt><dd><a href="'+esc(r.external_url)+'" target="_blank" rel="noopener" style="color:var(--cyan)">'+esc(r.external_url)+' ↗</a></dd>':'')+
      (files?'<dt>Files</dt><dd><ul class="d-files">'+files+'</ul></dd>':'')+
    '</dl>'+
    '<div class="d-tags">'+(r.tags||[]).map(function(t){ return '<span>'+esc(t)+'</span>'; }).join('')+'</div>'+
    '<div class="d-actions">'+
      (readable?'<a class="btn-lime" href="#/read/'+r.id+'">Read in the vault</a>':'')+
      (r.local?r.local.map(function(p,i){ return '<a class="'+(readable?'btn-ghost':'btn-lime')+'" href="'+encodeURI(p)+'" target="_blank" rel="noopener">'+(readable?'Open original':'Read document')+(r.local.length>1?' '+(i+1):'')+' ↗</a>'; }).join(''):'')+
      (r.local?'<a class="btn-ghost" href="'+gh+'" target="_blank" rel="noopener">Source on GitHub ↗</a>':'')+
      '<button type="button" id="d-cite-btn">Cite</button>'+
      '<button type="button" id="d-link-btn">Copy link</button>'+
      '<span class="d-sia">Sia upload: queued</span>'+
    '</div>'+
    '<div class="d-cite" id="d-cite" style="display:none">'+
      '<div class="ch"><b id="d-cite-copy">Copy citation</b></div>'+
      '<p id="d-cite-text">'+esc(plainCitation(r))+'</p>'+
    '</div>'+
    (raw&&r.hash?'<details class="d-verify"><summary>Verify this file yourself</summary><div class="body">'+
      'Download <span class="mono">'+esc(raw.path||raw)+'</span>, then run:'+
      '<code>sha256sum '+esc(raw.path||raw)+'</code>'+
      'A result equal to the SHA-256 above means the file is byte-for-byte what the archive holds.'+
    '</div></details>':'')+
    (related.length?'<div class="d-seealso"><span class="lbl">See also</span>'+
      related.map(function(x){ return '<a href="#/record/'+x.id+'"><b>'+x.id+'</b>: '+esc(x.title)+'</a>'; }).join('')+
    '</div>':'')+
  '</div>';
  ov.classList.add('open');
  ov.querySelector('.d-close').addEventListener('click', closeRecord);
  var citeBtn = document.getElementById('d-cite-btn'), citeBox = document.getElementById('d-cite');
  if(citeBtn) citeBtn.addEventListener('click', function(){ citeBox.style.display = citeBox.style.display==='none'?'block':'none'; });
  var citeCopy = document.getElementById('d-cite-copy');
  if(citeCopy) citeCopy.addEventListener('click', function(){
    var t = document.getElementById('d-cite-text').textContent;
    (navigator.clipboard&&navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ citeCopy.textContent='Copied'; setTimeout(function(){ citeCopy.textContent='Copy citation'; },1400); }).catch(function(){});
  });
  var linkBtn = document.getElementById('d-link-btn');
  if(linkBtn) linkBtn.addEventListener('click', function(){
    var url = location.origin + location.pathname + '#/record/' + r.id;
    (navigator.clipboard&&navigator.clipboard.writeText ? navigator.clipboard.writeText(url) : Promise.reject()).then(function(){ linkBtn.textContent='Copied'; setTimeout(function(){ linkBtn.textContent='Copy link'; },1400); }).catch(function(){});
  });
}
function closeRecord(){ document.getElementById('detail-overlay').classList.remove('open'); }
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeRecord(); });
document.getElementById('detail-overlay').addEventListener('click', function(e){ if(e.target===this) closeRecord(); });

// ── Extropian Vault : real archive browser ─────────────────
var EX = window.B59_EXTROPY || {threads:[],authors:{}};
var EXI = window.B59_EXTROPY_INDEX || {base:'https://lists.extropy.org/pipermail/extropy-chat/', months:[], landmarks:[]};
var exState = { tab:'landmarks', sel:null, selMonth:null, filter:false, monthQ:'' };

function renderExtropy(){
  // Open with the first landmark selected so the reading pane is never blank.
  if(exState.sel==null && !exState.selMonth && (EXI.landmarks||[]).length) exState.sel = 0;
  // If a full offline mirror (vault_data/index.json from the scraper) is present,
  // note it: the boards reader and landmark previews upgrade to real bodies.
  fetch('vault_data/index.json').then(function(r){ return r.ok?r.json():null; }).then(function(idx){
    if(idx && idx.threads){
      EX.threads = idx.threads;
      EX.liveCount = (idx.total_messages||0);
      document.getElementById('ex-note').innerHTML = '● Full offline mirror loaded: '+ (idx.total_messages||EX.threads.length) +' messages across '+ EX.threads.length +' threads.';
    }
  }).catch(function(){});
  paintLandmarks(); paintMonths(); paintExDetail();
}

// tabs
document.querySelectorAll('.ex-tab').forEach(function(b){
  b.addEventListener('click', function(){
    exState.tab = b.getAttribute('data-extab');
    document.querySelectorAll('.ex-tab').forEach(function(x){ x.classList.toggle('act', x===b); });
    document.getElementById('ex-pane-landmarks').style.display = exState.tab==='landmarks'?'':'none';
    document.getElementById('ex-pane-months').style.display = exState.tab==='months'?'':'none';
  });
});

function paintLandmarks(){
  var el = document.getElementById('ex-threads');
  var list = (EXI.landmarks||[]).filter(function(t){ return !exState.filter || t.priority; });
  document.getElementById('ex-lm-count').textContent = list.length + ' landmark threads';
  el.innerHTML = list.map(function(t,i){
    var gi = EXI.landmarks.indexOf(t);
    return '<div class="ex-thread'+(exState.sel===gi?' act':'')+'" data-i="'+gi+'">'+
      (t.priority?'<span class="ex-star">★</span>':'<span class="ex-star dim">·</span>')+
      '<div><div class="ex-subj">'+esc(t.subject)+'</div>'+
      '<div class="ex-sub">'+esc(t.author)+' · '+esc(t.month)+'</div></div></div>';
  }).join('');
  el.querySelectorAll('.ex-thread').forEach(function(d){
    d.addEventListener('click', function(){ exState.sel = +d.getAttribute('data-i'); exState.selMonth=null; paintLandmarks(); paintExDetail(); });
  });
}

function monthUrl(label, view){ return EXI.base + label + '/' + view + '.html'; }

function paintMonths(){
  var el = document.getElementById('ex-months');
  var months = EXI.months||[];
  var q = exState.monthQ.trim();
  var shown = q ? months.filter(function(m){ return m.label.indexOf(q)>=0; }) : months;
  document.getElementById('ex-month-count').textContent = shown.length + ' months';
  // group by year, newest first
  var years = {};
  shown.forEach(function(m){ (years[m.y]=years[m.y]||[]).push(m); });
  var order = Object.keys(years).sort(function(a,b){ return b-a; });
  el.innerHTML = order.map(function(y){
    return '<div class="ex-yeargrp"><h4>'+y+'</h4><div class="ex-monrow">'+
      years[y].map(function(m){
        return '<span class="ex-mon'+(exState.selMonth===m.label?' act':'')+'" data-m="'+m.label+'">'+m.mon.slice(0,3)+'</span>';
      }).join('')+'</div></div>';
  }).join('');
  el.querySelectorAll('.ex-mon').forEach(function(s){
    s.addEventListener('click', function(){ exState.selMonth = s.getAttribute('data-m'); exState.sel=null; paintMonths(); paintExDetail(); });
  });
}
var exMonthSearch = document.getElementById('ex-month-search');
if(exMonthSearch) exMonthSearch.addEventListener('input', function(){ exState.monthQ = this.value; paintMonths(); });

function previewFor(month){
  // Show any shipped reader-preview messages whose month matches (real seed text).
  var t = (EX.threads||[]).filter(function(x){ return x.month===month; });
  if(!t.length) return '';
  return '<div class="ex-preview"><h5>Reader preview: sample messages</h5>'+
    t.map(function(th){
      return th.messages.map(function(m){
        var body = esc(m.body).split('\n').map(function(ln){ return /^\s*&gt;/.test(ln)?'<span class="q">'+ln+'</span>':ln; }).join('\n');
        return '<div class="ex-msg'+(m.priority?' pri':'')+'"><div class="ex-head"><b>'+esc(m.author_short||m.author)+'</b><span>'+esc(m.date)+'</span></div><pre class="ex-body">'+body+'</pre></div>';
      }).join('');
    }).join('')+'</div>';
}

function paintExDetail(){
  var pane = document.getElementById('ex-messages');
  // landmark selected
  if(exState.sel!=null && EXI.landmarks[exState.sel]){
    var t = EXI.landmarks[exState.sel];
    pane.innerHTML =
      '<div class="ex-mbyline">'+(t.priority?'★ priority author · ':'')+esc(t.month)+'</div>'+
      '<h3 class="ex-mt">'+esc(t.subject)+'</h3>'+
      '<div class="ex-mbyline">'+esc(t.author)+'</div>'+
      '<div class="ex-summary">'+esc(t.summary)+'</div>'+
      '<div class="ex-launch">'+
        '<a class="primary" href="'+monthUrl(t.month,'thread')+'" target="_blank" rel="noopener">Read this thread on the live archive ↗</a>'+
        '<a href="'+monthUrl(t.month,'author')+'" target="_blank" rel="noopener">Browse '+esc(t.month)+' by author ↗</a>'+
      '</div>'+
      previewFor(t.month)+
      '<div class="ex-hint" style="text-align:left;margin-top:10px">Full message text lives on the source archive at lists.extropy.org. Run <span style="color:var(--lime)">vault_scraper.py</span> to pull the complete thread (bodies, headers and all) into this vault for permanent offline reading.</div>';
    return;
  }
  // month selected
  if(exState.selMonth){
    var lm = (EXI.landmarks||[]).filter(function(x){ return x.month===exState.selMonth; });
    pane.innerHTML =
      '<div class="ex-mbyline">Extropy-Chat · monthly archive</div>'+
      '<h3 class="ex-mt">'+esc(exState.selMonth)+'</h3>'+
      '<p style="color:var(--paper-dim);font-size:15.5px;margin-bottom:20px">The complete boards for this month, served from the source archive. Open any index view:</p>'+
      '<div class="ex-views">'+
        '<a href="'+monthUrl(exState.selMonth,'thread')+'" target="_blank" rel="noopener">Thread view ↗</a>'+
        '<a href="'+monthUrl(exState.selMonth,'subject')+'" target="_blank" rel="noopener">Subject ↗</a>'+
        '<a href="'+monthUrl(exState.selMonth,'author')+'" target="_blank" rel="noopener">Author ↗</a>'+
        '<a href="'+monthUrl(exState.selMonth,'date')+'" target="_blank" rel="noopener">Date ↗</a>'+
      '</div>'+
      (lm.length?'<div class="ex-preview"><h5>Landmark threads this month</h5>'+lm.map(function(t){
        var gi = EXI.landmarks.indexOf(t);
        return '<div class="ex-msg pri"><div class="ex-head"><b>'+esc(t.author)+'</b><span>'+esc(t.subject)+'</span></div><pre class="ex-body">'+esc(t.summary)+'</pre></div>';
      }).join('')+'</div>':'')+
      previewFor(exState.selMonth);
    return;
  }
  // nothing selected
  pane.innerHTML = '<div class="ex-hint">Pick a <b style="color:var(--paper)">landmark thread</b> to read the story and jump to the source, or open <b style="color:var(--paper)">All months</b> to browse the entire run of the boards, '+((EXI.months||[]).length)+' months from '+((EXI.months||[])[0]||{}).label+' to today.<br><br>Every link opens the real Extropy-Chat archive. Run <span style="color:var(--lime)">vault_scraper.py</span> to mirror it all offline.</div>';
}

document.getElementById('ex-pri').addEventListener('click', function(){
  exState.filter = !exState.filter; this.classList.toggle('on', exState.filter); paintLandmarks();
});

// ── Crypto Wars exhibit ────────────────────────────────────
var CW_EVENTS = [
  {y:'1976', t:'DES review at Stanford', d:'NBS/NSA meeting transcript: Diffie and Hellman challenge the 56-bit key. The first public battle over deliberately weakened cryptography.', rec:'B59-301.001'},
  {y:'1991', t:'PGP 1.0 released', d:'Phil Zimmermann publishes Pretty Good Privacy; strong crypto reaches everyone with a modem, and triggers a federal export investigation.', rec:null},
  {y:'1992', t:'Cypherpunks convene', d:'Hughes, May and Gilmore start the list; "Cypherpunks write code" becomes the movement\'s answer to policy.', rec:'B59-002.003'},
  {y:'1993', t:'Clipper Chip announced', d:'The White House proposes key-escrow encryption. The backlash unites technologists and civil libertarians.', rec:'B59-302.007'},
  {y:'1994', t:'Remailer networks mature', d:'Hal Finney operates and documents anonymous remailers: privacy infrastructure built while the law is still hostile.', rec:'B59-303.004'},
  {y:'1995', t:'The SSL Challenge', d:'Hal Finney\'s challenge to break Netscape\'s export-grade 40-bit SSL is solved in days, proving weak-by-law crypto protects no one.', rec:'B59-106.002'},
  {y:'1995', t:'Bernstein v. DOJ filed', d:'With EFF backing, Daniel Bernstein sues: code is speech. Courts eventually agree.', rec:'B59-305.001'},
  {y:'1996', t:'Export controls loosen', d:'Crypto moves from the Munitions List to Commerce; the wall starts to crack.', rec:null},
  {y:'2000', t:'The wars (mostly) won', d:'US export rules are liberalized. Strong cryptography ships by default in browsers everywhere.', rec:'B59-106.003'}
];
function renderCryptoWars(){
  var tl = document.getElementById('cw-timeline');
  tl.innerHTML = CW_EVENTS.map(function(e){
    var rec = e.rec ? R.filter(function(r){ return r.id===e.rec; })[0] : null;
    return '<div class="cw-item">'+
      '<div class="cw-year">'+e.y+'</div>'+
      '<div class="cw-body"><h3>'+esc(e.t)+'</h3><p>'+esc(e.d)+'</p>'+
      (rec?'<a class="cw-rec" href="#/record/'+rec.id+'">'+rec.id+' · '+esc(rec.title)+' →</a>':'')+
      '</div></div>';
  }).join('');
  var wars = R.filter(function(r){ return r._colls.indexOf('wars')>=0; });
  document.getElementById('cw-records').innerHTML = wars.map(function(r){
    return '<a class="cw-card" href="#/record/'+r.id+'"><span class="call">'+r.id+'</span>'+
      '<span class="t">'+esc(r.title)+'</span>'+
      '<span class="a">'+esc(r.author||'')+'</span></a>';
  }).join('');
  document.getElementById('cw-count').textContent = wars.length + ' records in this collection';
}

// ── Channel 59 modal ───────────────────────────────────────
function openCh59(){
  var ov = document.getElementById('ch59-overlay');
  ov.innerHTML = '<div class="ch59">'+
    '<button class="d-close" aria-label="Close">×</button>'+
    '<div class="ch59-head">CHANNEL 59: LIVE FROM THE NODE</div>'+
    '<div class="ch59-tv"><iframe src="https://stream.nodeb59.com/embed/video" allowfullscreen title="Channel 59 stream"></iframe></div>'+
    '<div class="ch59-foot"><span>If the signal is down, the mainframe sleeps.</span>'+
    '<a href="https://nodeb59.com/channel59.html" target="_blank" rel="noopener">Open full Channel 59 ↗</a></div></div>';
  ov.classList.add('open');
  ov.querySelector('.d-close').addEventListener('click', closeCh59);
  ov.addEventListener('click', function(e){ if(e.target===ov) closeCh59(); });
}
// Clears innerHTML (not just hides) so the live stream iframe actually stops,
// rather than continuing to load/play muted behind whatever view comes next.
function closeCh59(){
  var ov = document.getElementById('ch59-overlay');
  if(ov && ov.classList.contains('open')){ ov.classList.remove('open'); ov.innerHTML=''; }
}
document.querySelectorAll('[data-ch59]').forEach(function(b){ b.addEventListener('click', openCh59); });

// ── Search wiring ──────────────────────────────────────────
// The hero field doubles as a live-results dropdown: catalogue metadata
// (title, author, tags, hash, the operators above) plus, once the full-text
// index has loaded, hits inside the archived document bodies themselves,
// shown as a second group with the matched paragraph as a snippet.
var q = document.getElementById('q');
var drop = document.getElementById('search-drop');
var dropSel = -1;
function snippetFor(text, term){
  var i = text.toLowerCase().indexOf(term.toLowerCase());
  if(i<0) return esc(text.slice(0,140));
  var start = Math.max(0, i-60), end = Math.min(text.length, i+term.length+80);
  var pre = (start>0?'…':'')+esc(text.slice(start,i));
  var hit = '<mark>'+esc(text.slice(i,i+term.length))+'</mark>';
  var post = esc(text.slice(i+term.length,end))+(end<text.length?'…':'');
  return pre+hit+post;
}
function paintDrop(){
  var v = q.value.trim();
  if(!v){ drop.classList.remove('open'); drop.innerHTML=''; return; }
  var pq = parseQuery(v);
  var metaHits = pq.inText ? [] : R.filter(function(r){ return matchesQuery(r, pq); }).slice(0,6);
  var term = pq.free;
  var bodyHits = term && FT ? fullTextHits(term, 6) : [];
  var html = '';
  if(metaHits.length){
    html += '<div class="grp">Catalogue: title, author, tags</div>';
    html += metaHits.map(function(r){
      return '<div class="hit" data-id="'+r.id+'">'+
        '<div class="c">'+r.id+'<br><span style="color:#5a6172">'+esc((r.date||'').slice(0,4))+'</span></div>'+
        '<div><div class="h">'+esc(r.title)+'</div><div class="a">'+esc(r.author||'')+'</div></div></div>';
    }).join('');
  }
  if(bodyHits.length){
    html += '<div class="grp">Inside document text'+(!FT?' (loading…)':'')+'</div>';
    html += bodyHits.map(function(h){
      var r = R.filter(function(x){return x.id===h.id;})[0];
      if(!r) return '';
      return '<div class="hit" data-id="'+r.id+'">'+
        '<div class="c">'+r.id+'<br><span style="color:#5a6172">'+esc((r.date||'').slice(0,4))+'</span></div>'+
        '<div><div class="h">'+esc(r.title)+'</div><div class="snip">'+snippetFor(h.text, term)+'</div></div></div>';
    }).join('');
  }
  if(!FT) loadFullText().then(function(){ if(q.value.trim()===v) paintDrop(); });
  drop.innerHTML = html || '<div class="foot"><span>No catalogue or document-text matches.</span></div>';
  var hitEls = drop.querySelectorAll('.hit');
  dropSel = hitEls.length ? 0 : -1;
  hitEls.forEach(function(h,i){ h.classList.toggle('sel', i===dropSel); });
  drop.insertAdjacentHTML('beforeend', '<div class="foot"><span>'+hitEls.length+' shown</span><a href="#" id="drop-ask">Ask the Archivist instead →</a></div>');
  drop.classList.add('open');
  drop.querySelectorAll('.hit').forEach(function(h){ h.addEventListener('click', function(){ openRecord(h.getAttribute('data-id')); drop.classList.remove('open'); }); });
  var da = document.getElementById('drop-ask');
  if(da) da.addEventListener('click', function(e){ e.preventDefault(); drop.classList.remove('open'); document.querySelector('[data-ask-open]').click(); document.getElementById('ask-input').value = v; });
}
q.addEventListener('input', function(){ state.q = q.value; renderResults(); paintDrop(); });
q.addEventListener('focus', function(){ loadFullText(); });
q.addEventListener('keydown', function(e){
  var hits = drop.querySelectorAll('.hit');
  if(e.key==='ArrowDown' && hits.length){ e.preventDefault(); dropSel=(dropSel+1)%hits.length; hits.forEach(function(h,i){h.classList.toggle('sel',i===dropSel);}); }
  else if(e.key==='ArrowUp' && hits.length){ e.preventDefault(); dropSel=(dropSel-1+hits.length)%hits.length; hits.forEach(function(h,i){h.classList.toggle('sel',i===dropSel);}); }
  else if(e.key==='Enter' && dropSel>=0 && hits[dropSel]){ openRecord(hits[dropSel].getAttribute('data-id')); drop.classList.remove('open'); }
  else if(e.key==='Escape'){ drop.classList.remove('open'); q.blur(); }
});
document.addEventListener('click', function(e){ if(!drop.contains(e.target) && e.target!==q) drop.classList.remove('open'); });
document.addEventListener('keydown', function(e){
  if(e.key==='/' && document.activeElement!==q && !/input|textarea/i.test(document.activeElement.tagName)){ e.preventDefault(); location.hash='#/archive'; q.focus(); }
});

// ── Catalog sort + year-range ────────────────────────────────
var sortSel = document.getElementById('sort-sel'), yrFrom = document.getElementById('yr-from'), yrTo = document.getElementById('yr-to');
if(sortSel) sortSel.addEventListener('change', function(){ state.sort = sortSel.value; renderResults(); });
function readYr(el){ var v = parseInt(el.value,10); return isNaN(v) ? null : v; }
if(yrFrom) yrFrom.addEventListener('input', function(){ state.yrFrom = readYr(yrFrom); renderResults(); });
if(yrTo) yrTo.addEventListener('input', function(){ state.yrTo = readYr(yrTo); renderResults(); });

// ── Stats ──────────────────────────────────────────────────
var hostedCount = R.filter(function(r){ return r.local; }).length;
document.getElementById('stat-records').textContent = R.length;
var ledgerCount = document.getElementById('ledger-count'); if(ledgerCount) ledgerCount.textContent = R.length;
document.getElementById('stat-offline').textContent = hostedCount;
var statOffline2 = document.getElementById('stat-offline2'); if(statOffline2) statOffline2.textContent = hostedCount;
document.getElementById('stat-threads').textContent = ((window.B59_EXTROPY_INDEX||{}).months||[]).length;
var footRecords = document.getElementById('foot-records'); if(footRecords) footRecords.textContent = R.length;
var footHosted = document.getElementById('foot-hosted'); if(footHosted) footHosted.textContent = hostedCount;
var footMonths = document.getElementById('foot-months'); if(footMonths) footMonths.textContent = ((window.B59_EXTROPY_INDEX||{}).months||[]).length;
var offlineDocCount = document.getElementById('offline-doc-count'); if(offlineDocCount) offlineDocCount.textContent = hostedCount;

// ── Reading room (homepage featured strip) ──────────────────
(function(){
  var room = document.getElementById('reading-room');
  if(!room) return;
  var FEATURED = ['B59-000','B59-204.003','B59-302.004','B59-106.002','B59-402.001','B59-904.003'];
  var picks = FEATURED.map(function(id){ return R.filter(function(r){ return r.id===id; })[0]; }).filter(Boolean);
  room.innerHTML = picks.map(function(r){
    var cls = classOf(r);
    return '<div class="room-card" data-id="'+r.id+'">'+
      '<div class="top"><span class="id">'+r.id+'</span>'+(cls?'<span class="cls-badge">'+cls+'</span>':'')+'</div>'+
      '<h3>'+esc(r.title)+'</h3>'+
      '<div class="by">'+esc(r.author||'Unknown')+' · '+esc((r.date||'').slice(0,4))+'</div>'+
      '<p>'+esc(r.description||'')+'</p>'+
    '</div>';
  }).join('');
  room.querySelectorAll('.room-card').forEach(function(c){
    c.addEventListener('click', function(){ openRecord(c.getAttribute('data-id')); });
  });
  var catalogLink = document.getElementById('room-catalog-link');
  if(catalogLink) catalogLink.addEventListener('click', function(){
    var anchor = document.getElementById('catalog-anchor');
    if(anchor) anchor.scrollIntoView({behavior:'smooth', block:'start'});
  });
})();

// ── Boards mode toggle + live IRC ─────
// Primary: our OWN Modulo59 network, embedded (see vault-app/m59irc.js);
// possible because it's our server and allows this origin. Secondary: the
// wider rooms on Libera.Chat, which forbid embedding, so those open in a
// new tab.
(function(){
  var LIVE_CHANS = ['#bitcoin','#cryptography','##crypto','#monero','#nostr','#tor'];
  var painted = false;
  function liberaUrl(ch){
    // web.libera.chat reads the channel from the literal URL fragment,
    // keep the '#'s unencoded (##crypto stays ##crypto).
    return 'https://web.libera.chat/' + ch;
  }
  function openChan(ch){
    window.open(liberaUrl(ch), '_blank', 'noopener');
  }
  function paintChans(){
    var el = document.getElementById('live-chans');
    if(!el) return;
    el.innerHTML = LIVE_CHANS.map(function(c){
      return '<button class="live-chan" data-ch="'+c+'" type="button">'+c+' ↗</button>';
    }).join('');
    el.querySelectorAll('.live-chan').forEach(function(b){
      b.addEventListener('click', function(){ openChan(b.getAttribute('data-ch')); });
    });
  }
  function ensureLive(){
    if(painted) return; painted = true;
    paintChans();
    // Connect + mount our embedded Modulo59 client on first entry to Live IRC.
    var host = document.getElementById('m59-client');
    if(host && window.B59M59IRC) window.B59M59IRC.mount(host);
  }

  document.querySelectorAll('.bmode').forEach(function(b){
    b.addEventListener('click', function(){
      var mode = b.getAttribute('data-bmode');
      document.querySelectorAll('.bmode').forEach(function(x){ x.classList.toggle('act', x===b); });
      document.getElementById('boards-archive').style.display = mode==='archive'?'':'none';
      document.getElementById('boards-live').style.display = mode==='live'?'':'none';
      if(mode==='live') ensureLive();
    });
  });
  var joinForm = document.getElementById('live-join');
  if(joinForm) joinForm.addEventListener('submit', function(e){
    e.preventDefault();
    var v = document.getElementById('live-input').value.trim();
    if(!v) return;
    if(v.charAt(0)!=='#') v = '#'+v;
    openChan(v);
  });
})();

// ── Boot ───────────────────────────────────────────────────
window.B59 = { openRecord:openRecord, records:R, collections:COLLECTIONS, types:TYPES, classes:CLASSES, classOf:classOf, esc:esc };
renderFacets(); renderResults(); renderExtropy(); renderCryptoWars(); route();
fetch('vault-app/id-redirect.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ if(j){ B59_REDIRECT = j; route(); } }).catch(function(){});
})();
