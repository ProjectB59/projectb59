// ============================================================================
// Project B59 — The Vault · mobile navigation (additive)
// ----------------------------------------------------------------------------
// The design hides `nav.links` at <=960px with no replacement. This injects a
// hamburger button + dropdown that mirrors the existing nav links (so hash
// routing and active states keep working). No changes to the main design CSS.
// ============================================================================
(function () {
  'use strict';
  function init() {
    var header = document.querySelector('header');
    var srcNav = document.querySelector('nav.links');
    if (!header || !srcNav) return;

    var CSS =
      '#b59-burger{display:none;background:none;border:1px solid rgba(203,238,27,.4);border-radius:7px;' +
      'color:var(--lime,#CBEE1B);font-size:20px;line-height:1;padding:6px 11px;cursor:pointer;' +
      'font-family:var(--mono,monospace);margin-left:auto;flex-shrink:0}' +
      '#b59-mnav{display:none;position:fixed;left:0;right:0;z-index:19;' +
      'background:rgba(10,14,26,.98);backdrop-filter:blur(12px);border-bottom:1px solid rgba(203,238,27,.35);' +
      'box-shadow:0 12px 30px rgba(0,0,0,.6);padding:8px 0}' +
      '#b59-mnav.open{display:block}' +
      '#b59-mnav a{display:block;font-family:var(--mono,monospace);font-size:14px;letter-spacing:.06em;' +
      'text-transform:uppercase;color:var(--paper,#EDEAE0);text-decoration:none;padding:14px 22px;' +
      'border-bottom:1px solid rgba(237,234,224,.08)}' +
      '#b59-mnav a:last-child{border-bottom:0}' +
      '#b59-mnav a:active,#b59-mnav a.act{color:var(--lime,#CBEE1B)}' +
      '@media(max-width:960px){#b59-burger{display:inline-block}}' +
      '@media(min-width:961px){#b59-mnav{display:none!important}}';
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    // Hamburger button (lives in the header, after the hidden nav)
    var burger = document.createElement('button');
    burger.id = 'b59-burger';
    burger.setAttribute('aria-label', 'Menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '&#9776;';
    header.appendChild(burger);

    // Dropdown menu — clone the real links so hrefs/labels stay in sync
    var menu = document.createElement('nav');
    menu.id = 'b59-mnav';
    menu.setAttribute('aria-label', 'Mobile navigation');
    srcNav.querySelectorAll('a').forEach(function (a) {
      var link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent;
      link.setAttribute('data-nav-m', a.getAttribute('data-nav') || '');
      link.addEventListener('click', close);
      menu.appendChild(link);
    });
    document.body.appendChild(menu);

    function place() { menu.style.top = Math.round(header.getBoundingClientRect().bottom) + 'px'; }
    function open() { place(); menu.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); }
    function close() { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    function toggle() { menu.classList.contains('open') ? close() : open(); }

    burger.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target) && e.target !== burger) close(); });
    window.addEventListener('resize', function () { if (menu.classList.contains('open')) place(); });
    // reflect active view on the mobile links
    window.addEventListener('hashchange', function () {
      var v = (location.hash || '').replace(/^#\/?/, '').split('/')[0];
      menu.querySelectorAll('a').forEach(function (a) { a.classList.toggle('act', a.getAttribute('data-nav-m') === v); });
    });
  }
  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
