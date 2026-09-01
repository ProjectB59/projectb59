// Project B59 — People: the lineage roster and author pages.
// Bios are seeded from the ecosystem litepaper's person-cards, written to house
// tone (no em-dashes). Record association is computed live against
// window.B59_RECORDS by matching each person's alias list against a record's
// `author` string, so this stays correct as records are added, no generated
// file to go stale. External links are hand-curated primary/biographical
// sources, not vault records.
(function(){
'use strict';
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };

var PEOPLE = [
{slug:'whitfield-diffie', name:'Whitfield Diffie', role:'Cryptographer', dates:'b. 1944', aliases:['Diffie'],
 bio:['American cryptographer. With Martin Hellman he published "New Directions in Cryptography" in 1976, introducing public-key cryptography and the key exchange that carries both their names, and ending the assumption that secure communication required a secret shared in advance. He spent the following decades arguing against key escrow and export limits, testifying repeatedly against the Clipper chip.'],
 ext:[['stanford.edu/~hellman profile','ee.stanford.edu']]},
{slug:'martin-hellman', name:'Martin Hellman', role:'Cryptographer, Stanford', dates:'b. 1945', aliases:['Hellman'],
 bio:['American cryptographer and Stanford professor, co-author of "New Directions in Cryptography" (1976). He insisted that cryptographic research belonged in the open literature at a time when the NSA held the opposite view, and defended the right to publish it. His later work turned to reducing the risk of nuclear war.'],
 ext:[]},
{slug:'ralph-merkle', name:'Ralph Merkle', role:'Cryptographer', dates:'b. 1952', aliases:['Merkle'],
 bio:['American computer scientist. As a Berkeley undergraduate he devised Merkle’s Puzzles (1974), an early route to public-key exchange, then invented cryptographic hash trees, the structure that lets a system commit to a large dataset and later prove any single entry with a small proof. Every blockchain uses it.'],
 ext:[['merkle.com','merkle.com']]},
{slug:'ron-rivest', name:'Ron Rivest', role:'Cryptographer, MIT', dates:'b. 1947', aliases:['Rivest'],
 bio:['MIT cryptographer, the R in RSA, the first practical public-key cryptosystem (1977). He designed the MD family of hash functions and the RC ciphers, and later proposed lightweight micropayment schemes including PayWord, MicroMint, and Peppercoin.'],
 ext:[['people.csail.mit.edu/rivest','people.csail.mit.edu']]},
{slug:'david-chaum', name:'David Chaum', role:'Founder of digital cash', dates:'b. 1955', aliases:['Chaum'],
 bio:['American cryptographer and the founder of digital cash. His 1981 paper defined the mix network for anonymous communication; his 1982 blind-signature paper made untraceable electronic payments possible. He founded DigiCash in 1989. His designs are the direct ancestor of every privacy-preserving payment system that followed.'],
 ext:[['chaum.com','chaum.com']]},
{slug:'cynthia-dwork-moni-naor', name:'Cynthia Dwork & Moni Naor', role:'Cryptographers', dates:'', aliases:['Dwork','Naor'],
 bio:['Cryptographers whose 1992 paper "Pricing via Processing, or Combatting Junk Mail" proposed making a sender compute a moderately hard function before a message would be accepted. That idea, a provable computational cost as a brake on abuse, is the root of Hashcash and of Bitcoin mining. Dwork went on to found differential privacy.'],
 ext:[]},
{slug:'eric-hughes', name:'Eric Hughes', role:'Cypherpunks co-founder', dates:'b. 1968', aliases:['Eric Hughes'],
 bio:['Mathematician and a co-founder of the Cypherpunks in 1992 with Tim May and John Gilmore. He wrote "A Cypherpunk’s Manifesto" (1993) and its line "Cypherpunks write code," ran one of the first anonymous remailers, and hosted the early physical meetings.'],
 ext:[['A Cypherpunk’s Manifesto, 1993','activism.net']]},
{slug:'tim-may', name:'Tim May', role:'Cypherpunks co-founder', dates:'1951–2018', aliases:['Tim May','Timothy C. May','Timothy May'],
 bio:['Former Intel physicist and a co-founder of the Cypherpunks. His "Crypto Anarchist Manifesto" (1988), read out at Crypto ’88, argued that strong cryptography would let people transact and associate beyond the reach of the state. He compiled the Cyphernomicon, the movement’s enormous FAQ, and posted to the list until his death in 2018.'],
 ext:[]},
{slug:'john-gilmore', name:'John Gilmore', role:'EFF co-founder', dates:'b. 1955', aliases:['John Gilmore'],
 bio:['Programmer, EFF co-founder, and the fifth employee of Sun Microsystems. A Cypherpunks co-founder, he funded and ran list infrastructure, built the EFF’s DES Cracker to prove 56-bit keys were breakable, and backed the court cases that established source code as protected speech. "The Net interprets censorship as damage and routes around it" is his.'],
 ext:[['toad.com','toad.com']]},
{slug:'phil-zimmermann', name:'Phil Zimmermann', role:'Creator of PGP', dates:'b. 1954', aliases:['Zimmermann'],
 bio:['Author of PGP, released as free software in 1991, which put strong encrypted mail within reach of anyone with a modem. The US government opened a three-year criminal investigation into its spread and never charged him. He kept shipping, and testified to the Senate in 1996 as export rules began to give way.'],
 ext:[['philzimmermann.com','philzimmermann.com']]},
{slug:'jude-milhon', name:'Jude Milhon', role:'"St. Jude", coined "cypherpunk"', dates:'1939–2003', aliases:['Milhon','St. Jude'],
 bio:['Writer, programmer, and activist known as St. Jude. She coined the word cypherpunk. A member of the 1970s Community Memory project and later a senior editor at Mondo 2000, she pressed the movement to stay human and inclusive as much as technical.'],
 ext:[]},
{slug:'julian-assange', name:'Julian Assange', role:'Cypherpunk, WikiLeaks founder', dates:'b. 1971', aliases:['Assange'],
 bio:['Australian programmer who contributed to the cypherpunks list in the mid-1990s under the name proff. He wrote the Rubberhose deniable-encryption system and the essays "State and Terrorist Conspiracies" and "Conspiracy as Governance," which set out the reasoning behind WikiLeaks, founded in 2006.'],
 ext:[]},
{slug:'lance-cottrell', name:'Lance Cottrell', role:'Creator of Mixmaster', dates:'', aliases:['Cottrell'],
 bio:['He built Mixmaster in 1995, the most robust anonymous remailer of its time, adding message padding and reordering to defeat traffic analysis, and founded Anonymizer the same year. His work is the practical bridge from Chaum’s mix-network theory to deployed anonymity systems.'],
 ext:[]},
{slug:'morningstar-farmer', name:'Chip Morningstar & Randy Farmer', role:'Designers of Habitat', dates:'', aliases:['Morningstar','Farmer'],
 bio:['Designers of Lucasfilm’s Habitat (1986), the first graphical multi-user world with persistent avatars, virtual property, and a player-run economy. Their 1990 paper "The Lessons of Lucasfilm’s Habitat" set out principles for large online societies decades before the word metaverse existed. Both later worked on object-capability security.'],
 ext:[]},
{slug:'friedrich-hayek', name:'Friedrich Hayek', role:'Economist, Nobel laureate', dates:'1899–1992', aliases:['Hayek'],
 bio:['Austrian-British economist and Nobel laureate. "The Use of Knowledge in Society" (1945) argued that no central authority can hold the dispersed knowledge a price system coordinates. "Denationalisation of Money" (1976) proposed competing private currencies, the theoretical case digital-cash designers would later draw on.'],
 ext:[]},
{slug:'george-selgin', name:'George Selgin', role:'Free-banking economist', dates:'', aliases:['Selgin'],
 bio:['Monetary economist and a leading scholar of free banking. His idea of synthetic commodity money describes an asset that is scarce like a commodity but backed by neither metal nor a state, close to how Bitcoin is structured.'],
 ext:[]},
{slug:'lawrence-white', name:'Lawrence H. White', role:'Free-banking economist', dates:'', aliases:['Lawrence H. White','Lawrence White'],
 bio:['Economist and historian of free banking. His study of competitive private banknotes in nineteenth-century Scotland and Britain showed decentralised banking working without a central coordinator. His 1996 paper "The Technology Revolution and Monetary Evolution" anticipated private digital money.'],
 ext:[]},
{slug:'adam-back', name:'Adam Back', role:'Inventor of Hashcash', dates:'b. 1970', aliases:['Adam Back'],
 bio:['British cryptographer. He invented Hashcash in 1997, a proof-of-work stamp to price email and deter spam, which the Bitcoin whitepaper cites as the ancestor of the mining mechanism. A long-time contributor to the cypherpunks list, and still building.'],
 ext:[['hashcash.org','hashcash.org']]},
{slug:'wei-dai', name:'Wei Dai', role:'Author of b-money', dates:'', aliases:['Wei Dai'],
 bio:['Cryptographer and author of b-money (1998), a proposal for anonymous distributed electronic cash with collective ledger-keeping, cited by Satoshi as prior art. He wrote the Crypto++ library and corresponded with Nakamoto before the Bitcoin release.'],
 ext:[['weidai.com','weidai.com']]},
{slug:'nick-szabo', name:'Nick Szabo', role:'Coined "smart contracts"', dates:'b. 1964', aliases:['Nick Szabo'],
 bio:['Legal scholar and cryptographer. He coined the term smart contracts in the mid-1990s and designed Bit Gold (1998), a proof-of-work chain of unforgeable value that is the closest single precursor to Bitcoin’s architecture. His essays on money, trust, and law are preserved here in depth.'],
 ext:[]},
{slug:'hal-finney', name:'Hal Finney', role:'PGP 2.0, RPOW', dates:'1956–2014', aliases:['Hal Finney'],
 bio:['PGP 2.0 core developer, cypherpunk remailer operator, and creator of RPOW (2004), the first reusable proof-of-work system. He ran Bitcoin the week it launched and received the first transaction Satoshi sent. Diagnosed with ALS in 2009, he kept working until his death in 2014 and is cryonically preserved.'],
 ext:[['nakamotoinstitute.org/finney','nakamotoinstitute.org']]},
{slug:'phil-salin', name:'Phil Salin', role:'Founder of AMIX', dates:'d. 1991', aliases:['Phil Salin'],
 bio:['Extropian and founder of AMIX, the American Information Exchange, an early attempt at an online market for information and expertise. In the late 1980s he argued that networked markets would change how knowledge is priced and traded. He died in 1991, before the technology caught up.'],
 ext:[]},
{slug:'james-donald', name:'James Donald', role:'Cypherpunk, digital-cash analyst', dates:'', aliases:['James A. Donald','James Donald'],
 bio:['A cypherpunks list contributor who published detailed analyses of distributed electronic cash and web-of-trust design in the mid-1990s. His 2008 exchange with Satoshi on the cryptography list, questioning whether the design would scale, is among the earliest recorded responses to Bitcoin from outside.'],
 ext:[]},
{slug:'john-perry-barlow', name:'John Perry Barlow', role:'EFF co-founder', dates:'1947–2018', aliases:['Barlow'],
 bio:['Founding member of the Electronic Frontier Foundation, Grateful Dead lyricist, and author of "A Declaration of the Independence of Cyberspace" (1996). His essays "The Economy of Ideas" and "Selling Wine Without Bottles" argued that the economics of information would not survive being treated like physical property.'],
 ext:[]},
{slug:'eff', name:'Electronic Frontier Foundation', role:'Digital civil liberties', dates:'f. 1990', aliases:['Electronic Frontier Foundation','EFF'],
 bio:['Founded in 1990 by John Perry Barlow, John Gilmore, and Mitch Kapor to defend civil liberties as they moved online. It litigated the cases that freed cryptography from export control, published "Cracking DES" to disprove the government’s key-length claims, and remains the movement’s legal arm.'],
 ext:[['eff.org','eff.org']]},
{slug:'max-more', name:'Max More', role:'Founder, Extropy Institute', dates:'b. 1964', aliases:['Max More'],
 bio:['Philosopher who founded the Extropy Institute and wrote "The Principles of Extropy," the statement of practical optimism, self-direction, and technological progress that gave the extropian community, and much of the cypherpunk milieu around it, a shared vocabulary.'],
 ext:[]},
{slug:'satoshi-nakamoto', name:'Satoshi Nakamoto', role:'Creator of Bitcoin', dates:'', aliases:['Satoshi Nakamoto'],
 bio:['Pseudonymous author of "Bitcoin: A Peer-to-Peer Electronic Cash System" (2008), the vault’s keystone record, B59-000. Corresponded with Wei Dai, James Donald, Hal Finney, and Martti Malmi through 2009 and 2010 before withdrawing from the project.'],
 ext:[]},
{slug:'martti-malmi', name:'Martti Malmi', role:'Second Bitcoin developer', dates:'', aliases:['Martti Malmi'],
 bio:['Known online as Sirius, the second person to contribute code to Bitcoin. His 2009 to 2011 email correspondence with Satoshi Nakamoto, released in 2024 as evidence in the COPA v. Wright trial, is preserved here in full.'],
 ext:[['mmalmi.github.io/satoshi','mmalmi.github.io']]},
{slug:'stuart-haber-scott-stornetta', name:'Stuart Haber & W. Scott Stornetta', role:'Timestamping', dates:'', aliases:['Haber','Stornetta'],
 bio:['Cryptographers whose 1991 paper "How to Time-Stamp a Digital Document" chained records by hash so that no timestamp could be changed without breaking every one after it. Cited in the Bitcoin whitepaper.'],
 ext:[]},
{slug:'len-sassaman', name:'Len Sassaman', role:'Mixmaster maintainer', dates:'1980–2011', aliases:['Sassaman'],
 bio:['Cryptographer, maintainer of the Mixmaster remailer, and co-designer of Mixminion. A tireless defender of anonymity infrastructure. He died in 2011.'],
 ext:[]},
{slug:'zooko-wilcox', name:'Zooko Wilcox-O’Hearn', role:'Tahoe-LAFS, Zcash founder', dates:'', aliases:['Zooko'],
 bio:['A DigiCash engineer who went on to build Tahoe-LAFS and to found Zcash. Zooko’s Triangle names the apparent trade-off between names that are secure, decentralised, and human-meaningful.'],
 ext:[]},
{slug:'ian-grigg', name:'Ian Grigg', role:'Financial cryptographer', dates:'', aliases:['Ian Grigg'],
 bio:['Financial cryptographer, author of "The Ricardian Contract" and "Financial Cryptography in Seven Layers," and an early builder of digital value-transfer systems.'],
 ext:[['iang.org','iang.org']]},
{slug:'mark-miller', name:'Mark S. Miller', role:'Designer of the E language', dates:'', aliases:['Mark Miller','Mark S. Miller'],
 bio:['Designer of the E language and of object-capability security, co-author of "High Tech Hayekians," and a theorist of agoric, market-based computation.'],
 ext:[]},
{slug:'steven-levy', name:'Steven Levy', role:'Chronicler of the cypherpunks', dates:'', aliases:['Steven Levy'],
 bio:['Journalist whose 1993 WIRED feature "Crypto Rebels" introduced the cypherpunks to a wide public, and whose book "Crypto" (2001) remains the standard popular history of the movement.'],
 ext:[]},
{slug:'satoshi-uesaka', name:'Satoshi Uesaka', role:'Game Arts, Thexder', dates:'', aliases:['Satoshi Uesaka'],
 bio:['Japanese game developer at Game Arts in the 1980s: graphic and mechanical design on Thexder (1985) and Silpheed (1986), and director of Fire Hawk: Thexder – The Second Contact (1989).'],
 ext:[['MobyGames credits','mobygames.com']]}
];

var built = false;

function recordsFor(person){
  var R = window.B59_RECORDS || [];
  return R.filter(function(r){
    var a = (r.author||'');
    return person.aliases.some(function(al){ return a.toLowerCase().indexOf(al.toLowerCase())>=0; });
  });
}

function roster(){
  var host = document.getElementById('people-body');
  document.getElementById('person-heading').textContent = 'People';
  document.getElementById('person-sub').textContent = 'Everyone the vault’s own materials are traced back to. Each profile links their records here and their primary sources elsewhere.';
  var cards = PEOPLE.map(function(p){
    var recs = recordsFor(p);
    return '<div class="p-card" data-slug="'+p.slug+'">'+
      '<div class="nm">'+esc(p.name)+'</div>'+
      '<div class="role">'+esc(p.role)+(p.dates?' · '+esc(p.dates):'')+'</div>'+
      '<div class="stat"><b>'+recs.length+'</b> record'+(recs.length===1?'':'s')+' in the vault</div>'+
    '</div>';
  }).join('');
  host.innerHTML = '<div class="roster-grid">'+cards+'</div>';
  host.querySelectorAll('.p-card').forEach(function(c){
    c.addEventListener('click', function(){ location.hash = '#/people/'+c.getAttribute('data-slug'); });
  });
}

function openPerson(slug){
  var p = PEOPLE.filter(function(x){ return x.slug===slug; })[0];
  var host = document.getElementById('people-body');
  if(!p){ roster(); return; }
  var recs = recordsFor(p);
  document.getElementById('person-heading').textContent = p.name;
  document.getElementById('person-sub').textContent = p.role + (p.dates?' · '+p.dates:'');
  var recRows = recs.slice(0,12).map(function(r){
    return '<article class="rec" data-id="'+r.id+'"><div class="call">'+r.id+'<span class="era">'+esc((r.date||'').slice(0,4))+'</span></div>'+
      '<div><div class="title">'+esc(r.title)+'</div>'+
      '<div class="meta">'+(r.local?'<span class="off-badge">● hosted copy</span>':(r.external_url?'<span class="pend-badge">↗ linked</span>':'<span class="pend-badge">○ source pending</span>'))+'</div></div></article>';
  }).join('') || '<p style="color:var(--paper-dim);font-family:var(--mono);font-size:13px">No records matched by author string yet. If this looks wrong, the alias list in people.js may need a name variant added.</p>';
  var ext = (p.ext||[]).map(function(e){ return '<a href="https://'+e[1]+'" target="_blank" rel="noopener">'+esc(e[0])+' <span class="dom">'+esc(e[1])+' ↗</span></a>'; }).join('');
  host.innerHTML =
    '<a href="#/people" style="font-family:var(--mono);font-size:12px;color:var(--paper-dim)">← all people</a>'+
    '<div class="person-grid">'+
      '<div class="person-bio">'+p.bio.map(function(par){ return '<p>'+par+'</p>'; }).join('')+'</div>'+
      '<div class="person-glance"><h4>At a glance</h4><dl>'+
        '<dt>Records here</dt><dd>'+recs.length+'</dd>'+
        '<dt>Hosted copies</dt><dd>'+recs.filter(function(r){return r.local;}).length+'</dd>'+
      '</dl></div>'+
    '</div>'+
    (recs.length?'<div class="person-sect">Records in this archive · '+recs.length+'</div>'+recRows:'')+
    (ext?'<div class="person-sect">Primary sources elsewhere</div><div class="person-ext">'+ext+'</div>':'')+
  '';
  host.querySelectorAll('.rec').forEach(function(a){
    a.addEventListener('click', function(){ location.hash = '#/record/'+a.getAttribute('data-id'); });
  });
}

function ensure(){
  var h = (location.hash||'').replace(/^#\/?/,'').split('/');
  if(h[0]==='people' && h[1]) openPerson(h[1]); else roster();
}

window.B59People = { ensure: ensure, openPerson: openPerson, list: PEOPLE };
})();
