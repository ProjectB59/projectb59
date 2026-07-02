// Extropian Vault — embedded thread data
// Source: ProjectB59/projectb59 vault.html reader (demo seed threads).
// When vault_data/ (from vault_scraper.py) is uploaded alongside this site,
// the reader upgrades itself automatically via fetch.
window.B59_EXTROPY = {
  note: "Seed sample of the Extropy-Chat archive. Run vault_scraper.py and publish vault_data/ to unlock the full mirror.",
  authors: {
    "Hal Finney": { message_count: 847, priority: true },
    "Nick Szabo": { message_count: 312, priority: true },
    "Eliezer Yudkowsky": { message_count: 1204, priority: true },
    "Max More": { message_count: 503, priority: false }
  },
  threads: [
    {
      thread_id: "ext-1",
      subject: "Re: digital cash and privacy",
      month: "2004-January",
      message_count: 7,
      has_priority: true,
      messages: [
        {
          id: "ext-1-1", author: "Hal Finney <hal@finney.org>", author_short: "Hal Finney",
          subject: "Re: digital cash and privacy",
          date: "Sat, 03 Jan 2004 14:22:00 -0800",
          body: "This is a fascinating area where cryptography meets economics.\n\nThe key insight from Chaum's original work is that you can have\n*unconditional* payer anonymity while still preventing double-spending.\nThe mint learns nothing about who spent what — only that a coin\nwas redeemed.\n\n> But doesn't the mint still learn something about aggregate flows?\n\nYes, but aggregate statistics are a much weaker disclosure than\nindividual transaction graphs. Compare: knowing that 10,000 people\nbought coffee today vs. knowing that Alice bought coffee at 8:14am.\n\nThe real challenge is the mint itself. If the mint fails or turns\nmalicious, the whole system collapses. This is why I find Wei Dai's\nb-money idea so interesting — the mint is replaced by proof-of-work...\n\nHal",
          priority: true
        },
        {
          id: "ext-1-2", author: "Nick Szabo <szabo@foo.net>", author_short: "Nick Szabo",
          subject: "Re: digital cash and privacy",
          date: "Sat, 03 Jan 2004 18:45:00 -0500",
          body: "Hal raises an important point about mint centralization.\n\nIn my Bit Gold proposal I tried to address this with a property\nregistry maintained by the same Byzantine-fault-tolerant mechanism.\nThe key is separating the proof-of-work (objective) from the\nvaluation/exchange (subjective social layer).\n\nThe property rights angle matters here too — without clear ownership\nsemantics baked into the protocol, you end up relying on social/legal\nenforcement, which is exactly what digital cash should transcend.\n\nNick",
          priority: true
        },
        {
          id: "ext-1-3", author: "Max More <max@maxmore.com>", author_short: "Max More",
          subject: "Re: digital cash and privacy",
          date: "Sun, 04 Jan 2004 09:12:00 -0700",
          body: "Both of you are touching on something that the extropian community has\nbeen circling since the early 90s: the infrastructure of freedom.\n\nFinancial privacy is not a luxury. It's a prerequisite for political\nautonomy in any society where economic participation is unavoidable.\n\nI recall Tim's point at the first cypherpunks meeting — you can pass\nall the privacy laws you want, but if the payment layer is legible,\nyou have no real privacy. The architecture *is* the policy.\n\nMax",
          priority: false
        }
      ]
    },
    {
      thread_id: "ext-2",
      subject: "Reusable proofs of work",
      month: "2004-August",
      message_count: 12,
      has_priority: true,
      messages: [
        {
          id: "ext-2-1", author: "Hal Finney <hal@finney.org>", author_short: "Hal Finney",
          subject: "Reusable proofs of work",
          date: "Sat, 15 Aug 2004 10:03:00 -0800",
          body: "I've been thinking about a system I call RPOW — Reusable Proofs of Work.\n\nThe basic idea: hashcash tokens are single-use. You mint one by doing\ncomputational work, but once you hand it to someone, they can't use it\nagain without trusting you not to double-spend it.\n\nRPOW fixes this by using a trusted server that holds the private key to\na well-audited, open-source system running on tamper-evident hardware.\nThe client can verify (via remote attestation) exactly what software\nthe server is running.\n\nSo: you submit a hashcash token → server verifies it → server signs\nand returns a new RPOW token → you can pass that token to anyone →\nthey can redeem it at the server for a fresh one.\n\nThis is *not* decentralized, but the trust is explicit, auditable,\nand minimized. I see it as a building block.\n\nCode at: https://rpow.net\n\nHal",
          priority: true
        }
      ]
    },
    {
      thread_id: "ext-3",
      subject: "[ExI] The long-term future of AI",
      month: "2004-February",
      message_count: 23,
      has_priority: true,
      messages: [
        {
          id: "ext-3-1", author: "Eliezer Yudkowsky <sentience@pobox.com>", author_short: "Eliezer Yudkowsky",
          subject: "[ExI] The long-term future of AI",
          date: "Mon, 09 Feb 2004 22:14:00 -0800",
          body: "The crux of the matter is what happens in the interval between\nhuman-level AI and whatever comes after.\n\nIf that interval is very short — hours, days — then alignment\nproperties set at the beginning propagate forward. If it's long —\nyears — then you have time for correction, but also time for drift.\n\nMy current view is that the interval will be short enough that\ngetting it right the first time matters enormously...",
          priority: true
        }
      ]
    }
  ]
};
