// Project B59 — THE ARCHIVIST: local keyword search over the vault catalog.
// No external API, no key, no network call — runs entirely client-side.
(function(){
'use strict';
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });};

var STOPWORDS = ('the a an of and or to in on for with about what who when where why how '+
  'is are was were did does do i you he she it we they this that these those').split(' ');

function tokenize(s){
  return String(s||'').toLowerCase().match(/[a-z0-9]+/g) || [];
}

function keywords(q){
  return tokenize(q).filter(function(w){ return w.length > 2 && STOPWORDS.indexOf(w) === -1; });
}

function recordText(r){
  return [r.title, r.author, r.type, (r.tags||[]).join(' '), r.description, r.excerpt]
    .filter(Boolean).join(' ').toLowerCase();
}

function search(qText){
  var R = window.B59_RECORDS || [];
  var terms = keywords(qText);
  if(!terms.length) return [];
  var scored = R.map(function(r){
    var text = recordText(r);
    var score = 0;
    terms.forEach(function(t){
      if((r.tags||[]).some(function(tag){ return tag.toLowerCase() === t; })) score += 4;
      if((r.title||'').toLowerCase().indexOf(t) !== -1) score += 3;
      if((r.author||'').toLowerCase().indexOf(t) !== -1) score += 3;
      var re = new RegExp('\\b'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b', 'g');
      var hits = text.match(re);
      if(hits) score += hits.length;
    });
    return { r: r, score: score };
  }).filter(function(x){ return x.score > 0; })
    .sort(function(a,b){ return b.score - a.score; })
    .slice(0, 5);
  return scored.map(function(x){ return x.r; });
}

function answerText(qText, matches){
  if(!matches.length){
    return 'Nothing in the vault matches that directly. Try different terms, or browse by tag in the Archive view.';
  }
  var lines = matches.map(function(r){
    var bits = [r.id, r.title];
    if(r.author) bits.push('— '+r.author);
    if(r.date) bits.push('('+String(r.date).slice(0,4)+')');
    return bits.join(' ') + (r.description ? ': '+r.description.slice(0,140) : '');
  });
  var lead = matches.length === 1
    ? 'One record matches:'
    : matches.length+' records match, closest first:';
  return lead + '\n\n' + lines.join('\n');
}

var log = [];
function paint(){
  var elLog = document.getElementById('ask-log');
  elLog.innerHTML = log.map(function(m){
    var html = esc(m.text).replace(/\n/g, '<br>').replace(/B59-\d{4}/g, function(id){ return '<a href="#/record/'+id+'">'+id+'</a>'; });
    return '<div class="ask-msg '+m.role+'">'+(m.role==='user'?'<span class="ask-who">you ›</span>':'<span class="ask-who">archivist ›</span>')+'<div>'+html+'</div></div>';
  }).join('');
  elLog.scrollTop = elLog.scrollHeight;
}

function ask(qText){
  if(!qText.trim()) return;
  log.push({role:'user', text:qText});
  var matches = search(qText);
  log.push({role:'ai', text: answerText(qText, matches)});
  paint();
}

var input = document.getElementById('ask-input');
var send = document.getElementById('ask-send');
function submit(){ var v = input.value; input.value=''; ask(v); }
send.addEventListener('click', submit);
input.addEventListener('keydown', function(e){ if(e.key==='Enter') submit(); });

document.querySelectorAll('[data-ask-example]').forEach(function(b){
  b.addEventListener('click', function(){ input.value = b.textContent.replace(/[""]/g,''); submit(); });
});

// toggle panel
var panel = document.getElementById('ask-panel');
document.querySelectorAll('[data-ask-open]').forEach(function(b){
  b.addEventListener('click', function(){ panel.classList.add('open'); setTimeout(function(){ input.focus(); }, 150); });
});
document.getElementById('ask-close').addEventListener('click', function(){ panel.classList.remove('open'); });
})();
