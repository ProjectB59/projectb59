# ProjectB59

**A retro arcade + Solana ecosystem built for sovereignty and fun.**

NodeB59 is a self-hosted gaming arcade powered by **Buckazoids** (native Solana token). Free to play; 1 BZ to enter tournaments. Monthly prize pools split 50/30/20 across the top 3 winners.

## Core Projects

### 🎮 [NodeB59 Arcade](https://github.com/ProjectB59/nodeb59)
Static site hosting curated retro games (Colossal Cave Adventure, ASCII roguelike, strategy classics). Leaderboards, entry fees, wallet integration. Built for quick load times and zero backend complexity on the arcade side.

### 🌍 [World of Claudecraft](https://github.com/ProjectB59/world-of-claudecraft)
Multiplayer MMO with space-reskin theme. Self-hosted server running on a DigitalOcean droplet. Deployed at `claudecraft.nodeb59.com` with full HTTPS + Caddy reverse proxy. Independent world with postgres backend (can also connect to the official WoC mainnet).

### 📺 [Channel 59](https://nodeb59.com/channel59.html)
24/7 livestream powered by Owncast (self-hosted RTMP ingest). HLS output to a static web player. Rotating clips: crypto docs, Buckazoids promos, conference recordings, music. Part of the NodeB59 arcade site.

### 🎵 [Buckazoids Radio](https://github.com/ProjectB59/nodeb59)
Ambient background music + dynamic playlist system. Integrated into arcade pages and other NodeB59 sites.

## Philosophy

**Sovereignty-first.** No managed platforms (Supabase, Firebase). Everything self-hosted on DigitalOcean droplets or deployed as static HTML. Solana-first for payments and token rewards.

**Simple > Complex.** The arcade is static HTML + JavaScript. Games run client-side. Leaderboards are optional (you can play for fun, not just rank). Tournaments have real prize pools funded by entry fees.

**Community-owned.** Buckazoids are the community token. Monthly tournaments + treasure hunts fund the creator of the "Game of the Month." Players earn on skill, not random drops.

## Getting Started (Development)

All repos are **private for now** (easier to iterate). Public access available on request for contributors.

### Prerequisites
- Node.js 20+
- Git
- Solana CLI (for testing transactions)
- DigitalOcean account (if deploying backend services)

### Key Environment Variables
```
VITE_SUPABASE_URL        # (legacy; being phased out in favor of self-hosted)
SOLANA_RPC_ENDPOINT      # https://api.mainnet-beta.solana.com (or Helius)
BUCKAZOID_MINT           # BQQzEvYT4knThhkSPBvSKBLg1LEczisWLhx5ydJipump
TREASURY_WALLET          # Dra35HtSDPBPh4cV58jmTuQSWsyHpR7ZVh8HfxM9tSq7 (personal donate address)
```

### Repo Structure
```
ProjectB59/
├── nodeb59                    # Main arcade site (static + JS)
├── world-of-claudecraft       # Space-reskin MMO fork
├── b59-streamers              # Channel 59 stream scripts (Owncast)
└── (other experimental projects)
```

## Infrastructure

**Arcade & Channel 59:** Static files hosted on DigitalOcean + Caddy reverse proxy.
**World of Claudecraft:** Docker Compose (postgres + Node game server + Caddy), droplet 68.183.104.118.
**Stream:** OBS → Owncast RTMP ingest, HLS playout, 24/7 loop via ffmpeg concat.

All under Cloudflare proxy (orange cloud on main domain for DDoS protection).

## Current Status (as of July 2026)

✅ **Live:**
- NodeB59 arcade (nodeb59.com)
- Buckazoids Radio
- Channel 59 (24/7 stream)
- World of Claudecraft (claudecraft.nodeb59.com, space-reskinned)

🚧 **In Progress:**
- Making space reskin visible (i18n class name rework)
- Connecting space client to official WoC mainnet
- Adding Game of the Month tournament structure
- www.projectb59.com SSL cert (DNS migration)

## Donations

Support NodeB59 development:
- **Solana:** `Dra35HtSDPBPh4cV58jmTuQSWsyHpR7ZVh8HfxM9tSq7`
- **Buckazoids:** Send to the arcade treasury (see nodeb59.com footer)

## Security Notes

- ✅ 2FA enabled on all accounts (authenticator, not SMS)
- ✅ SSH key-only (no password login on droplets)
- ✅ Firewall: 22/80/443 + 1935 (RTMP) only
- ✅ Auto-updates + fail2ban on both droplets
- ✅ Cloudflare WAF + Bot Fight Mode enabled

No seed phrases or private keys stored on servers.

## Contact

- **Twitter/X:** [@ProjectB59](https://x.com/projectb59)
- **Discord:** [Buckazoids Community](link-to-server)
- **Email:** kat@projectb59.com

---

Built for fun, sovereignty, and the cypherpunk spirit. 🎮⛓️
