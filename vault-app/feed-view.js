// Project B59 — THE FEED: a CRT scroller of curated historical writings
// recovered from the X archive. Data: window.B59_FEED (see feed.js).
(function(){
'use strict';
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};

var TOPIC_COLOR = {
  'Bitcoin':'var(--lime)', 'Gaming History':'var(--magenta)', 'Cryptography':'var(--cyan)',
  'Digital Cash':'var(--amber)', 'Cypherpunks':'var(--magenta)', 'Szabo':'var(--amber)',
  'Extropians':'var(--cyan)', 'People':'var(--paper-dim)'
};
var MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function fmtDate(d){ if(!d) return '————'; var p=d.split('-'); return p[0]+' · '+MONTHS[(+p[1])-1]+' '+p[2]; }

var CSS = `
#view-feed .feed-wrap{ max-width:820px; margin:0 auto; padding:0 20px 80px; }
#view-feed .feed-filters{ display:flex; flex-wrap:wrap; gap:8px; margin:6px 0 26px; }
#view-feed .fchip{
  font-family:var(--mono); font-size:12px; letter-spacing:.5px; cursor:pointer;
  padding:6px 12px; border-radius:999px; border:1px solid var(--hair-strong);
  background:transparent; color:var(--paper-dim); text-transform:uppercase; transition:all .15s;
}
#view-feed .fchip:hover{ color:var(--paper); border-color:var(--lime); }
#view-feed .fchip.on{ background:var(--lime); color:var(--navy); border-color:var(--lime); font-weight:600; }
#view-feed .feed-stream{ display:flex; flex-direction:column; gap:22px; position:relative; }
#view-feed .tx{
  position:relative; background:linear-gradient(180deg,var(--panel),var(--navy2));
  border:1px solid var(--hair); border-left:3px solid var(--lime); border-radius:10px;
  padding:18px 20px 16px; overflow:hidden;
}
#view-feed .tx::after{ /* CRT scanlines */
  content:""; position:absolute; inset:0; pointer-events:none; border-radius:10px;
  background:repeating-linear-gradient(rgba(0,0,0,0) 0 2px, rgba(0,0,0,.05) 2px 4px);
}
#view-feed .tx.article{ border-left-color:var(--cyan); }
#view-feed .tx-head{ display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
#view-feed .tx-badge{
  font-family:var(--mono); font-size:10px; letter-spacing:1.5px; text-transform:uppercase;
  padding:3px 8px; border-radius:4px; background:rgba(203,238,27,.14); color:var(--lime); border:1px solid var(--hair-strong);
}
#view-feed .tx.article .tx-badge{ background:rgba(44,212,242,.14); color:var(--cyan); border-color:rgba(44,212,242,.4); }
#view-feed .tx-date{ font-family:var(--term); font-size:17px; color:var(--paper-dim); letter-spacing:1px; }
#view-feed .tx-num{ margin-left:auto; font-family:var(--mono); font-size:10px; color:var(--paper-dim); opacity:.6; }
#view-feed .tx-title{ font-family:var(--serif); font-size:24px; line-height:1.2; color:var(--paper); margin:2px 0 10px; }
#view-feed .tx-body{ font-family:var(--serif); font-size:17px; line-height:1.6; color:var(--paper); }
#view-feed .tx-body p{ margin:0 0 10px; }
#view-feed .tx-body a{ color:var(--cyan); }
#view-feed .tx-body.clip{ max-height:150px; overflow:hidden; -webkit-mask-image:linear-gradient(180deg,#000 60%,transparent); mask-image:linear-gradient(180deg,#000 60%,transparent); }
#view-feed .tx-more{
  font-family:var(--mono); font-size:11px; letter-spacing:1px; text-transform:uppercase; cursor:pointer;
  color:var(--lime); background:none; border:none; padding:8px 0 0; display:inline-flex; align-items:center; gap:6px;
}
#view-feed .tx-more:hover{ text-decoration:underline; }
#view-feed .tx-foot{ display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; align-items:center; }
#view-feed .tag{ font-family:var(--mono); font-size:10px; letter-spacing:.5px; color:var(--paper-dim); display:inline-flex; align-items:center; gap:4px; }
#view-feed .tag i{ width:7px; height:7px; border-radius:50%; display:inline-block; }
#view-feed .tx-src{ margin-left:auto; font-family:var(--mono); font-size:10px; color:var(--paper-dim); opacity:.55; }
#view-feed .feed-empty{ font-family:var(--mono); color:var(--paper-dim); padding:40px 0; text-align:center; }
#view-feed .feed-count{ font-family:var(--mono); font-size:11px; color:var(--paper-dim); letter-spacing:1px; margin-bottom:14px; text-transform:uppercase; }
`;

function paras(text){
  return String(text||'').split(/\n{2,}/).map(function(b){
    return '<p>'+esc(b).replace(/\n/g,'<br>').replace(/(https?:\/\/[^\s]+)/g,function(u){ return '<a href="'+u+'" target="_blank" rel="noopener">'+u.replace(/^https?:\/\//,'').slice(0,40)+'…</a>'; })+'</p>';
  }).join('');
}

function card(item, idx){
  var isArt = item.type==='article';
  var long = (item.text||'').length > 620;
  var tags = (item.topics||[]).map(function(t){ return '<span class="tag"><i style="background:'+(TOPIC_COLOR[t]||'var(--paper-dim)')+'"></i>'+esc(t)+'</span>'; }).join('');
  var body = paras(item.text);
  return '<article class="tx '+(isArt?'article':'note')+'" data-topics="'+esc((item.topics||[]).join('|'))+'">'+
    '<div class="tx-head">'+
      '<span class="tx-badge">'+(isArt?'✦ Article':'▪ Transmission')+'</span>'+
      '<span class="tx-date">'+fmtDate(item.date)+'</span>'+
      '<span class="tx-num">#'+String(idx+1).padStart(2,'0')+'</span>'+
    '</div>'+
    (isArt && item.title ? '<h2 class="tx-title">'+esc(item.title)+'</h2>' : '')+
    '<div class="tx-body'+(long?' clip':'')+'">'+body+'</div>'+
    (long?'<button class="tx-more" data-more>▸ Expand transmission</button>':'')+
    '<div class="tx-foot">'+tags+'<span class="tx-src">// X archive</span></div>'+
  '</article>';
}

var built = false, activeTopic = null;
function render(){
  var F = window.B59_FEED || [];
  var items = activeTopic ? F.filter(function(i){ return (i.topics||[]).indexOf(activeTopic)>=0; }) : F;
  var stream = document.getElementById('feed-stream');
  var cnt = document.getElementById('feed-count');
  cnt.textContent = items.length + (activeTopic?(' transmissions · '+activeTopic):' transmissions recovered');
  stream.innerHTML = items.length ? items.map(card).join('') : '<div class="feed-empty">No transmissions on that frequency.</div>';
  stream.querySelectorAll('[data-more]').forEach(function(b){
    b.addEventListener('click', function(){ var body=b.previousElementSibling; body.classList.remove('clip'); b.remove(); });
  });
}

function build(){
  if(built) return; built = true;
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var F = window.B59_FEED || [];
  var topics = {}; F.forEach(function(i){ (i.topics||[]).forEach(function(t){ topics[t]=(topics[t]||0)+1; }); });
  var chips = '<button class="fchip on" data-topic="">All frequencies</button>' +
    Object.keys(topics).sort(function(a,b){return topics[b]-topics[a];}).map(function(t){
      return '<button class="fchip" data-topic="'+esc(t)+'">'+esc(t)+' · '+topics[t]+'</button>';
    }).join('');
  var host = document.getElementById('view-feed');
  host.innerHTML =
    '<div class="wrap section-head">'+
      '<div class="kicker">Field Transmissions · Recovered from the Archive</div>'+
      '<h1>The Feed</h1>'+
      '<p>Historical writing and research, pulled from years of posts and rebuilt as a standing record. Filter a frequency, or scroll the whole signal.</p>'+
    '</div>'+
    '<div class="feed-wrap">'+
      '<div class="feed-filters">'+chips+'</div>'+
      '<div class="feed-count" id="feed-count"></div>'+
      '<div class="feed-stream" id="feed-stream"></div>'+
    '</div>';
  host.querySelectorAll('.fchip').forEach(function(b){
    b.addEventListener('click', function(){
      activeTopic = b.getAttribute('data-topic') || null;
      host.querySelectorAll('.fchip').forEach(function(x){ x.classList.toggle('on', x===b); });
      render();
    });
  });
  render();
}

window.B59Feed = { init: build };

// app.js runs route() before this module loads, so a direct load / refresh on
// #/feed would skip init. Catch that case here (build() is idempotent).
if((location.hash||'').replace(/^#\/?/,'').split('/')[0]==='feed') build();
})();
