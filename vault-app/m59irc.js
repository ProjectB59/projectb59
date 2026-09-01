// Project B59 — Modulo59 IRC: a tiny embedded web client for OUR OWN IRC
// network (Ergo on the claudecraft droplet). Unlike Libera, this is our
// server, so it can be embedded directly: Ergo's websocket allows the
// projectb59.com origin, and we speak the IRCv3 protocol over it.
//
// Deliberately minimal — connect as a guest, join a channel, read and send.
// No SASL/account UI here; registering a nick is a power-user thing done
// with a normal client. window.B59M59IRC = { mount, setChannel, disconnect }.
(function(){
'use strict';
var WS_URL = 'wss://claudecraft.nodeb59.com/webirc';
var CHANNELS = ['#modulo59', '#arcade', '#vault'];
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };

var NICK_COLORS = ['#AEC44E','#2CD4F2','#FF2D95','#FFB627','#9B6BFF','#7AE8A4','#FF7AB0','#6AA7FF'];
function nickColor(n){ var h=0; for(var i=0;i<n.length;i++) h=(h*31+n.charCodeAt(i))>>>0; return NICK_COLORS[h%NICK_COLORS.length]; }

var ws = null, connected = false, myNick = '', channel = '#modulo59', mounted = false;
var elLog, elInput, elSend, elStatus, elChans;

function parse(line){
  // IRCv3 line: [@tags] [:prefix] COMMAND [params] [:trailing]
  var s = line, tags = '';
  if(s.charAt(0)==='@'){ var sp = s.indexOf(' '); tags = s.slice(1, sp); s = s.slice(sp+1); }
  var prefix = '';
  if(s.charAt(0)===':'){ var sp2 = s.indexOf(' '); prefix = s.slice(1, sp2); s = s.slice(sp2+1); }
  var trailing = null, ci = s.indexOf(' :');
  if(ci !== -1){ trailing = s.slice(ci+2); s = s.slice(0, ci); }
  var parts = s.split(' ').filter(Boolean);
  var cmd = parts.shift() || '';
  if(trailing !== null) parts.push(trailing);
  return { tags: tags, prefix: prefix, nick: prefix.split('!')[0], cmd: cmd.toUpperCase(), params: parts };
}

function send(line){ if(ws && ws.readyState===1) ws.send(line); }

function addLine(html, cls){
  if(!elLog) return;
  var atBottom = elLog.scrollTop + elLog.clientHeight >= elLog.scrollHeight - 30;
  var d = document.createElement('div');
  d.className = 'm59-line' + (cls?' '+cls:'');
  d.innerHTML = html;
  elLog.appendChild(d);
  if(atBottom) elLog.scrollTop = elLog.scrollHeight;
}
function sys(text){ addLine('<span class="m59-star">*</span> ' + esc(text), 'sys'); }
function msg(nick, text){
  addLine('<span class="m59-nick" style="color:'+nickColor(nick)+'">&lt;'+esc(nick)+'&gt;</span> <span class="m59-txt">'+esc(text)+'</span>');
}

function setStatus(t, on){ if(elStatus){ elStatus.textContent = t; elStatus.className = 'm59-status' + (on?' on':''); } }

function connect(){
  if(ws) return;
  setStatus('connecting to irc.nodeb59.com…', false);
  myNick = 'Guest-' + Math.random().toString(36).slice(2, 7);
  try { ws = new WebSocket(WS_URL, 'text.ircv3.net'); }
  catch(e){ setStatus('could not open a connection', false); return; }

  ws.onopen = function(){
    send('NICK ' + myNick);
    send('USER guest 0 * :Modulo59 web guest');
  };
  ws.onmessage = function(ev){
    String(ev.data).split(/\r?\n/).forEach(function(line){
      if(!line) return;
      var m = parse(line);
      if(m.cmd === 'PING'){ send('PONG :' + (m.params[0]||'')); return; }
      if(m.cmd === '001'){ connected = true; setStatus('connected as ' + myNick, true); joinChannel(channel); return; }
      if(m.cmd === '433'){ myNick = 'Guest-' + Math.random().toString(36).slice(2, 7); send('NICK ' + myNick); return; }
      if(m.cmd === 'PRIVMSG'){
        var target = m.params[0], body = m.params[1] || '';
        if(target && target.charAt(0)==='#') msg(m.nick || '?', body);
        else sys('(dm from ' + (m.nick||'?') + ') ' + body);
        return;
      }
      if(m.cmd === 'NOTICE'){ sys((m.nick||'server') + ': ' + (m.params[1]||'')); return; }
      if(m.cmd === 'JOIN' && m.nick && m.nick !== myNick){ sys(m.nick + ' joined ' + (m.params[0]||channel)); return; }
      if((m.cmd === 'PART' || m.cmd === 'QUIT') && m.nick && m.nick !== myNick){ sys(m.nick + ' left'); return; }
      if(m.cmd === 'ERROR'){ sys('disconnected: ' + (m.params[0]||'')); return; }
    });
  };
  ws.onclose = function(){ connected = false; setStatus('disconnected — click a channel to reconnect', false); ws = null; };
  ws.onerror = function(){ setStatus('connection error', false); };
}

function joinChannel(ch){
  channel = ch;
  if(elLog) elLog.innerHTML = '';
  sys('tuning to ' + ch + ' on the Modulo59 network…');
  paintChans();
  if(!ws){ connect(); return; }
  if(connected) send('JOIN ' + ch);
}

function paintChans(){
  if(!elChans) return;
  elChans.innerHTML = CHANNELS.map(function(c){
    return '<button class="m59-chan'+(c===channel?' act':'')+'" data-ch="'+c+'" type="button">'+c+'</button>';
  }).join('');
  elChans.querySelectorAll('.m59-chan').forEach(function(b){
    b.addEventListener('click', function(){ joinChannel(b.getAttribute('data-ch')); });
  });
}

function sendInput(){
  var v = (elInput.value || '').trim();
  if(!v) return;
  elInput.value = '';
  if(!connected){ sys('not connected yet — hang on a second'); return; }
  if(v.charAt(0)==='/'){
    // pass a couple of safe slash commands straight through, e.g. /nick /me
    var parts = v.slice(1).split(' ');
    var c = parts[0].toLowerCase();
    if(c==='nick' && parts[1]){ myNick = parts[1]; send('NICK ' + parts[1]); return; }
    if(c==='me' && parts.length>1){ var act = parts.slice(1).join(' '); send('PRIVMSG '+channel+' :ACTION '+act+''); addLine('<span class="m59-star">*</span> '+esc(myNick)+' '+esc(act),'sys'); return; }
    sys('only /nick and /me work here — open a full client for the rest'); return;
  }
  send('PRIVMSG ' + channel + ' :' + v);
  msg(myNick, v); // local echo
}

function mount(container){
  if(mounted) { if(!ws) connect(); return; }
  mounted = true;
  container.innerHTML =
    '<div class="m59-bar"><div class="m59-chans" id="m59-chans"></div>'+
      '<span class="m59-status" id="m59-status">idle</span></div>'+
    '<div class="m59-log" id="m59-log"></div>'+
    '<form class="m59-input-row" id="m59-form">'+
      '<span class="m59-prompt">&gt;</span>'+
      '<input id="m59-input" type="text" placeholder="say something on '+esc(channel)+'…" autocomplete="off" spellcheck="false">'+
      '<button type="submit">Send</button>'+
    '</form>';
  elChans = container.querySelector('#m59-chans');
  elLog = container.querySelector('#m59-log');
  elInput = container.querySelector('#m59-input');
  elStatus = container.querySelector('#m59-status');
  container.querySelector('#m59-form').addEventListener('submit', function(e){ e.preventDefault(); sendInput(); });
  paintChans();
  sys('This is the Modulo59 network — our own IRC server. You join as a guest; pick a nick with /nick, or open a full client and register to hold one.');
  connect();
}

function disconnect(){ if(ws){ send('QUIT :leaving'); ws.close(); ws = null; } }

window.B59M59IRC = { mount: mount, setChannel: joinChannel, disconnect: disconnect };
})();
