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
  var ADDR = 'Dra35HtSDPBPh4cV58jmTuQSWsyHpR7ZVh8HfxM9tSq7';

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
      font-size: 12px;
      letter-spacing: .04em;
      color: var(--paper-dim, #9AA0AE);
      background: var(--navy2, #0E1426);
      border: 1px solid var(--hair, rgba(237,234,224,.14));
      padding: 8px 14px;
      cursor: pointer;
      transition: color .15s, border-color .15s;
    }
    #bz-donate-btn:hover { color: var(--lime, #AEC44E); border-color: var(--lime, #AEC44E); }
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
    #bz-donate-addr {
      display: block; word-break: break-all;
      background: var(--navy, #0A0E1A); border: 1px solid var(--hair, rgba(237,234,224,.14));
      color: var(--cyan, #2CD4F2); font-size: 13px; padding: 14px; margin-bottom: 16px;
      user-select: all;
    }
    .bz-donate-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .bz-donate-act {
      font-family: inherit; font-size: 12px;
      padding: 11px 18px; cursor: pointer;
      text-transform: uppercase; letter-spacing: .04em; text-decoration: none; border: 1px solid;
    }
    #bz-donate-copy { background: var(--lime, #AEC44E); color: var(--navy, #0A0E1A); border-color: var(--lime, #AEC44E); font-weight: 600; }
    #bz-donate-copy:hover { filter: brightness(1.08); }
    #bz-donate-wallet { background: transparent; color: var(--paper, #EDEAE0); border-color: var(--hair, rgba(237,234,224,.14)); }
    #bz-donate-wallet:hover { border-color: var(--cyan, #2CD4F2); color: var(--cyan, #2CD4F2); }
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
  btn.innerHTML = '&#9829; Support the vault';
  document.body.appendChild(btn);

  var overlay = document.createElement('div');
  overlay.id = 'bz-donate-overlay';
  overlay.innerHTML =
    '<div id="bz-donate-modal">' +
      '<h3>&#9829; Support Project B59</h3>' +
      '<p>Every source in this archive is hosted, hashed, and kept free. Send SOL or Buckazoids to help keep it running:</p>' +
      '<code id="bz-donate-addr">' + ADDR + '</code>' +
      '<div class="bz-donate-row">' +
        '<button id="bz-donate-copy" class="bz-donate-act">Copy Address</button>' +
        '<a id="bz-donate-wallet" class="bz-donate-act" href="solana:' + ADDR + '">Open Wallet</a>' +
      '</div>' +
      '<button id="bz-donate-close">Close</button>' +
    '</div>';
  document.body.appendChild(overlay);

  function open() { overlay.classList.add('open'); }
  function close() { overlay.classList.remove('open'); }

  btn.addEventListener('click', open);
  document.getElementById('bz-donate-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

  document.getElementById('bz-donate-copy').addEventListener('click', function () {
    var b = this;
    navigator.clipboard.writeText(ADDR).then(function () {
      b.textContent = 'Copied!';
      setTimeout(function () { b.textContent = 'Copy Address'; }, 1600);
    }).catch(function () {
      var r = document.createRange(); r.selectNode(document.getElementById('bz-donate-addr'));
      window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
    });
  });
})();
