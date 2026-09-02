// Project B59: thread pages, one full-photo page per thread on the hero's
// five-thread rail. Filters the real catalog by BDC class (or the 'wars'
// collection for Crypto Wars, which isn't its own class); Bitcoin is just
// the keystone record on its own.
(function(){
'use strict';
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };

var THREADS = [
  {id:'cypherpunks', name:'Cypherpunks', short:'Code, not law', years:'1992+',
   blurb:'The mailing list that treated cryptography as a civic technology. Remailers, PGP, mixnets, and the rule that cypherpunks write code.',
   photo:'assets/vault/thread-cypherpunks.jpg', filter:function(r){ return classOf(r)==='3'; }},
  {id:'extropians', name:'Extropians', short:'Dynamic optimism', years:'1988+',
   blurb:'The Extropy journal and list, where transhumanists argued that markets, crypto, and self-transforming systems could outrun institutions.',
   photo:'assets/vault/thread-extropians.jpg', filter:function(r){ return classOf(r)==='7'; }},
  {id:'digital-cash', name:'Digital Cash', short:'Untraceable value', years:'1982-2008',
   blurb:'From Chaum’s blind signatures to b-money, bit gold, hashcash and RPOW: the failed and half-built moneys Bitcoin finally closed.',
   photo:'assets/vault/thread-digital-cash.jpg', filter:function(r){ return classOf(r)==='2'; }},
  {id:'crypto-wars', name:'Crypto Wars', short:'Export is munitions', years:'1991-2000',
   blurb:'Clipper, ITAR, Bernstein, export-grade SSL. The decade when the US treated math as a weapon and lost.',
   photo:'assets/vault/thread-crypto-wars.jpg', filter:function(r){ return (r._colls||[]).indexOf('wars')>=0; }},
  {id:'arcade', name:'Arcade Years', short:'The past is playable', years:'1971+',
   blurb:'Coin-drop machines, Habitat tokens, MUD economies. Digital scarcity was a game design problem long before it was a monetary one.',
   photo:'assets/vault/thread-arcade.jpg', filter:function(r){ return classOf(r)==='9'; }},
  {id:'bitcoin', name:'Bitcoin', short:'The terminus', years:'2008-2009', terminus:true,
   blurb:'Whitepaper, list post, genesis block, v0.1. The five threads knot here. After this the vault keeps copies, not arguments.',
   photo:'assets/vault/thread-bitcoin.jpg', filter:function(r){ return r.id==='B59-000'; }}
];

function classOf(r){ return (window.B59 && window.B59.classOf) ? window.B59.classOf(r) : null; }
function byId(id){ return THREADS.filter(function(t){ return t.id===id; })[0]; }

function pillsHtml(activeId){
  return THREADS.map(function(t){
    var cls = 'thread-pill'+(t.id===activeId?' on':'')+(t.terminus?' terminus':'');
    return '<a class="'+cls+'" href="#/thread/'+t.id+'">'+esc(t.name)+'</a>';
  }).join('');
}

function open(id){
  var t = byId(id);
  var host = document.getElementById('thread-body');
  if(!t){
    host.innerHTML = '<div class="wrap" style="padding:80px 0;text-align:center"><h1 style="font-family:var(--serif);font-size:28px">Unknown thread</h1><a href="#/archive" class="mono" style="color:var(--lime)">Back to the vault</a></div>';
    return;
  }
  var R = (window.B59 && window.B59.records) || [];
  var records = R.filter(t.filter);
  host.innerHTML =
    '<section class="thread-hero">'+
      '<img src="'+t.photo+'" alt="'+esc(t.short)+'">'+
      '<div class="tint"></div><div class="fade-y"></div>'+
      '<div class="thread-hero-inner">'+
        '<p class="hero-kicker" style="color:'+(t.terminus?'var(--amber)':'var(--lime)')+'">Thread &middot; '+esc(t.years)+'</p>'+
        '<h1 style="margin-top:8px;font-family:var(--serif);font-weight:500;font-size:clamp(30px,4.5vw,46px);color:var(--paper)">'+esc(t.name)+'</h1>'+
        '<p class="short">'+esc(t.short)+'</p>'+
        '<p class="blurb">'+esc(t.blurb)+'</p>'+
      '</div>'+
      '<div class="thread-pills">'+pillsHtml(t.id)+'</div>'+
    '</section>'+
    '<div class="wrap" style="padding:36px 0 60px">'+
      '<p class="mono" style="font-size:11px;color:var(--paper-mute)">'+records.length+' sealed record'+(records.length===1?'':'s')+'</p>'+
      '<div id="thread-records" style="margin-top:8px"></div>'+
    '</div>';

  var listHost = document.getElementById('thread-records');
  listHost.innerHTML = records.map(function(r){
    var cls = classOf(r);
    var year = (r.date||'').slice(0,4);
    return '<article class="rec" data-id="'+r.id+'"><div class="call">'+r.id+(cls?' <span class="cls-badge">'+cls+'</span>':'')+'<span class="era">'+esc(year)+'</span></div>'+
      '<div><div class="title">'+esc(r.title)+'</div>'+
      '<p class="desc">'+esc((r.description||'').slice(0,200))+((r.description||'').length>200?'…':'')+'</p>'+
      '<div class="meta"><span><b>'+esc(r.author||'Unknown')+'</b></span></div></div></article>';
  }).join('') || '<p class="mono" style="color:var(--paper-dim);padding:20px 0">Nothing filed under this thread yet.</p>';
  listHost.querySelectorAll('.rec').forEach(function(a){
    a.addEventListener('click', function(){ location.hash = '#/record/'+a.getAttribute('data-id'); });
  });
  window.scrollTo(0,0);
}

window.B59Thread = { open: open, list: THREADS };
})();
