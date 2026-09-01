// Project B59 — inline reader: renders an archived HTML document in-site
// (reading column + provenance sidebar) instead of opening the raw file in
// a new tab. Fetches the record's own primary file at read time and strips
// its chrome client-side — no separate reader dataset to keep in sync.
(function(){
'use strict';
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
var SIZES = [16, 18, 21, 24];
var sizeIdx = 1;

function extractBody(doc){
  doc.querySelectorAll('script,style,nav,header,footer,iframe,noscript,form').forEach(function(n){ n.remove(); });
  var blocks = doc.querySelectorAll('p,li,blockquote,h1,h2,h3,h4,h5,h6,pre');
  var out = [];
  blocks.forEach(function(b){
    var t = b.textContent.replace(/[ \t]+/g,' ').replace(/\n{2,}/g,'\n').trim();
    if(t.length<15) return;
    var tag = /^h[1-6]$/i.test(b.tagName) ? b.tagName.toLowerCase() : (b.tagName.toLowerCase()==='pre'?'pre':'p');
    out.push({tag:tag, text:t});
  });
  if(!out.length){
    var t = (doc.body?doc.body.textContent:'').replace(/[ \t]+/g,' ').trim();
    if(t) out.push({tag:'p', text:t});
  }
  return out;
}

function applySize(){
  var body = document.getElementById('reader-body');
  if(body) body.style.setProperty('--reader-fs', SIZES[sizeIdx]+'px');
}

function renderChrome(r, blocks, rawUrl){
  var host = document.getElementById('reader-wrap');
  var cls = (window.B59 && window.B59.classOf) ? window.B59.classOf(r) : null;
  var bodyHtml = blocks.map(function(b){
    if(b.tag==='pre') return '<pre>'+esc(b.text)+'</pre>';
    if(/^h[1-6]$/.test(b.tag)) return '<'+b.tag+'>'+esc(b.text)+'</'+b.tag+'>';
    return '<p>'+esc(b.text)+'</p>';
  }).join('');
  host.innerHTML =
    '<div class="reader-top"><a class="reader-back" href="#/record/'+r.id+'">← back to record</a></div>'+
    '<div class="reader-grid">'+
      '<div class="reader-col">'+
        '<h1>'+esc(r.title)+'</h1>'+
        '<div class="reader-byline">'+esc(r.author||'Unknown')+' · '+esc(r.date||'')+' · '+r.id+'</div>'+
        '<div class="reader-body" id="reader-body">'+bodyHtml+'</div>'+
      '</div>'+
      '<aside class="reader-side">'+
        '<h4>This document</h4>'+
        '<dl>'+
          '<dt>Record</dt><dd>'+r.id+(cls?' · class '+cls:'')+'</dd>'+
          (r.hash?'<dt>SHA-256</dt><dd>'+esc(r.hash.slice(0,12))+'…</dd>':'')+
          (r.provenance?'<dt>Provenance</dt><dd>'+esc(r.provenance)+'</dd>':'')+
        '</dl>'+
        '<div class="reader-tools">'+
          '<a href="'+encodeURI(rawUrl)+'" target="_blank" rel="noopener">Open original ↗</a>'+
          '<button type="button" id="reader-cite">Cite</button>'+
          '<button type="button" id="reader-link">Copy permalink</button>'+
        '</div>'+
        '<div class="reader-size"><span class="mono" style="font-size:11px;color:#5a6172">Text size</span>'+
          '<button type="button" id="reader-sm">A−</button><button type="button" id="reader-lg">A+</button>'+
        '</div>'+
      '</aside>'+
    '</div>';
  applySize();
  var smBtn = document.getElementById('reader-sm'), lgBtn = document.getElementById('reader-lg');
  if(smBtn) smBtn.addEventListener('click', function(){ sizeIdx = Math.max(0, sizeIdx-1); applySize(); });
  if(lgBtn) lgBtn.addEventListener('click', function(){ sizeIdx = Math.min(SIZES.length-1, sizeIdx+1); applySize(); });
  var citeBtn = document.getElementById('reader-cite');
  if(citeBtn) citeBtn.addEventListener('click', function(){
    var bits = [r.author||'Unknown']; if(r.date) bits.push('('+r.date.slice(0,4)+')');
    bits.push('"'+r.title+'."'); bits.push(r.id+'.'); bits.push('Project B59 Archive.');
    var t = r.citation || bits.join(' ');
    (navigator.clipboard&&navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ citeBtn.textContent='Copied'; setTimeout(function(){ citeBtn.textContent='Cite'; },1400); }).catch(function(){});
  });
  var linkBtn = document.getElementById('reader-link');
  if(linkBtn) linkBtn.addEventListener('click', function(){
    var url = location.origin + location.pathname + '#/read/' + r.id;
    (navigator.clipboard&&navigator.clipboard.writeText ? navigator.clipboard.writeText(url) : Promise.reject()).then(function(){ linkBtn.textContent='Copied'; setTimeout(function(){ linkBtn.textContent='Copy permalink'; },1400); }).catch(function(){});
  });
}

function open(id){
  var R = window.B59_RECORDS || [];
  var r = R.filter(function(x){ return x.id===id; })[0];
  var host = document.getElementById('reader-wrap');
  if(!r){ host.innerHTML = '<p class="reader-err">Record not found.</p>'; return; }
  var entry = (r.files||[]).filter(function(f){ return f.entry; })[0] || (r.files||[])[0];
  if(!entry || !/\.(html?|mht)$/i.test(entry.path)){
    location.hash = '#/record/' + r.id; return;
  }
  var url = (r.content_path || ('content/'+r.id)) + '/' + entry.path;
  host.innerHTML = '<div class="reader-loading">Loading '+esc(r.title)+'…</div>';
  fetch(url).then(function(res){ if(!res.ok) throw new Error('fetch failed'); return res.text(); })
    .then(function(html){
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var blocks = extractBody(doc);
      renderChrome(r, blocks, url);
    })
    .catch(function(){
      host.innerHTML = '<div class="reader-top"><a class="reader-back" href="#/record/'+r.id+'">← back to record</a></div>'+
        '<p class="reader-err">Could not load this document inline. <a href="'+encodeURI(url)+'" target="_blank" rel="noopener">Open original ↗</a></p>';
    });
}

window.B59Reader = { open: open };
})();
