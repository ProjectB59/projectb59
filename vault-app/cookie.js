// ============================================================================
// Project B59 — The Vault · lightweight cookie / privacy consent banner
// ----------------------------------------------------------------------------
// One-time notice, remembers the choice in localStorage, links to privacy.html.
// Privacy-preserving by default — nothing extra is loaded on dismiss.
// ============================================================================
(function () {
  var KEY = 'b59_vault_consent';
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }

  var bar = document.createElement('div');
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Cookie & privacy notice');
  bar.style.cssText =
    'position:fixed;left:50%;transform:translateX(-50%);bottom:64px;z-index:100001;' +
    'width:calc(100% - 32px);max-width:640px;box-sizing:border-box;' +
    'background:linear-gradient(180deg,#101A2E,#0A0E1A);border:1px solid rgba(203,238,27,.35);' +
    'border-radius:12px;color:#EDEAE0;font-family:"IBM Plex Mono",monospace;font-size:13px;line-height:1.55;' +
    'padding:16px 18px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:center;' +
    'box-shadow:0 10px 40px rgba(0,0,0,.6);';

  var msg = document.createElement('div');
  msg.style.cssText = 'flex:1 1 320px;min-width:260px;';
  msg.innerHTML =
    '🔒 The Vault keeps only <b>essential local storage</b> for your preferences ' +
    '(radio, settings). It loads Google Fonts and, if you open them, third-party embeds ' +
    '(the Channel 59 stream and live IRC) that may set their own cookies. ' +
    '<b>No tracking, no analytics, and we never sell your data.</b> ' +
    '<a href="privacy.html" style="color:#CBEE1B;text-decoration:underline;">Privacy &amp; Cookie Policy</a>.';
  bar.appendChild(msg);

  function dismiss() {
    try { localStorage.setItem(KEY, new Date().toISOString()); } catch (e) {}
    if (bar.parentNode) bar.parentNode.removeChild(bar);
  }

  var btn = document.createElement('button');
  btn.textContent = 'Got it';
  btn.style.cssText =
    'flex:0 0 auto;background:#CBEE1B;color:#0A0E1A;border:none;border-radius:6px;' +
    'font-family:"IBM Plex Mono",monospace;font-weight:600;font-size:12px;letter-spacing:1px;' +
    'padding:10px 22px;cursor:pointer;text-transform:uppercase;';
  btn.onclick = dismiss;
  bar.appendChild(btn);

  function mount() { document.body.appendChild(bar); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
