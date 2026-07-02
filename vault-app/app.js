// Project B59 — The Vault : core app (catalog, detail, extropy reader, crypto wars, routing)
(function(){
'use strict';
var R = window.B59_RECORDS || [];
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };

var TYPES = {
  writing:{label:'Writing', color:'#CBEE1B'},
  website:{label:'Website', color:'#2CD4F2'},
  video:{label:'Video', color:'#FF2D95'},
  audio:{label:'Audio', color:'#FFB627'},
  image:{label:'Image', color:'#9B6BFF'},
  code:{label:'Code', color:'#7AE8A4'}
};

var COLLECTIONS = [
  {id:'hal',      name:'Hal Finney Papers',        tags:['hal-finney','rpow','als','cryonics','alcor']},
  {id:'szabo',    name:'Szabo & Smart Contracts',  tags:['nick-szabo','smart-contracts','bit-gold','digital-property','legal-theory']},
  {id:'lists',    name:'Lists & Remailers',        tags:['cypherpunks','mailing-list','remailers','anonymous-communication','irc','mirc']},
  {id:'cash',     name:'Digital Cash',             tags:['digital-cash','ecash','digicash','david-chaum','blind-signatures','magic-money','netcash']},
  {id:'wars',     name:'Crypto Wars',              tags:['crypto-wars','pgp','ssl','des','nsa','export-controls','clipper-chip','eff','bernstein','free-speech']},
  {id:'extropy',  name:'Extropians',               tags:['extropians','transhumanism','max-more','crypto-anarchy']},
  {id:'markets',  name:'Digital Markets',          tags:['phil-salin','amix','agorics','digital-markets','hayek','austrian-economics','economics']},
  {id:'gaming',   name:'Retro Gaming',             tags:['gaming','video-games','atari','intellivision','aph','game-design']},
  {id:'research', name:'Research & Reference',     tags:['research-compilation','external-reference','timeline','reference']}
];

function collFor(rec){
  var out = [];
  COLLECTIONS.forEach(function(c){
    if((rec.tags||[]).some(function(t){ return c.tags.indexOf(t)>=0; })) out.push(c.id);
  });
  return out;
}
R.forEach(function(r){ r._colls = collFor(r); });

var state = { q:'', type:null, coll:null, view:'archive' };

// ── Routing ────────────────────────────────────────────────
var VIEWS = ['archive','timeline','extropy','cryptowars','boards','feed','network'];
function route(){
  var h = (location.hash||'').replace(/^#\/?/,'');
  var parts = h.split('/');
  if(parts[0]==='record' && parts[1]){ show('archive'); openRecord(parts[1]); return; }
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
  if(v==='timeline' && window.B59Timeline){ window.B59Timeline.init(); } else if(window.B59Timeline){ window.B59Timeline.stop(); }
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', route);

// ── Facets ─────────────────────────────────────────────────
function counts(){
  var t={}, c={};
  R.forEach(function(r){
    t[r.type]=(t[r.type]||0)+1;
    r._colls.forEach(function(id){ c[id]=(c[id]||0)+1; });
  });
  return {types:t, colls:c};
}
function renderFacets(){
  var n = counts();
  var el = document.getElementById('facets');
  var html = '<div class="facet"><h3>Collections</h3><ul>';
  html += '<li data-coll="" class="'+(!state.coll?'act':'')+'">All records <span class="n">'+R.length+'</span></li>';
  COLLECTIONS.forEach(function(c){
    html += '<li data-coll="'+c.id+'" class="'+(state.coll===c.id?'act':'')+'">'+esc(c.name)+' <span class="n">'+(n.colls[c.id]||0)+'</span></li>';
  });
  html += '</ul></div><div class="facet"><h3>Format</h3><ul>';
  html += '<li data-type="" class="'+(!state.type?'act':'')+'">All formats <span class="n">'+R.length+'</span></li>';
  Object.keys(TYPES).forEach(function(k){
    if(!n.types[k]) return;
    html += '<li data-type="'+k+'" class="'+(state.type===k?'act':'')+'"><span class="tdot" style="background:'+TYPES[k].color+'"></span>'+TYPES[k].label+' <span class="n">'+n.types[k]+'</span></li>';
  });
  html += '</ul></div>';
  html += '<div class="facet"><h3>Availability</h3><ul>'+
    '<li data-off="1" class="'+(state.off?'act':'')+'">Offline copy in vault <span class="n">'+R.filter(function(r){return r.local;}).length+'</span></li></ul></div>';
  el.innerHTML = html;
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
function filtered(){
  var q = state.q.toLowerCase();
  return R.filter(function(r){
    if(state.type && r.type!==state.type) return false;
    if(state.coll && r._colls.indexOf(state.coll)<0) return false;
    if(state.off && !r.local) return false;
    if(q){
      var hay = (r.id+' '+r.title+' '+(r.author||'')+' '+(r.description||'')+' '+(r.tags||[]).join(' ')+' '+(r.hash||'')).toLowerCase();
      if(hay.indexOf(q)<0) return false;
    }
    return true;
  });
}
function renderResults(){
  var list = filtered();
  document.getElementById('result-count').textContent = list.length + ' of ' + R.length + ' records';
  var el = document.getElementById('results');
  el.innerHTML = list.map(function(r){
    var tc = (TYPES[r.type]||{}).color || '#9AA0AE';
    var year = (r.date||'').slice(0,4);
    return '<article class="rec" data-id="'+r.id+'">'+
      '<div class="call">'+r.id+'<span class="era">'+esc(year)+' · <i style="color:'+tc+';font-style:normal">'+esc((TYPES[r.type]||{}).label||r.type)+'</i></span></div>'+
      '<div><div class="title">'+esc(r.title)+'</div>'+
      '<p class="desc">'+esc((r.description||'').slice(0,220))+((r.description||'').length>220?'…':'')+'</p>'+
      '<div class="meta">'+
        '<span><b>'+esc(r.author||'Unknown')+'</b></span>'+
        (r.hash?'<span>hash <b>'+esc(r.hash.slice(0,4))+'…'+esc(r.hash.slice(-4))+'</b></span>':'')+
        (r.local?'<span class="off-badge">● offline copy</span>':'<span class="pend-badge">○ source pending</span>')+
      '</div></div></article>';
  }).join('') || '<div class="empty">Nothing matches. Clear a filter or try the Archivist.</div>';
  el.querySelectorAll('.rec').forEach(function(a){
    a.addEventListener('click', function(){ openRecord(a.getAttribute('data-id')); });
  });
}

// ── Record detail ──────────────────────────────────────────
function openRecord(id){
  var r = R.filter(function(x){ return x.id===id; })[0];
  if(!r) return;
  var ov = document.getElementById('detail-overlay');
  var tc = (TYPES[r.type]||{}).color || '#9AA0AE';
  var gh = 'https://github.com/ProjectB59/projectb59/tree/main/' + (r.content_path || ('content/'+r.id));
  var files = (r.files||[]).map(function(f){
    return '<li>'+esc(f.path)+' <span class="n">'+(f.size>1048576?(f.size/1048576).toFixed(1)+' MB':Math.round(f.size/1024)+' KB')+'</span></li>';
  }).join('');
  ov.innerHTML = '<div class="detail" role="dialog" aria-label="'+esc(r.title)+'">'+
    '<button class="d-close" aria-label="Close">×</button>'+
    '<div class="d-call">'+r.id+' · <span style="color:'+tc+'">'+esc((TYPES[r.type]||{}).label||r.type)+'</span></div>'+
    '<h2 class="d-title">'+esc(r.title)+'</h2>'+
    '<div class="d-byline">'+esc(r.author||'Unknown')+' · '+esc(r.date||'')+'</div>'+
    (r.excerpt?'<blockquote class="d-quote">'+esc(r.excerpt)+'</blockquote>':'')+
    '<p class="d-desc">'+esc(r.description||'')+'</p>'+
    '<dl class="d-meta">'+
      (r.citation?'<dt>Citation</dt><dd>'+esc(r.citation)+'</dd>':'')+
      (r.provenance?'<dt>Provenance</dt><dd>'+esc(r.provenance)+'</dd>':'')+
      (r.hash?'<dt>SHA-256</dt><dd class="d-hash">'+esc(r.hash)+'</dd>':'')+
      (files?'<dt>Files</dt><dd><ul class="d-files">'+files+'</ul></dd>':'')+
    '</dl>'+
    '<div class="d-tags">'+(r.tags||[]).map(function(t){ return '<span>'+esc(t)+'</span>'; }).join('')+'</div>'+
    '<div class="d-actions">'+
      (r.local?r.local.map(function(p,i){ return '<a class="btn-lime" href="'+encodeURI(p)+'" target="_blank" rel="noopener">Read document'+(r.local.length>1?' '+(i+1):'')+' ↗</a>'; }).join(''):'')+
      '<a class="btn-ghost" href="'+gh+'" target="_blank" rel="noopener">Source on GitHub ↗</a>'+
      '<span class="d-sia">Sia upload: queued</span>'+
    '</div></div>';
  ov.classList.add('open');
  ov.querySelector('.d-close').addEventListener('click', closeRecord);
}
function closeRecord(){ document.getElementById('detail-overlay').classList.remove('open'); }
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeRecord(); });
document.getElementById('detail-overlay').addEventListener('click', function(e){ if(e.target===this) closeRecord(); });

// ── Extropian Vault : real archive browser ─────────────────
var EX = window.B59_EXTROPY || {threads:[],authors:{}};
var EXI = window.B59_EXTROPY_INDEX || {base:'https://lists.extropy.org/pipermail/extropy-chat/', months:[], landmarks:[]};
var exState = { tab:'landmarks', sel:null, selMonth:null, filter:false, monthQ:'' };

function renderExtropy(){
  // If a full offline mirror (vault_data/index.json from the scraper) is present,
  // note it — the boards reader and landmark previews upgrade to real bodies.
  fetch('vault_data/index.json').then(function(r){ return r.ok?r.json():null; }).then(function(idx){
    if(idx && idx.threads){
      EX.threads = idx.threads;
      EX.liveCount = (idx.total_messages||0);
      document.getElementById('ex-note').innerHTML = '● Full offline mirror loaded — '+ (idx.total_messages||EX.threads.length) +' messages across '+ EX.threads.length +' threads.';
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
  return '<div class="ex-preview"><h5>Reader preview — sample messages</h5>'+
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
      '<div class="ex-hint" style="text-align:left;margin-top:10px">Full message text lives on the source archive at lists.extropy.org. Run <span style="color:var(--lime)">vault_scraper.py</span> to pull the complete thread — bodies, headers and all — into this vault for permanent offline reading.</div>';
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
  pane.innerHTML = '<div class="ex-hint">Pick a <b style="color:var(--paper)">landmark thread</b> to read the story and jump to the source — or open <b style="color:var(--paper)">All months</b> to browse the entire run of the boards, '+((EXI.months||[]).length)+' months from '+((EXI.months||[])[0]||{}).label+' to today.<br><br>Every link opens the real Extropy-Chat archive. Run <span style="color:var(--lime)">vault_scraper.py</span> to mirror it all offline.</div>';
}

document.getElementById('ex-pri').addEventListener('click', function(){
  exState.filter = !exState.filter; this.classList.toggle('on', exState.filter); paintLandmarks();
});

// ── Crypto Wars exhibit ────────────────────────────────────
var CW_EVENTS = [
  {y:'1976', t:'DES review at Stanford', d:'NBS/NSA meeting transcript — Diffie and Hellman challenge the 56-bit key. The first public battle over deliberately weakened cryptography.', rec:'B59-0031'},
  {y:'1991', t:'PGP 1.0 released', d:'Phil Zimmermann publishes Pretty Good Privacy; strong crypto reaches everyone with a modem — and triggers a federal export investigation.', rec:null},
  {y:'1992', t:'Cypherpunks convene', d:'Hughes, May and Gilmore start the list; "Cypherpunks write code" becomes the movement\'s answer to policy.', rec:'B59-0042'},
  {y:'1993', t:'Clipper Chip announced', d:'The White House proposes key-escrow encryption. The backlash unites technologists and civil libertarians.', rec:'B59-0011'},
  {y:'1994', t:'Remailer networks mature', d:'Hal Finney operates and documents anonymous remailers — privacy infrastructure built while the law is still hostile.', rec:'B59-0017'},
  {y:'1995', t:'The SSL Challenge', d:'Hal Finney\'s challenge to break Netscape\'s export-grade 40-bit SSL is solved in days — proving weak-by-law crypto protects no one.', rec:'B59-0040'},
  {y:'1995', t:'Bernstein v. DOJ filed', d:'With EFF backing, Daniel Bernstein sues: code is speech. Courts eventually agree.', rec:'B59-0012'},
  {y:'1996', t:'Export controls loosen', d:'Crypto moves from the Munitions List to Commerce; the wall starts to crack.', rec:null},
  {y:'2000', t:'The wars (mostly) won', d:'US export rules are liberalized. Strong cryptography ships by default in browsers everywhere.', rec:'B59-0092'}
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
    '<div class="ch59-head">CHANNEL 59 — LIVE FROM THE NODE</div>'+
    '<div class="ch59-tv"><iframe src="https://stream.nodeb59.com/embed/video" allowfullscreen title="Channel 59 stream"></iframe></div>'+
    '<div class="ch59-foot"><span>If the signal is down, the mainframe sleeps.</span>'+
    '<a href="https://nodeb59.com/channel59.html" target="_blank" rel="noopener">Open full Channel 59 ↗</a></div></div>';
  ov.classList.add('open');
  ov.querySelector('.d-close').addEventListener('click', function(){ ov.classList.remove('open'); ov.innerHTML=''; });
  ov.addEventListener('click', function(e){ if(e.target===ov){ ov.classList.remove('open'); ov.innerHTML=''; } });
}
document.querySelectorAll('[data-ch59]').forEach(function(b){ b.addEventListener('click', openCh59); });

// ── Search wiring ──────────────────────────────────────────
var q = document.getElementById('q');
q.addEventListener('input', function(){ state.q = q.value; renderResults(); });
document.addEventListener('keydown', function(e){
  if(e.key==='/' && document.activeElement!==q && !/input|textarea/i.test(document.activeElement.tagName)){ e.preventDefault(); location.hash='#/archive'; q.focus(); }
});

// ── Stats ──────────────────────────────────────────────────
document.getElementById('stat-records').textContent = R.length;
document.getElementById('stat-offline').textContent = R.filter(function(r){ return r.local; }).length;
document.getElementById('stat-threads').textContent = ((window.B59_EXTROPY_INDEX||{}).months||[]).length;

// ── Boards mode toggle + live IRC (Kiwi → Libera.Chat) ─────
(function(){
  var LIVE_CHANS = ['#bitcoin','#cryptography','##crypto','#monero','#nostr','#tor'];
  var kiwiLoaded = false, curChan = '#bitcoin';
  function kiwiUrl(ch){
    // Kiwi nextclient: fragment carries the channel (leading # kept)
    return 'https://kiwiirc.com/nextclient/irc.libera.chat/' + encodeURIComponent(ch);
  }
  function loadChan(ch){
    curChan = ch;
    var f = document.getElementById('kiwi');
    if(f) f.src = kiwiUrl(ch);
    document.querySelectorAll('.live-chan').forEach(function(b){ b.classList.toggle('act', b.getAttribute('data-ch')===ch); });
  }
  function paintChans(){
    var el = document.getElementById('live-chans');
    if(!el) return;
    el.innerHTML = LIVE_CHANS.map(function(c){
      return '<button class="live-chan'+(c===curChan?' act':'')+'" data-ch="'+c+'" type="button">'+c+'</button>';
    }).join('');
    el.querySelectorAll('.live-chan').forEach(function(b){
      b.addEventListener('click', function(){ loadChan(b.getAttribute('data-ch')); });
    });
  }
  function ensureLive(){ if(kiwiLoaded) return; kiwiLoaded = true; paintChans(); loadChan(curChan); }

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
    loadChan(v);
  });
})();

// ── Boot ───────────────────────────────────────────────────
window.B59 = { openRecord:openRecord, records:R, collections:COLLECTIONS, types:TYPES };
renderFacets(); renderResults(); renderExtropy(); renderCryptoWars(); route();
})();
