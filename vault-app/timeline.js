// Modulo 59 — THE VAULT : interactive, playable timeline of the road to digital cash
(function(){
'use strict';
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });};

// Strands (categories) — each a colored thread through the story
var CAT = {
  crypto:  {label:'Cryptography',   color:'#2CD4F2'},
  cash:    {label:'Digital Cash',   color:'#CBEE1B'},
  cypher:  {label:'Cypherpunks',    color:'#FF2D95'},
  pow:     {label:'Proof-of-Work',  color:'#FFB627'},
  bitcoin: {label:'Bitcoin',        color:'#9B6BFF'}
};

// Curated, accurate milestones. `rec` links to a vault record when one exists.
var EVENTS = [
  {y:1976, cat:'crypto', t:'New Directions in Cryptography', who:'Whitfield Diffie & Martin Hellman',
   d:'Public-key cryptography is born. For the first time two strangers can agree on a secret over an open wire — the mathematical foundation everything here is built on.', rec:'B59-0031'},
  {y:1977, cat:'crypto', t:'RSA', who:'Rivest, Shamir & Adleman',
   d:'The first practical public-key cryptosystem. Encryption and digital signatures become real, deployable tools.'},
  {y:1979, cat:'crypto', t:'Merkle Trees & Hash Puzzles', who:'Ralph Merkle',
   d:'Merkle\u2019s hash trees let you verify one item against a huge dataset with a tiny proof — later the backbone of every blockchain. His "puzzles" foreshadow proof-of-work.'},
  {y:1982, cat:'cash', t:'Blind Signatures for Untraceable Payments', who:'David Chaum',
   d:'Chaum shows how a bank can sign a coin without seeing it — unconditional payer anonymity. The intellectual seed of all digital cash.', rec:'B59-0034'},
  {y:1985, cat:'cash', t:'Security Without Identification', who:'David Chaum',
   d:'"Transaction systems to make Big Brother obsolete." Chaum lays out a whole society of privacy-preserving credentials.', rec:'B59-0038'},
  {y:1990, cat:'cash', t:'DigiCash / ecash founded', who:'David Chaum',
   d:'Chaumian ecash goes commercial. Brilliant cryptography, but a centralized mint — a single point of failure that history will not forgive.', rec:'B59-0002'},
  {y:1991, cat:'crypto', t:'How to Time-Stamp a Digital Document', who:'Stuart Haber & W. Scott Stornetta',
   d:'Documents chained by hash so no timestamp can be altered without breaking every one after it. Cited directly in the Bitcoin whitepaper.'},
  {y:1991, cat:'cypher', t:'PGP 1.0 released', who:'Phil Zimmermann',
   d:'Strong encryption reaches anyone with a modem — and triggers a three-year federal criminal investigation into its author.', rec:'B59-0036'},
  {y:1992, cat:'pow', t:'Pricing via Processing, or Combatting Junk Mail', who:'Cynthia Dwork & Moni Naor',
   d:'The origin of proof-of-work. To deter spam, require the sender to compute a moderately hard function first — imposing a real cost on abuse while staying free for honest use. Every later PoW system descends from this idea.', rec:'B59-0096', star:true},
  {y:1992, cat:'cypher', t:'The Cypherpunks form', who:'Eric Hughes, Tim May & John Gilmore',
   d:'A mailing list and a mantra: "Cypherpunks write code." Privacy will be built, not legislated.', rec:'B59-0042'},
  {y:1993, cat:'cypher', t:'A Cypherpunk\u2019s Manifesto', who:'Eric Hughes',
   d:'"Privacy is necessary for an open society in the electronic age." The movement\u2019s founding text.', rec:'B59-0030'},
  {y:1993, cat:'cypher', t:'The Clipper Chip', who:'US Government',
   d:'A proposed key-escrow chip that would give the state a backdoor to all encryption. The backlash galvanizes the crypto wars.', rec:'B59-0011'},
  {y:1994, cat:'cypher', t:'Anonymous Remailers mature', who:'Hal Finney and others',
   d:'Finney builds and documents mix-based remailers — real privacy infrastructure shipped while the law is still hostile.', rec:'B59-0017'},
  {y:1995, cat:'crypto', t:'The SSL Challenge', who:'Hal Finney',
   d:'Finney\u2019s challenge to break Netscape\u2019s export-grade 40-bit SSL is solved in days — proving that crypto weakened by law protects no one.', rec:'B59-0040'},
  {y:1997, cat:'pow', t:'Hashcash', who:'Adam Back',
   d:'A working proof-of-work stamp for email — the direct, practical ancestor of Bitcoin mining. Dwork & Naor\u2019s idea, shipped.'},
  {y:1998, cat:'cash', t:'b-money', who:'Wei Dai',
   d:'A proposal for anonymous, distributed electronic cash where proof-of-work creates money and everyone keeps the ledger. Cited in the Bitcoin whitepaper.'},
  {y:1998, cat:'cash', t:'Secure Property Titles with Owner Authority', who:'Nick Szabo',
   d:'A replicated, Byzantine-fault-tolerant registry of ownership with no central authority — the property-rights half of a decentralized economy.', rec:'B59-0051'},
  {y:2004, cat:'pow', t:'RPOW — Reusable Proofs of Work', who:'Hal Finney',
   d:'Finney makes hashcash tokens reusable via a transparent, remotely-attestable server. The last conceptual step before Bitcoin.', rec:'B59-0055'},
  {y:2005, cat:'cash', t:'Bit Gold', who:'Nick Szabo',
   d:'Proof-of-work chained and timestamped into unforgeable, ownable digital scarcity. Bitcoin\u2019s clearest single precursor.', rec:'B59-0046'},
  {y:2008, cat:'bitcoin', t:'Bitcoin: A Peer-to-Peer Electronic Cash System', who:'Satoshi Nakamoto',
   d:'Every strand ties together: hashes, Merkle trees, timestamping and proof-of-work become one system with no mint and no trusted third party.', rec:'B59-0052', star:true},
  {y:2009, cat:'bitcoin', t:'Genesis block & the first transaction', who:'Satoshi Nakamoto → Hal Finney',
   d:'January 3: the chain begins. Nine days later Satoshi sends 10 bitcoin to Hal Finney — the first transaction, and the moment this whole history becomes running code.', rec:'B59-0041'}
];

var minY = 1976, maxY = 2009;
var state = { i:0, cat:null, playing:false, timer:null };

function visible(){ return EVENTS.filter(function(e){ return !state.cat || e.cat===state.cat; }); }

function el(id){ return document.getElementById(id); }

function paintChips(){
  var wrap = el('tl-chips');
  var chips = '<button class="tl-chip'+(!state.cat?' on':'')+'" data-cat="">All strands</button>';
  Object.keys(CAT).forEach(function(k){
    chips += '<button class="tl-chip'+(state.cat===k?' on':'')+'" data-cat="'+k+'" style="--c:'+CAT[k].color+'"><i></i>'+CAT[k].label+'</button>';
  });
  wrap.innerHTML = chips;
  wrap.querySelectorAll('.tl-chip').forEach(function(b){
    b.addEventListener('click', function(){
      state.cat = b.getAttribute('data-cat')||null;
      var vis = visible();
      state.i = 0;
      paintChips(); paintRail(); paintDetail();
    });
  });
}

function paintRail(){
  var rail = el('tl-rail');
  var span = maxY - minY;
  var ticks = '';
  for(var y=minY; y<=maxY; y++){
    var left = ((y-minY)/span*100);
    if(y%2===0 || y===maxY) ticks += '<span class="tl-tick" style="left:'+left+'%"><i></i><b>\u2019'+String(y).slice(2)+'</b></span>';
  }
  var vis = visible();
  var dots = vis.map(function(e){
    var gi = EVENTS.indexOf(e);
    var left = ((e.y-minY)/span*100);
    var on = (EVENTS.indexOf(vis[state.i])===gi);
    return '<button class="tl-dot'+(on?' on':'')+(e.star?' star':'')+'" data-i="'+gi+'" title="'+esc(e.t)+'" '+
      'style="left:'+left+'%;--c:'+CAT[e.cat].color+'"></button>';
  }).join('');
  rail.innerHTML = '<div class="tl-axis"></div>'+ticks+dots+'<div class="tl-playhead" id="tl-playhead"></div>';
  rail.querySelectorAll('.tl-dot').forEach(function(d){
    d.addEventListener('click', function(){
      var gi = +d.getAttribute('data-i');
      var vis2 = visible();
      state.i = vis2.indexOf(EVENTS[gi]);
      stop(); paintRail(); paintDetail();
    });
  });
  movePlayhead();
}

function movePlayhead(){
  var vis = visible(); if(!vis.length) return;
  var e = vis[state.i]; if(!e) return;
  var span = maxY - minY;
  var ph = el('tl-playhead');
  if(ph) ph.style.left = ((e.y-minY)/span*100)+'%';
}

function paintDetail(){
  var vis = visible();
  var e = vis[state.i];
  var pane = el('tl-detail');
  if(!e){ pane.innerHTML = '<div class="tl-empty">No milestones in this strand.</div>'; return; }
  var c = CAT[e.cat];
  var rec = e.rec && window.B59 ? window.B59.records.filter(function(r){ return r.id===e.rec; })[0] : null;
  pane.innerHTML =
    '<div class="tl-year" style="color:'+c.color+'">'+e.y+(e.star?' <span class="tl-star">\u2605</span>':'')+'</div>'+
    '<div class="tl-strand" style="--c:'+c.color+'"><i></i>'+c.label+'</div>'+
    '<h3 class="tl-title">'+esc(e.t)+'</h3>'+
    '<div class="tl-who">'+esc(e.who)+'</div>'+
    '<p class="tl-blurb">'+esc(e.d)+'</p>'+
    (rec?'<a class="tl-rec" href="#/record/'+rec.id+'">Open in archive · '+rec.id+' →</a>':
      (e.rec?'<span class="tl-rec dim">Record '+esc(e.rec)+'</span>':''))+
    '<div class="tl-progress">'+(state.i+1)+' / '+vis.length+'</div>';
  el('tl-counter').textContent = (state.i+1)+' of '+vis.length;
}

function go(delta){
  var vis = visible(); if(!vis.length) return;
  state.i = (state.i + delta + vis.length) % vis.length;
  paintRail(); paintDetail();
}
function play(){
  if(state.playing){ stop(); return; }
  state.playing = true;
  el('tl-play').textContent = '❚❚ Pause';
  el('tl-play').classList.add('on');
  state.timer = setInterval(function(){
    var vis = visible();
    if(state.i >= vis.length-1){ stop(); return; }
    go(1);
  }, 2600);
}
function stop(){
  state.playing = false;
  state.timer && clearInterval(state.timer); state.timer=null;
  var b = el('tl-play'); if(b){ b.textContent = '▶ Play'; b.classList.remove('on'); }
}

var tlBound = false;
function init(){
  paintChips(); paintRail(); paintDetail();
  if(tlBound) return;
  tlBound = true;
  el('tl-play').addEventListener('click', play);
  el('tl-prev').addEventListener('click', function(){ stop(); go(-1); });
  el('tl-next').addEventListener('click', function(){ stop(); go(1); });
  // keyboard when timeline visible
  document.addEventListener('keydown', function(e){
    var v = document.getElementById('view-timeline');
    if(!v || v.style.display==='none') return;
    if(/input|textarea/i.test((document.activeElement||{}).tagName||'')) return;
    if(e.key==='ArrowRight'){ stop(); go(1); }
    else if(e.key==='ArrowLeft'){ stop(); go(-1); }
    else if(e.key===' '){ e.preventDefault(); play(); }
  });
}
window.B59Timeline = { init:init, stop:stop };
})();
