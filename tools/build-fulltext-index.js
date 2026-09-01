#!/usr/bin/env node
// Project B59 — builds vault-app/fulltext-index.json: record id -> array of
// body paragraphs, extracted from each record's primary HTML entry file.
// Static build step, run manually when content changes; the client never
// parses HTML, it only ever fetches this JSON. PDF/video/image entry files
// have no extractable body text and are skipped (metadata search still
// covers them).
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var ENTITIES = {
  amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ',
  mdash:'—', ndash:'–', lsquo:'‘', rsquo:'’',
  ldquo:'“', rdquo:'”', hellip:'…'
};
function decodeEntities(s){
  return s.replace(/&#(\d+);/g, function(_, n){ return String.fromCharCode(+n); })
          .replace(/&#x([0-9a-f]+);/gi, function(_, n){ return String.fromCharCode(parseInt(n,16)); })
          .replace(/&(\w+);/g, function(m, name){ return ENTITIES.hasOwnProperty(name) ? ENTITIES[name] : m; });
}
function htmlToParagraphs(html){
  var s = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|head|nav|footer)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote|pre)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  var paras = s.split(/\n+/).map(function(p){ return p.replace(/\s+/g,' ').trim(); })
    .filter(function(p){ return p.length >= 40 && p.split(' ').length >= 7; });
  // drop consecutive dupes (repeated boilerplate) and cap total body size —
  // this is a search index, not a mirror; keep it to a few hundred KB total.
  var out = [], prev = null, chars = 0, CAP = 2600;
  for(var i=0;i<paras.length;i++){
    if(paras[i]===prev) continue;
    if(chars + paras[i].length > CAP) break;
    out.push(paras[i]); chars += paras[i].length; prev = paras[i];
  }
  return out;
}

var src = fs.readFileSync(path.join(ROOT, 'vault-app/records.js'), 'utf8')
  .replace(/^window\.B59_RECORDS\s*=\s*/, '').replace(/;\s*$/, '');
var records = JSON.parse(src);

var index = {};
var stats = { indexed:0, skippedNoHtml:0, skippedMissing:0 };
records.forEach(function(r){
  var files = r.files || [];
  var entry = files.filter(function(f){ return f.entry; })[0] || files[0];
  if(!entry || !/\.(html?|mht)$/i.test(entry.path)){ stats.skippedNoHtml++; return; }
  var fp = path.join(ROOT, r.content_path || ('content/' + r.id), entry.path);
  if(!fs.existsSync(fp)){ stats.skippedMissing++; return; }
  var raw = fs.readFileSync(fp, 'utf8');
  var paras = htmlToParagraphs(raw);
  if(!paras.length){ stats.skippedNoHtml++; return; }
  index[r.id] = paras;
  stats.indexed++;
});

var outPath = path.join(ROOT, 'vault-app/fulltext-index.json');
fs.writeFileSync(outPath, JSON.stringify(index));
var kb = (fs.statSync(outPath).size/1024).toFixed(1);
console.log('Indexed', stats.indexed, 'records ('+kb+' KB). Skipped', stats.skippedNoHtml, 'no-html/empty,', stats.skippedMissing, 'missing file.');
