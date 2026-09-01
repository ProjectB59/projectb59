---
title: Wei Dai/Satoshi Nakamoto 2009 Bitcoin emails
author: Satoshi Nakamoto, Wei Dai
description: Emails in 2009 between Wei Dai and Satoshi Nakamoto discussing Bitcoin draft proposal and B-money.
created: 2014-03-17
modified: 2017-09-14
status: finished
confidence: log
importance: 5
css-extension: dropcaps-kanzlei
...

<div class="abstract">
> Below are 3 emails 2008--2009 between cryptographers [Wei Dai](http://www.weidai.com/) & [Satoshi Nakamoto](!W); they were quoted in the _Sunday Times_'s 2014-03-02 article ["Desperately seeking Satoshi; From nowhere, bitcoin is now worth billions. Where did it come from? Andrew Smithset off to find Satoshi Nakamoto, the mysterious genius behind the hit e-currency"](/doc/bitcoin/2014-smithset.pdf).
>
> The then-unknown Satoshi Nakamoto contacted Wei Dai, one of the few cryptographers to even dabble in e-currency speculation at the time, for citation details for his draft [Bitcoin white paper](/doc/bitcoin/2009-nakamoto.pdf "'Bitcoin: A Peer-to-Peer Electronic Cash System', Nakamoto 2009"), and to advertise his ideas. Wei Dai was not particularly interested but told Nakamoto about Nick Szabo's uncited [Bit Gold](http://unenumerated.blogspot.com/2005/12/bit-gold.html); in retrospect, Wei Dai interprets this as evidence that Satoshi is not Nick Szabo.
</div>

The _Sunday Times_ article quotes Wei Dai:

> ...Szabo, an American computer scientist who has also served as law professor at George Washington University, developed a system for "bit gold" between 1998 and 2005, which has been seen as a precursor to Bitcoin. Is he saying that Szabo is Satoshi? "No, I'm pretty sure it's not him." you, then? "No. When I said just Nick and me, I meant before Satoshi" So where could this person have come from? "Well, when I came up with b-money I was still in college, or just recently graduated, and Nick was at a similar age when he came up with bit gold, so I think Satoshi could be someone like that." "Someone young, with the energy for that kind of commitment?" "yeah, someone with energy and time, and that isn't obligated to publish papers under their real name."
>
> ...I go back to Szabo's pal, Wei Dai. "Wei", I say, "the other night you said you were sure Nick Szabo wasn't Satoshi. What made you sure?" "Two reasons", he replies. "One: in Satoshi's early emails to me he was apparently unaware of Nick Szabo's ideas and talks about how bitcoin 'expands on your ideas into a complete working system' and 'it achieves nearly all the goals you set out to solve in your b-money paper'. I can't see why, if Nick was Satoshi, he would say things like that to me in private. And, two: Nick isn't known for being a C++ programmer."
>
> Perversely, a point in Szabo's favour. But Wei forwards me the relevant emails, and it's true: Satoshi had been ignorant of Szabo's bit-gold plan until Wei mentioned it. Furthermore, a trawl through Szabo's work finds him blogging and fielding questions about bit gold on his Unenumerated blog on December 27, 2008, while Satoshi was preparing bitcoin to meet the world a week later. Why? Because Szabo didn't know about bitcoin: almost no one outside the Cryptography Mailing List did, and I can find no evidence of him ever having been there. Indeed, by 2011, the bit-gold inventor is blogging in defence of bitcoin, pointing out several improvements on the system he devised.

The full emails are being provided publicly by Wei Dai to [support his judgment](https://www.lesswrong.com/posts/YdfpDyRpNyypivgdu/aalwa-ask-any-lesswronger-anything?commentId=kro6CDWaeQojqZnvb) that Satoshi is not Nick Szabo:

> ...the more important reason for me thinking Nick isn't Satoshi is the parts of Satoshi's emails to me that are quoted in the _Sunday Times_. Nick considers his ideas to be at least an independent invention from b-money so why would Satoshi say "expands on your ideas into a complete working system" to me, and cite b-money but not Bit Gold in his paper, if Satoshi was Nick? An additional reason that I haven't mentioned previously is that Satoshi's writings just don't read like Nick's to me.

# Emails
## 1

Satoshi Nakamoto (as a code block to preserve whitespace):

    From: "Satoshi Nakamoto" <satoshi@anonymousspeech.com>
    Sent: Friday, August 22, 2008 4:38 PM
    To: "Wei Dai" <weidai@ibiblio.org>
    Cc: "Satoshi Nakamoto" <satoshi@anonymousspeech.com>
    Subject: Citation of your b-money page

    I was very interested to read your b-money page.  I'm getting ready to
    release a paper that expands on your ideas into a complete working system.
    Adam Back (hashcash.org) noticed the similarities and pointed me to your
    site.

    I need to find out the year of publication of your b-money page for the
    citation in my paper.  It'll look like:
    [1] W. Dai, "b-money," http://www.weidai.com/bmoney.txt, (2006?).

    You can download a pre-release draft at
    http://www.upload.ae/file/6157/ecash-pdf.html  Feel free to forward it to
    anyone else you think would be interested.

    Title: Electronic Cash Without a Trusted Third Party

    Abstract: A purely peer-to-peer version of electronic cash would allow
    online payments to be sent directly from one party to another without the
    burdens of going through a financial institution.  Digital signatures
    offer part of the solution, but the main benefits are lost if a trusted
    party is still required to prevent double-spending.  We propose a solution
    to the double-spending problem using a peer-to-peer network.  The network
    timestamps transactions by hashing them into an ongoing chain of
    hash-based proof-of-work, forming a record that cannot be changed without
    redoing the proof-of-work.  The longest chain not only serves as proof of
    the sequence of events witnessed, but proof that it came from the largest
    pool of CPU power.  As long as honest nodes control the most CPU power on
    the network, they can generate the longest chain and outpace any
    attackers.  The network itself requires minimal structure.  Messages are
    broadcasted on a best effort basis, and nodes can leave and rejoin the
    network at will, accepting the longest proof-of-work chain as proof of
    what happened while they were gone.

    Satoshi

The title does not mention Bitcoin, and the abstract is not identical to the final one, which is slightly better written (eg. no "broadcasted" typo); a word-level diff of the abstracts using `Mergeley.com`:

![Old/new differences in abstract](/doc/bitcoin/2008-nakamoto-abstract-wdiff.png)

The bit about [Adam Back](!W) has been mentioned before; on [2013-04-18](https://bitcointalk.org/index.php?topic=15672.msg1873483#msg1873483), Adam Back posted to the BitcoinTalk forums a self-introduction mentioning that

> ...So anyway I know a few things about ecash, privacy tech, crypto, distributed systems (my comp sci PhD is in distributed systems) and I guess I was one of the moderately early people to read about and try to comprehend the p2p crypto cleverness that is bitcoin.\ \ In fact I believe it was me who got Wei Dai's b-money reference added to Satoshi's bitcoin paper when he emailed me about hashcash back in 2008.\ \ If like Hal Finney I'd actually tried to run the miner back then, I may too be sitting on some genesis/bootstrap era coins.\ \ Alas I own not a single bitcoin which is kind of ironic as the actual bitcoin mining is basically my hashcash invention...

The "pre-release draft" link is now broken. I have tried to refind it:

- the original fly-by-night filehosting site disappeared years ago, and does not appear to have been renamed or moved
- the filehosting download page & PDF are unavailable in the Internet Archive
- the earliest version of the whitepaper on Bitcoin.org in the Internet Archive is a later draft, using the name "Bitcoin" (unsurprisingly); looking at the full list of mirrored files for that domain, there don't appear to be any other PDFs in the snapshots which might be an earlier still draft & possibly the original
- Google searches for queries like "ecash-pdf" and variants (sometimes adding in "Satoshi Nakamoto" since he was using that nick at the time even if he had not settled on "Bitcoin" as a name) have turned up no mirrors or people discussing that version of the whitepaper who might have copies
- a more targeted search on BitcoinTalk did not turn up any copies
- the whitepaper was never checked into the original Subversion repository set up after the alpha code was released, so no revision history there either
- I asked them and learned that early correspondents Wei Dai, Adam Back, and Gregory Maxwell do not have copies. (I also asked Hal Finney but did not expect a reply [given his condition](https://www.forbes.com/sites/andygreenberg/2014/03/25/satoshi-nakamotos-neighbor-the-bitcoin-ghostwriter-who-wasnt/) & did not receive one before he passed away 2014-08-28.)

If anyone has a copy of it or a tip as to where it might be or who might have it stashed away, please contact me. It would likely shed some further insight on the development of Bitcoin and how Satoshi had his key insight of proof-of-work.

[A request](https://www.metzdowd.com/pipermail/cryptography/2015-January/024433.html) on the original "cryptography" mailing list yielded [a SHA-256 hash](https://www.metzdowd.com/pipermail/cryptography/2015-January/024453.html) of a draft paper earlier than the current `bitcoin.org`-hosted version, which then turned up a matching `bitcoin.pdf` ([rehosted locally](/doc/bitcoin/2008-10-03-nakamoto-bitcoindraft.pdf)).
This one has a few noticeable differences: the Vistomail email address, the final title, a few word changes ("digital signatures *provide* part" rather than "*offer*") etc.[^draft-diff].

[^draft-diff]: A fuller diff:

    ~~~{.Diff}
    [-satoshi@vistomail.com-]
    {+satoshin@gmx.com+}

    ...Abstract. A purely peer-to-peer version of electronic cash would allow online
    payments to be sent directly from one party to another without [-the burdens of-] going through a
    financial institution. Digital signatures provide part of the solution, but the main
    benefits are lost if a trusted {+third+} party is still required to prevent [-doublespending.-] {+double-spending.+}
    We propose a solution to the double-spending problem using a [-peer-topeer-] {+peer-to-peer+} network.
    The network timestamps transactions by hashing them into an ongoing chain of
    hash-based proof-of-work, forming a record that cannot be changed without redoing
    the proof-of-work. The longest chain not only serves as proof of the sequence of
    events witnessed, but proof that it came from the largest pool of CPU power. As
    long as [-honest nodes control the most-] {+a majority of+} CPU power [-on-] {+is controlled by nodes that are not cooperating to
    attack+} the network, [-they can-] {+they'll+} generate the longest chain and outpace [-any-] attackers. The
    network itself requires minimal structure. Messages are [-broadcasted-] {+broadcast+} on a best effort
    basis, and nodes can leave and rejoin the network at will, accepting the longest
    proof-of-work chain as proof of what happened while they were gone.

    ...The proof-of-work also solves the problem of determining representation in majority decision
    making. If the majority were based on one-IP-address-one-vote, it could be subverted by anyone
    able to allocate many IPs. Proof-of-work is essentially one-CPU-one-vote. The majority
    decision is represented by the longest chain, which has the greatest proof-of-work effort invested
    in it. If a majority of CPU power is controlled by honest nodes, the honest chain will grow the
    fastest and outpace any competing chains. To modify a past block, an attacker would have to
    redo the proof-of-work of the block and all blocks after it and then catch up with and surpass the
    work of the honest nodes. We will show later that the probability of a slower attacker catching up
    diminishes exponentially as subsequent blocks are added.
    {+To compensate for increasing hardware speed and varying interest in running nodes over time,
    the proof-of-work difficulty is determined by a moving average targeting an average number of
    blocks per hour. If they're generated too fast, the difficulty increases.+}

    ...New transactions are [-broadcasted-] {+broadcast+} to all nodes.
    Each node collects new transactions into a block.

    ...The steady addition of a constant of amount of new coins is analogous to gold miners expending
    resources to add gold to circulation. In our case, it is CPU time and electricity that is expended.
    The incentive [-may-] {+can+} also {+be funded with transaction fees. If the output value of a transaction is
    less than its input value, the difference is a transaction fee that is added to the incentive value of
    the block containing the transaction. Once a predetermined number of coins have entered
    circulation, the incentive can transition entirely to transaction fees and be completely inflation
    free.
    The incentive may+} help encourage nodes to stay honest. If a greedy attacker is able to
    assemble more CPU power than all the honest nodes, he would have to choose between using it
    to defraud people by stealing back his payments, or using it to generate new coins. He ought to
    find it more profitable to play by the rules, such rules that favour him with more new coins than
    everyone else combined, than to undermine the system and the validity of his own wealth.
    [-To compensate for increasing hardware speed and varying interest in running nodes over time,
    the proof-of-work difficulty is determined by a moving average targeting an average number of
    blocks per hour. If they're generated too fast, the difficulty increases.-]

    ...As such, the verification is reliable as long as honest nodes control the network, but is more
    vulnerable if the network is overpowered by an attacker. While network nodes can verify
    transactions for [-themselves and are only vulnerable to reversal,-] {+themselves,+} the simplified method can be fooled by an attacker's fabricated
    transactions for as long as the attacker can continue to overpower the network. One strategy to
    protect against this would be to accept alerts from network nodes when they detect an invalid
    block, prompting the user's software to download the full block and [-reported-] {+alerted+} transactions to
    confirm the inconsistency. Businesses that receive frequent payments will probably still want to
    run their own nodes for more independent security and quicker verification.

    ...The probability of an attacker catching up from a given deficit is analogous to a Gambler's
    Ruin problem. Suppose a gambler with unlimited credit starts at a deficit and plays potentially an
    infinite number of trials to try to reach breakeven. We can calculate the probability he ever
    reaches breakeven, or that an attacker ever catches up with the honest chain, as follows [8]:
    p = probability an honest node finds the next block
    q = probability the attacker finds the next block
    qz = probability the attacker will ever catch up from z blocks behind

    {

    q z=

    1
    if p≤q
    z
    (q / p) if pq

    }
    {+6+}

    ...{

    [- e
    (q / p)(-]

    {+(+} z−k )
    if k ≤ z
    [-⋅-]
    ∑ [-k!
    1-] {+ ke! ⋅ (q / p)1+}
    if k  z
    k =0
    ∞

    }
    ~~~

<!-- } -->

Is this the earliest draft of the paper, the one Satoshi sent to Wei Dai?
No:

- Satoshi's initial email to Dai is dated "August 22, 2008"; the metadata for this PDF (`pdftk bitcoin.pdf dump_data`) yields as the `CreationDate` the value `20081003134958-07'00'`---without getting into the gory details of PDF metadata formatting, this implies 2008-10-03 or a bit over a month later, which is consistent with the local date mentioned in the cryptography ML email. (This is however an earlier draft than the final draft on `bitcoin.org`, which is dated `20090324113315-06'00'` or 2009-03-24; interestingly, the timezone differs: −7 vs −6.)
- Satoshi says in the Dai email that the URL is `...ecash-pdf.html`, which is an auto-link generated by the filehost, suggesting the filename was `ecash.pdf` and not `bitcoin.pdf`

    'Ecash' or 'e-cash' appears elsewhere in early Satoshi materials.
    In particular, an anonymous reader points out to me that:

    > ...while `bitcoin.org` was registered on 2008-08-18, `e-cash.org` looks to have been registered on 2008-07-20. Seems likely that Satoshi also registered this one and then switched his mind later on and went with 'bitcoin' instead.

    [Or Weinberger](https://x.com/orweinberger/status/1573234325046558720 "2022-09-23") notes that:

    > Did you know? A day before the `http://bitcoin.org` domain was first registered, someone purchased `http://netcoin.org` using the same registrar.
    > Looks like Satoshi was contemplating between the two names and later dropped `http://netcoin.org`
    >
    > According to Wayback Machine no content was ever present on the `http://netcoin.org` domain except for only after it was repurchased by another person later on.
    >
    > I've discovered this by looking at all domains purchased around the same time by AnonymousSpeech. It's truly amazing that you can still reveal new information on such a researched subject.
    > Paid subscription for [domaintools's](https://www.domaintools.com/) research features which includes every historical record for this domain.

    - Satoshi says also that the title is "Electronic Cash Without a Trusted Third Party", but in this October 2008 version, the title has already changed to "Bitcoin: A Peer-to-Peer Electronic Cash System"
- Satoshi's pretext is getting the right citation for Dai's B-money, and he implies there is either no citation to Dai currently (consistent with Adam Back's claim to have noticed the absence and told Satoshi) or it would be to '2006?' (his quoted example citation); however, this file has the full correct citation `[1] W. Dai, 'b-money,' http://www.weidai.com/bmoney.txt, 1998.`---dated to 1998 (as Dai tells Satoshi), not 2006 (as was Satoshi's best guess).

## 2

Dai:

    Hi Satoshi. b-money was announced on the cypherpunks mailing list in 1998.
    Here's the archived post:
    https://cypherpunks.venona.com/date/1998/11/msg00941.html

    There are some discussions of it at
    https://cypherpunks.venona.com/date/1998/12/msg00194.html.

    Thanks for letting me know about your paper. I'll take a look at it and let
    you know if I have any comments or questions.

## 3

Nakamoto:

    From: Satoshi Nakamoto
    Sent: Saturday, January 10, 2009 11:17 AM
    To: weidai@weidai.com
    Subject: Re: Citation of your b-money page

    I wanted to let you know, I just released the full implementation of the
    paper I sent you a few months ago, Bitcoin v0.1.  Details, download and
    screenshots are at www.bitcoin.org

    I think it achieves nearly all the goals you set out to solve in your
    b-money paper.

    The system is entirely decentralized, without any server or trusted
    parties.  The network infrastructure can support a full range of escrow
    transactions and contracts, but for now the focus is on the basics of
    money and transactions.

    There was a discussion of the design on the Cryptography mailing list.
    Hal Finney gave a good high-level overview:
    | One thing I might mention is that in many ways bitcoin is two independent
    | ideas: a way of solving the kinds of problems James lists here, of
    | creating a globally consistent but decentralized database; and then using
    | it for a system similar to Wei Dai's b-money (which is referenced in the
    | paper) but transaction/coin based rather than account based. Solving the
    | global, massively decentralized database problem is arguably the harder
    | part, as James emphasizes. The use of proof-of-work as a tool for this
    | purpose is a novel idea well worth further review IMO.

    Satoshi

# See Also

<div class="columns">
- ["The Crypto-Currency: Bitcoin and its mysterious inventor"](/doc/bitcoin/2011-davis) (_New Yorker_ 2011)
- [Bitcoin is Worse is Better](/bitcoin-is-worse-is-better){.backlink-not}
</div>

# External Links

- [HN discussion](https://news.ycombinator.com/item?id=7521462)
