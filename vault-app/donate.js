/**
 * NODEB59 DONATE BUTTON
 * Floating heart button -> modal with the Solana donation address + copy.
 * Drop one line at the bottom of any page:
 *   <script src="assets/donate.js"></script>   (top-level pages)
 *   <script src="../assets/donate.js"></script> (pages in a subfolder)
 * Self-contained; no external calls (privacy-friendly).
 */
(function () {
  'use strict';
  var ADDR = '6RUfvE1XvnQQnZfbPNvvPGciR7biJ9ECo24E6kFqzSvw';
  var BTC_ADDR = 'bc1q50l8lg6avn7k0kul9wgvwa6lz30ppkaa8knjd0';
  var LIGHTNING_ADDR = 'purplehare46@aqua.net';

  // Restyled to the vault's own theme tokens; a quiet pill to match the radio,
  // opposite corner so the two never overlap.
  var css = `
    #bz-donate-btn {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 99998;
      display: inline-flex; align-items: center; gap: 7px;
      font-family: var(--mono, 'IBM Plex Mono', monospace);
      font-size: 11px;
      letter-spacing: .04em;
      color: var(--paper, #EDEAE0);
      background: rgba(14,20,38,.96);
      border: 1px solid var(--lime, #AEC44E);
      padding: 9px 13px;
      cursor: pointer;
      transition: color .15s, border-color .15s;
    }
    #bz-donate-btn:hover { color: var(--lime, #AEC44E); border-color: var(--cyan, #2CD4F2); }
    #bz-donate-btn .bz-wallet-short { color: var(--cyan, #2CD4F2); opacity: .9; }
    @media (max-width: 720px) { #bz-donate-btn .bz-wallet-short { display:none; } }
    #bz-donate-overlay {
      position: fixed; inset: 0; z-index: 100000;
      background: rgba(6,9,18,.82);
      display: none; align-items: center; justify-content: center;
    }
    #bz-donate-overlay.open { display: flex; }
    #bz-donate-modal {
      width: 92%; max-width: 460px;
      background: var(--navy2, #0E1426);
      border: 1px solid var(--hair, rgba(237,234,224,.14));
      padding: 30px;
      font-family: var(--mono, 'IBM Plex Mono', monospace);
      color: var(--paper, #EDEAE0);
      text-align: center;
    }
    #bz-donate-modal h3 {
      font-size: 13px; color: var(--lime, #AEC44E); margin: 0 0 10px;
      text-transform: uppercase; letter-spacing: .12em; font-weight: 600;
    }
    #bz-donate-modal p { font-size: 13px; color: var(--paper-dim, #9AA0AE); margin: 0 0 18px; line-height: 1.6; }
    .bz-donate-addr {
      display: block; word-break: break-all;
      background: var(--navy, #0A0E1A); border: 1px solid var(--hair, rgba(237,234,224,.14));
      color: var(--cyan, #2CD4F2); font-size: 13px; padding: 14px; margin: 6px 0 10px;
      user-select: all;
    }
    .bz-donate-label { display:block; margin-top:14px; color:var(--lime,#AEC44E); font-size:11px; text-transform:uppercase; letter-spacing:.08em; text-align:left; }
    .bz-donate-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .bz-donate-act {
      font-family: inherit; font-size: 12px;
      padding: 11px 18px; cursor: pointer;
      text-transform: uppercase; letter-spacing: .04em; text-decoration: none; border: 1px solid;
    }
    .bz-donate-copy { background: var(--lime, #AEC44E); color: var(--navy, #0A0E1A); border-color: var(--lime, #AEC44E); font-weight: 600; }
    .bz-donate-copy:hover { filter: brightness(1.08); }
    .bz-donate-wallet { background: transparent; color: var(--paper, #EDEAE0); border-color: var(--hair, rgba(237,234,224,.14)); }
    .bz-donate-wallet:hover { border-color: var(--cyan, #2CD4F2); color: var(--cyan, #2CD4F2); }
    #bz-donate-close {
      margin-top: 18px; font-family: inherit; font-size: 12px;
      color: var(--paper-dim, #9AA0AE); background: none; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: .06em;
    }
    #bz-donate-close:hover { color: var(--paper, #EDEAE0); }
  `;
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'bz-donate-btn';
  btn.type = 'button';
  btn.innerHTML = '&#9829; Support Project B59 &middot; SOL + BUCKAZOIDS + BTC <span class="bz-wallet-short">&middot; 6RUf&hellip;zSvw</span>';
  document.body.appendChild(btn);

  function placeSupportButton() {
    var radio = document.getElementById('bz-radio');
    var radioPill = document.getElementById('bz-radio-pill');
    var radioHeight = radio && radio.classList.contains('open') ? radio.offsetHeight : 0;
    var pillHeight = radioPill && radioPill.offsetParent !== null ? radioPill.offsetHeight : 0;
    btn.style.bottom = (Math.max(radioHeight, pillHeight) + 18) + 'px';
  }
  placeSupportButton();
  window.addEventListener('resize', placeSupportButton);
  new MutationObserver(placeSupportButton).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  var overlay = document.createElement('div');
  overlay.id = 'bz-donate-overlay';
  overlay.innerHTML =
    '<div id="bz-donate-modal">' +
      '<h3>&#9829; Support Project B59</h3>' +
      '<p>Every source in this archive is hosted, hashed, and kept free. Tips help keep it running.</p>' +
      '<span class="bz-donate-label">SOL + BUCKAZOIDS</span>' +
      '<code id="bz-donate-addr" class="bz-donate-addr">' + ADDR + '</code>' +
      '<div class="bz-donate-row">' +
        '<button id="bz-donate-copy" class="bz-donate-act bz-donate-copy">Copy Address</button>' +
        '<a class="bz-donate-act bz-donate-wallet" href="solana:' + ADDR + '">Open Wallet</a>' +
      '</div>' +
      '<span class="bz-donate-label">Bitcoin on-chain</span>' +
      '<code class="bz-donate-addr">' + BTC_ADDR + '</code>' +
      '<div class="bz-donate-row">' +
        '<button id="bz-copy-btc" class="bz-donate-act bz-donate-copy">Copy BTC</button>' +
        '<a class="bz-donate-act bz-donate-wallet" href="bitcoin:' + BTC_ADDR + '">Open Wallet</a>' +
      '</div>' +
      '<span class="bz-donate-label">Bitcoin / Lightning tips</span>' +
      '<code class="bz-donate-addr">' + LIGHTNING_ADDR + '</code>' +
      '<div class="bz-donate-row"><button id="bz-copy-lightning" class="bz-donate-act bz-donate-copy">Copy Lightning</button></div>' +
      '<button id="bz-donate-close">Close</button>' +
    '</div>';
  document.body.appendChild(overlay);

  function open() { overlay.classList.add('open'); }
  function close() { overlay.classList.remove('open'); }

  btn.addEventListener('click', open);
  var navSupport = document.getElementById('support-nav-link');
  if (navSupport) navSupport.addEventListener('click', open);
  document.getElementById('bz-donate-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

  function wireCopy(id, value) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function () {
      var b = this, original = b.textContent;
      navigator.clipboard.writeText(value).then(function () {
        b.textContent = 'Copied!';
        setTimeout(function () { b.textContent = original; }, 1600);
      }).catch(function () {});
    });
  }
  wireCopy('bz-donate-copy', ADDR);
  wireCopy('bz-copy-btc', BTC_ADDR);
  wireCopy('bz-copy-lightning', LIGHTNING_ADDR);
})();
