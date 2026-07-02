/**
 * BUCKAZOIDS RADIO
 * Persistent GTA/Fallout-style radio bar — survives page navigation.
 * State (station, volume, playing) is saved to localStorage.
 * Drop one line at the bottom of any HTML page:
 *   <script src="assets/buckazoids-radio.js"></script>
 *
 * Station list: mix of NodeB59 originals + space-vibe internet radio.
 * Spotify playlist embed pops up via the [SP] button.
 */
(function () {
  'use strict';

  // ── Stations ─────────────────────────────────────────────────────────────
  const STATIONS = [
    { id: 'nb59',       name: 'NodeB59 Radio',        dj: 'BOT_ADMIN',        url: 'https://nodeb59.com/bg_music.mp3',                               loop: true  },
    { id: 'defcon',     name: 'DEF CON Radio',         dj: 'SOMA FM',          url: 'https://ice1.somafm.com/defcon-128-mp3'                   },
    { id: 'spacestation', name: 'Space Station Soma',  dj: 'SOMA FM',          url: 'https://ice1.somafm.com/spacestation-128-mp3'             },
    { id: 'groove',     name: 'Groove Salad',          dj: 'SOMA FM',          url: 'https://ice1.somafm.com/groovesalad-128-mp3'              },
    { id: 'lush',       name: 'Lush',                  dj: 'SOMA FM',          url: 'https://ice1.somafm.com/lush-128-mp3'                     },
    { id: 'deepspace',  name: 'Deep Space One',        dj: 'SOMA FM',          url: 'https://ice1.somafm.com/deepspaceone-128-mp3'             },
    { id: 'vgm',        name: 'VGM Radio',             dj: 'RAINWAVE',         url: 'https://rainwave.cc/tune_in/1.ogg'                        },
    { id: 'chiptune',   name: 'Chiptune Radio',        dj: '8BIT FM',          url: 'https://8bitsfm.ru/live/8bitsofm.mp3'                    },
  ];

  // Spotify playlist embed (set to a NodeB59 / Buckazoids curated playlist)
  const SPOTIFY_URI = 'https://open.spotify.com/embed/playlist/37i9dQZF1DXdEhT0i6YJAw?utm_source=generator&theme=0';

  // ── State ─────────────────────────────────────────────────────────────────
  const LS = {
    get: (k, def) => { try { const v = localStorage.getItem('bz_radio_' + k); return v !== null ? JSON.parse(v) : def; } catch { return def; } },
    set: (k, v) => { try { localStorage.setItem('bz_radio_' + k, JSON.stringify(v)); } catch {} },
  };

  let curIdx   = LS.get('idx', 0);
  let vol      = LS.get('vol', 0.75);
  let playing  = false;          // always start silent on page load (autoplay blocked)
  let spOpen   = false;
  let vizTimer = null;

  // ── Audio element ─────────────────────────────────────────────────────────
  const audio = new Audio();
  audio.volume = vol;
  audio.preload = 'none';

  // ── Build UI ──────────────────────────────────────────────────────────────
  const css = `
    #bz-radio {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 99999;
      background: linear-gradient(180deg, #0a0a1a 0%, #000008 100%);
      border-top: 2px solid #00e8ff;
      box-shadow: 0 -4px 24px rgba(0,232,255,0.18);
      font-family: 'VT323', 'Courier New', monospace;
      user-select: none;
      display: flex;
      flex-direction: column;
    }
    #bz-radio-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      height: 40px;
    }
    #bz-radio .bz-logo {
      color: #00e8ff;
      font-size: 18px;
      white-space: nowrap;
      letter-spacing: 1px;
      text-shadow: 0 0 8px #00e8ff;
      flex-shrink: 0;
    }
    #bz-radio .bz-btn {
      background: transparent;
      border: 1px solid #00e8ff44;
      color: #00e8ff;
      font-family: inherit;
      font-size: 16px;
      padding: 0 8px;
      height: 26px;
      cursor: pointer;
      line-height: 1;
      transition: background .15s, border-color .15s;
      flex-shrink: 0;
    }
    #bz-radio .bz-btn:hover { background: #00e8ff22; border-color: #00e8ff; }
    #bz-radio .bz-btn.active { background: #00e8ff33; border-color: #00e8ff; color: #fff; }
    #bz-radio-track {
      flex: 1;
      overflow: hidden;
      min-width: 0;
    }
    #bz-radio-track-inner {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    #bz-radio-name {
      color: #00e8ff;
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #bz-radio-dj {
      color: #00e8ff77;
      font-size: 12px;
      white-space: nowrap;
    }
    #bz-radio-viz {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 22px;
      flex-shrink: 0;
    }
    .bz-bar {
      width: 3px;
      background: #00e8ff;
      border-radius: 1px;
      transition: height .08s;
      box-shadow: 0 0 4px #00e8ff88;
    }
    #bz-radio-vol {
      -webkit-appearance: none;
      appearance: none;
      width: 70px;
      height: 4px;
      background: #00e8ff33;
      outline: none;
      border-radius: 2px;
      cursor: pointer;
      flex-shrink: 0;
    }
    #bz-radio-vol::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px; height: 12px;
      border-radius: 50%;
      background: #00e8ff;
      box-shadow: 0 0 6px #00e8ff;
    }
    #bz-radio-station-list {
      display: none;
      background: #050515;
      border-top: 1px solid #00e8ff33;
      max-height: 220px;
      overflow-y: auto;
    }
    #bz-radio-station-list.open { display: block; }
    .bz-station-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 14px;
      cursor: pointer;
      border-bottom: 1px solid #ffffff08;
      transition: background .12s;
    }
    .bz-station-row:hover { background: #00e8ff11; }
    .bz-station-row.playing { color: #00e8ff; background: #00e8ff18; }
    .bz-station-row .bz-s-num { color: #00e8ff66; font-size: 13px; width: 18px; text-align: right; flex-shrink:0; }
    .bz-station-row .bz-s-name { font-size: 15px; flex: 1; }
    .bz-station-row .bz-s-dj { font-size: 12px; color: #ffffff44; }
    #bz-spotify-panel {
      display: none;
      border-top: 1px solid #00e8ff33;
      background: #050515;
    }
    #bz-spotify-panel.open { display: block; }
    #bz-spotify-panel iframe {
      display: block;
      width: 100%;
      height: 152px;
      border: none;
    }
    #bz-radio-status {
      font-size: 12px;
      color: #ffffff44;
      flex-shrink: 0;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const root = document.createElement('div');
  root.id = 'bz-radio';
  root.innerHTML = `
    <div id="bz-radio-bar">
      <div class="bz-logo">📻 BZ</div>
      <button class="bz-btn" id="bz-prev" title="Previous station">⏮</button>
      <button class="bz-btn" id="bz-play" title="Play / Pause">▶</button>
      <button class="bz-btn" id="bz-next" title="Next station">⏭</button>
      <div id="bz-radio-track">
        <div id="bz-radio-track-inner">
          <div id="bz-radio-name">NODE B59 RADIO</div>
          <div id="bz-radio-dj">SELECT A STATION</div>
        </div>
      </div>
      <div id="bz-radio-viz"></div>
      <span id="bz-radio-status">STOPPED</span>
      <input id="bz-radio-vol" type="range" min="0" max="100" value="${Math.round(vol * 100)}" title="Volume">
      <button class="bz-btn" id="bz-list-btn" title="Stations">☰</button>
      <button class="bz-btn" id="bz-sp-btn" title="Spotify">SP</button>
    </div>
    <div id="bz-radio-station-list"></div>
    <div id="bz-spotify-panel"></div>
  `;
  document.body.appendChild(root);

  // Push page content up so the radio bar doesn't cover the taskbar
  // (index.html has its own taskbar — add padding to body)
  document.body.style.paddingBottom = '40px';

  // ── Refs ──────────────────────────────────────────────────────────────────
  const playBtn   = document.getElementById('bz-play');
  const prevBtn   = document.getElementById('bz-prev');
  const nextBtn   = document.getElementById('bz-next');
  const nameEl    = document.getElementById('bz-radio-name');
  const djEl      = document.getElementById('bz-radio-dj');
  const statusEl  = document.getElementById('bz-radio-status');
  const volEl     = document.getElementById('bz-radio-vol');
  const vizEl     = document.getElementById('bz-radio-viz');
  const listEl    = document.getElementById('bz-radio-station-list');
  const listBtn   = document.getElementById('bz-list-btn');
  const spBtn     = document.getElementById('bz-sp-btn');
  const spPanel   = document.getElementById('bz-spotify-panel');

  // ── Spectrum visualizer ───────────────────────────────────────────────────
  const BAR_COUNT = 20;
  for (let i = 0; i < BAR_COUNT; i++) {
    const b = document.createElement('div');
    b.className = 'bz-bar';
    b.style.height = '3px';
    vizEl.appendChild(b);
  }
  const bars = Array.from(vizEl.children);

  function tickViz() {
    bars.forEach(b => {
      b.style.height = (playing ? 3 + Math.random() * 17 : 2) + 'px';
    });
  }

  // ── Station list render ───────────────────────────────────────────────────
  function renderList() {
    listEl.innerHTML = STATIONS.map((s, i) => `
      <div class="bz-station-row${i === curIdx ? ' playing' : ''}" data-i="${i}">
        <span class="bz-s-num">${i + 1}</span>
        <span class="bz-s-name">${s.name}</span>
        <span class="bz-s-dj">${s.dj}</span>
      </div>
    `).join('');
    listEl.querySelectorAll('.bz-station-row').forEach(row => {
      row.addEventListener('click', () => {
        loadStation(+row.dataset.i, true);
        toggleList(false);
      });
    });
  }

  // ── Core playback ─────────────────────────────────────────────────────────
  function loadStation(idx, autoplay) {
    curIdx = ((idx % STATIONS.length) + STATIONS.length) % STATIONS.length;
    LS.set('idx', curIdx);
    const s = STATIONS[curIdx];
    audio.src = s.url;
    audio.loop = !!s.loop;
    nameEl.textContent = s.name.toUpperCase();
    djEl.textContent   = s.dj;
    renderList();
    if (autoplay) {
      audio.play().catch(() => { statusEl.textContent = 'BLOCKED'; });
    }
  }

  function togglePlay() {
    if (!audio.src || audio.src === window.location.href) {
      loadStation(curIdx, true);
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => { statusEl.textContent = 'BLOCKED'; });
    } else {
      audio.pause();
    }
  }

  // ── Audio events ──────────────────────────────────────────────────────────
  audio.addEventListener('playing', () => {
    playing = true;
    playBtn.textContent = '⏸';
    statusEl.textContent = '► ON AIR';
    if (!vizTimer) vizTimer = setInterval(tickViz, 90);
  });
  audio.addEventListener('pause', () => {
    playing = false;
    playBtn.textContent = '▶';
    statusEl.textContent = 'PAUSED';
  });
  audio.addEventListener('waiting', () => { statusEl.textContent = 'BUFFERING…'; });
  audio.addEventListener('error', () => {
    statusEl.textContent = 'OFFLINE';
    playing = false;
    playBtn.textContent = '▶';
  });
  audio.addEventListener('ended', () => {
    // auto-advance on non-looping streams that end
    if (!STATIONS[curIdx].loop) loadStation(curIdx + 1, true);
  });

  // ── Controls ──────────────────────────────────────────────────────────────
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', () => loadStation(curIdx - 1, playing));
  nextBtn.addEventListener('click', () => loadStation(curIdx + 1, playing));

  volEl.addEventListener('input', () => {
    vol = volEl.value / 100;
    audio.volume = vol;
    LS.set('vol', vol);
  });

  function toggleList(force) {
    const open = force !== undefined ? force : !listEl.classList.contains('open');
    listEl.classList.toggle('open', open);
    listBtn.classList.toggle('active', open);
    if (open) {
      spPanel.classList.remove('open');
      spOpen = false;
      spBtn.classList.remove('active');
    }
  }

  function toggleSpotify() {
    spOpen = !spOpen;
    spPanel.classList.toggle('open', spOpen);
    spBtn.classList.toggle('active', spOpen);
    if (spOpen) {
      listEl.classList.remove('open');
      listBtn.classList.remove('active');
      if (!spPanel.innerHTML.trim()) {
        spPanel.innerHTML = `<iframe src="${SPOTIFY_URI}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
      }
    }
  }

  listBtn.addEventListener('click', () => toggleList());
  spBtn.addEventListener('click', toggleSpotify);

  // ── Init ──────────────────────────────────────────────────────────────────
  loadStation(curIdx, false);   // load metadata but don't autoplay (browser policy)
  renderList();

  // Expose globally so other scripts can control the radio
  window.bzRadio = {
    play: () => audio.play(),
    pause: () => audio.pause(),
    next: () => loadStation(curIdx + 1, true),
    prev: () => loadStation(curIdx - 1, true),
    setStation: (id) => {
      const i = STATIONS.findIndex(s => s.id === id);
      if (i >= 0) loadStation(i, true);
    },
    setVolume: (v) => { audio.volume = v; volEl.value = Math.round(v * 100); },
  };

})();
