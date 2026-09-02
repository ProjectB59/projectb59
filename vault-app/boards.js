// Project B59: BOARDS, mIRC-style reader for the vault's lists & discussions
// Channels are built from real vault records + the Extropian thread mirror.
(function(){
'use strict';
var built = false;
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });};
var NICK_COLORS = ['#AEC44E','#2CD4F2','#FF2D95','#FFB627','#9B6BFF','#7AE8A4','#FF7AB0','#6AA7FF'];
function nickColor(n){ var h=0; for(var i=0;i<n.length;i++) h=(h*31+n.charCodeAt(i))>>>0; return NICK_COLORS[h%NICK_COLORS.length]; }
function nickOf(author){
  var a = (author||'archivist').split('<')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  return a.slice(0,16) || 'anon';
}

function buildChannels(){
  var R = (window.B59 && window.B59.records) || [];
  var EX = window.B59_EXTROPY || {threads:[]};
  function recMsgs(collId){
    return R.filter(function(r){ return r._colls && r._colls.indexOf(collId)>=0; }).map(function(r){
      return { nick:nickOf(r.author), time:(r.date||'').slice(0,10), text:r.title, sub:(r.excerpt||r.description||'').slice(0,180), rec:r.id };
    });
  }
  var chans = [
    { name:'#vault-lobby', topic:'Welcome to the B59 boards, type /help for commands', msgs:[
      { nick:'bot_admin', time:'', text:'This is an archive replay, not a live connection: real mailing list posts and essays from the vault, restaged as channel logs.', sys:true },
      { nick:'bot_admin', time:'', text:'Timestamps are the original post dates, not the time you are reading this.', sys:true },
      { nick:'bot_admin', time:'', text:'Join a channel on the left. Click any message to open its record in the archive.', sys:true },
      { nick:'bot_admin', time:'', text:'Commands: /list  /join #channel  /whois nick  /topic  /clear  /help', sys:true }
    ]},
    { name:'#extropy-chat', topic:'Extropy-Chat mirror: Hal Finney, Szabo, More, Yudkowsky', msgs:[] },
    { name:'#cypherpunks', topic:'Cypherpunks write code: lists, remailers, manifestos', msgs:recMsgs('lists') },
    { name:'#digital-cash', topic:'Chaum → ecash → b-money → bit gold', msgs:recMsgs('cash') },
    { name:'#smart-contracts', topic:'Szabo essays: trusted third parties are security holes', msgs:recMsgs('szabo') },
    { name:'#crypto-wars', topic:'Clipper, PGP, SSL challenge, Bernstein: the fight for strong crypto', msgs:recMsgs('wars') },
    { name:'#arcade', topic:'Off-topic: Atari, Intellivision, APh and the coin-op years', msgs:recMsgs('gaming') }
  ];
  // Extropy threads → chat lines. One real post is one line, not one line per
  // paragraph: a post is not a burst of separate messages from the same nick.
  // The full body renders as a single block (see line()), clipped with an
  // expand toggle when long.
  var ex = chans[1];
  (EX.threads||[]).forEach(function(t){
    ex.msgs.push({ nick:'bot_admin', time:t.month, text:'thread: '+t.subject+' ('+t.message_count+' messages)', sys:true });
    (t.messages||[]).forEach(function(m){
      ex.msgs.push({ nick:nickOf(m.author), time:(m.date||'').replace(/^\w+,\s*/,'').slice(0,11), text:(m.body||'').trim(), post:true });
    });
  });
  return chans;
}

var chans, cur = 0;
function el(id){ return document.getElementById(id); }

function paintChans(){
  el('irc-channels').innerHTML = chans.map(function(c,i){
    return '<div class="irc-ch'+(i===cur?' act':'')+'" data-i="'+i+'">'+esc(c.name)+'<span class="n">'+c.msgs.filter(function(m){return !m.sys;}).length+'</span></div>';
  }).join('');
  el('irc-channels').querySelectorAll('.irc-ch').forEach(function(d){
    d.addEventListener('click', function(){ switchTo(+d.getAttribute('data-i')); });
  });
}
function paintNicks(){
  var c = chans[cur];
  var nicks = {};
  c.msgs.forEach(function(m){ if(!m.sys) nicks[m.nick]=(nicks[m.nick]||0)+1; });
  var list = Object.keys(nicks).sort(function(a,b){ return nicks[b]-nicks[a]; });
  // Not a live "who's here" roster: a real correspondent index for this
  // channel, with the archive bot broken out below as what it is, a system
  // utility, not a peer sitting alongside Hal Finney et al.
  el('irc-nicks').innerHTML =
    '<div class="irc-nick-label">Correspondents</div>' +
    (list.length ? list.map(function(n){
      return '<div class="irc-nick" data-nick="'+esc(n)+'" style="color:'+nickColor(n)+'">'+esc(n)+'</div>';
    }).join('') : '<div class="irc-nick-empty">none archived here</div>') +
    '<div class="irc-nick-label">Archive bot</div>' +
    '<div class="irc-nick op" data-nick="bot_admin">@bot_admin</div>';
  el('irc-nicks').querySelectorAll('[data-nick]').forEach(function(d){
    d.addEventListener('click', function(){ whois(d.getAttribute('data-nick')); });
  });
}
function fmtBody(text){
  return esc(text).replace(/\n{2,}/g,'<br><br>').replace(/\n/g,'<br>');
}
function line(m){
  if(m.sys) return '<div class="irc-line sys">-!- '+esc(m.text)+'</div>';
  var open = m.rec ? ' data-rec="'+m.rec+'" title="Open record '+m.rec+'"' : '';
  var txt;
  if(m.post){
    var isLong = m.text.length > 420;
    txt = '<span class="post-body'+(isLong?' clip':'')+'">'+fmtBody(m.text)+'</span>'+
      (isLong ? '<button class="irc-more" data-more type="button">▸ expand full post</button>' : '');
  } else {
    txt = esc(m.text)+(m.sub?' <span class="sub">· '+esc(m.sub)+'…</span>':'');
  }
  return '<div class="irc-line'+(m.rec?' has-rec':'')+(m.post?' post':'')+'"'+open+'>'+
    (m.time?'<span class="ts">['+esc(m.time)+']</span>':'<span class="ts"></span>')+
    '<span class="nick" style="color:'+nickColor(m.nick)+'">&lt;'+esc(m.nick)+'&gt;</span>'+
    '<span class="txt">'+txt+'</span></div>';
}
function paintLog(){
  var c = chans[cur];
  el('irc-topic').innerHTML = '<b>'+esc(c.name)+'</b>: '+esc(c.topic);
  el('irc-title').textContent = 'mIRC59 archive replay: ['+c.name+'], not a live connection';
  var log = el('irc-log');
  log.innerHTML = c.msgs.map(line).join('');
  log.querySelectorAll('[data-rec]').forEach(function(d){
    d.addEventListener('click', function(e){ if(e.target.closest('[data-more]')) return; location.hash = '#/record/'+d.getAttribute('data-rec'); });
  });
  log.querySelectorAll('[data-more]').forEach(function(b){
    b.addEventListener('click', function(e){
      e.stopPropagation();
      var body = b.previousElementSibling;
      body.classList.remove('clip');
      b.remove();
    });
  });
  log.scrollTop = log.scrollHeight;
}
function switchTo(i){ cur = i; paintChans(); paintNicks(); paintLog(); }
function sysMsg(t){ chans[cur].msgs.push({nick:'bot_admin', time:'', text:t, sys:true}); paintLog(); }
function whois(n){
  var bios = {
    hal_finney:'Hal Finney: PGP 2.0 core dev, RPOW inventor, first Bitcoin transaction recipient. 847 archived messages.',
    nick_szabo:'Nick Szabo: smart contracts, bit gold, trusted third parties are security holes. 312 archived messages.',
    max_more:'Max More: Extropy Institute founder; the philosophy layer of the frontier.',
    eliezer_yudkowsky:'Eliezer Yudkowsky: early AI safety; prolific Extropy-list presence. 1,204 archived messages.',
    bot_admin:'bot_admin: the vault daemon. It never sleeps, it only archives.'
  };
  sysMsg(bios[n] || (n+': archived correspondent. Records under this name are in the archive; try searching it.'));
}

function command(v){
  var parts = v.trim().split(/\s+/);
  var cmd = parts[0].toLowerCase();
  if(cmd==='/help') sysMsg('Commands: /list (all channels), /join #name (switch), /whois nick (bio), /topic (channel topic), /clear (clear scroll). Click a line to open its record.');
  else if(cmd==='/list') sysMsg('Channels: '+chans.map(function(c){ return c.name; }).join('  '));
  else if(cmd==='/join'){ var i = chans.findIndex(function(c){ return c.name===(parts[1]||''); }); if(i>=0){ switchTo(i); } else sysMsg('No such channel: '+(parts[1]||'')+', try /list'); }
  else if(cmd==='/whois') whois((parts[1]||'').toLowerCase());
  else if(cmd==='/topic') sysMsg('Topic: '+chans[cur].topic);
  else if(cmd==='/clear'){ chans[cur].msgs = chans[cur].msgs.filter(function(m){ return !m.sys || cur!==0; }); paintLog(); }
  else if(cmd.charAt(0)==='/') sysMsg('Unknown command '+cmd+', try /help');
  else sysMsg('The boards are read-only, this is an archive, not a live wire. (Yet.) Try /help.');
}

function paintLists(){
  var host = el('boards-lists');
  if(!host) return;
  host.innerHTML = chans.map(function(c){
    var n = c.msgs.filter(function(m){ return !m.sys; }).length;
    return '<article class="rec" data-chan="'+c.name+'"><div class="call">'+esc(c.name)+'</div>'+
      '<div><div class="title">'+esc(c.topic)+'</div>'+
      '<div class="meta"><span><b>'+n+'</b> messages</span></div></div></article>';
  }).join('');
  host.querySelectorAll('[data-chan]').forEach(function(a){
    a.addEventListener('click', function(){
      var i = chans.findIndex(function(c){ return c.name===a.getAttribute('data-chan'); });
      if(i>=0) switchTo(i);
      document.querySelector('[data-bmode="archive"]').click();
      window.scrollTo(0,0);
    });
  });
}

var CSS = `
#irc-nicks .irc-nick-label{ padding:10px 14px 4px; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#5a6172; }
#irc-nicks .irc-nick-label:first-child{ padding-top:2px; }
#irc-nicks .irc-nick-empty{ padding:4px 14px 2px; font-size:11px; color:#5a6172; font-style:italic; }
.irc-line.post{ display:block; padding:8px 0 10px; }
.irc-line.post .ts, .irc-line.post .nick{ display:inline; }
.irc-line.post .txt{ display:block; margin-top:4px; }
.irc-line.post .post-body{ display:block; }
.irc-line.post .post-body.clip{ max-height:96px; overflow:hidden; -webkit-mask-image:linear-gradient(180deg,#000 55%,transparent); mask-image:linear-gradient(180deg,#000 55%,transparent); }
.irc-more{ font-family:var(--mono); font-size:11px; letter-spacing:.5px; color:var(--lime); background:none; border:none; padding:6px 0 0; cursor:pointer; display:block; }
.irc-more:hover{ text-decoration:underline; }
`;

function ensure(){
  if(built) return;
  built = true;
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  chans = buildChannels();
  switchTo(0);
  paintLists();
  var input = el('irc-input');
  input.addEventListener('keydown', function(e){
    if(e.key==='Enter' && input.value.trim()){ command(input.value); input.value=''; }
  });
}
window.B59Boards = { ensure: ensure };
})();
