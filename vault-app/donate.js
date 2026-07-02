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

  var css = `
    #bz-donate-btn {
      position: fixed;
      right: 18px;
      bottom: 52px;               /* clears the radio bar */
      z-index: 99998;
      font-family: 'Press Start 2P', 'VT323', monospace;
      font-size: 11px;
      letter-spacing: 1px;
      color: #1a1200;
      background: linear-gradient(180deg, #ffe14d 0%, #fce803 55%, #d9a900 100%);
      border: 2px solid #7a5c00;
      border-radius: 8px;
      padding: 10px 14px;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.6);
      text-transform: uppercase;
      transition: transform .12s, box-shadow .12s;
    }
    #bz-donate-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(252,232,3,0.4); }
    #bz-donate-overlay {
      position: fixed; inset: 0; z-index: 100000;
      background: rgba(0,0,0,0.78);
      display: none; align-items: center; justify-content: center;
    }
    #bz-donate-overlay.open { display: flex; }
    #bz-donate-modal {
      width: 92%; max-width: 460px;
      background: linear-gradient(180deg, #0d1220, #060910);
      border: 2px solid #fce803;
      border-radius: 12px;
      box-shadow: 0 0 30px rgba(252,232,3,0.25);
      padding: 22px;
      font-family: 'VT323', 'Courier New', monospace;
      color: #e6e6e6;
      text-align: center;
    }
    #bz-donate-modal h3 {
      font-family: 'Press Start 2P', monospace;
      font-size: 14px; color: #fce803; margin: 0 0 6px;
      text-transform: uppercase; letter-spacing: 1px;
    }
    #bz-donate-modal p { font-size: 17px; color: #aab; margin: 0 0 16px; }
    #bz-donate-addr {
      display: block; word-break: break-all;
      background: #000; border: 1px solid #2a3a50; border-radius: 6px;
      color: #00e8ff; font-size: 16px; padding: 12px; margin-bottom: 14px;
      user-select: all;
    }
    .bz-donate-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .bz-donate-act {
      font-family: 'Press Start 2P', monospace; font-size: 10px;
      padding: 11px 14px; border-radius: 6px; cursor: pointer;
      text-transform: uppercase; text-decoration: none; border: 2px solid;
    }
    #bz-donate-copy { background: #fce803; color: #000; border-color: #7a5c00; }
    #bz-donate-copy:hover { filter: brightness(1.08); }
    #bz-donate-wallet { background: transparent; color: #00e8ff; border-color: #00e8ff; }
    #bz-donate-wallet:hover { background: rgba(0,232,255,0.12); }
    #bz-donate-close {
      margin-top: 16px; font-family: 'VT323', monospace; font-size: 15px;
      color: #778; background: none; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
    }
    #bz-donate-close:hover { color: #fff; }
  `;
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'bz-donate-btn';
  btn.innerHTML = '&#9829; DONATE';
  document.body.appendChild(btn);

  var overlay = document.createElement('div');
  overlay.id = 'bz-donate-overlay';
  overlay.innerHTML =
    '<div id="bz-donate-modal">' +
      '<h3>&#9829; Support NodeB59</h3>' +
      '<p>Send SOL or Buckazoids to keep the arcade running:</p>' +
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
