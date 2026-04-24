Read .claude/skills/frontend-design/SKILL.md first.
Then read .claude/skills/video-to-website/SKILL.md second.
Then confirm the project structure before writing any code.
Do NOT run npm install. Do NOT create package.json. EVER.

Build the SmartTradeHQ landing page.
Files to create: index.html, css/style.css, js/app.js, payment.html
Serve with: npx serve . -p 3000

DESIGN SYSTEM:
- Background: #0A0A0F
- Accent 1: #00D4FF (cyan)
- Accent 2: #dd752b (orange)
- Font headings: Space Grotesk via Google Fonts CDN
- Font body: Inter via Google Fonts CDN
- Pill buttons, zero shadows, no glassmorphism
- Three.js particle mesh hero background — low vertex count, capped 30fps

6 SCENES:

SCENE 1 — HERO:
Headline line 1: "The Market Lies Before Every Big Move."
Headline line 2: "DSP Catches It Every Time."
Subtext: "NAS100 only. NY Session only. ICT-based precision."
One pill CTA button: "See How It Works →" scrolls to Scene 2
Three.js particle mesh background, dark, subtle cyan connections
Scroll indicator fades in after 2 seconds

SCENE 2 — PROBLEM & SOLUTION:
Left side — 3 brutal one-liners about why traders fail:
- "You're trading noise, not structure."
- "You react to moves that were already planned against you."
- "Your system has no edge. It has hope."
Right side — DSP acronym reveal with stagger animation:
D = Deceptive — fires in first
S = Swing — fires in second
P = Powercore — fires in third
Each letter is large cyan, word beside it is white

SCENE 3 — METHODOLOGY BREAKDOWN:
Title: "The DSP System"
5 steps animating in on scroll left to right with connecting line:
Step 1: Asia Range — Define the dealing range during Asian session
Step 2: CBDR — Central Bank Dealer Range sets the boundaries
Step 3: Judas Swing — False move to grab liquidity before real move
Step 4: NY Killzone — 2PM to 4PM WAT is the execution window
Step 5: DSP Entry — Deceptive Swing Powercore confirmation fires
Each step: number in cyan, bold title, one line description below

SCENE 4 — ACCOUNT TIERS:
Title: "Choose Your Entry Point"
Three pill cards horizontal on desktop, stacked on mobile:

Card 1 — Scout:
Minimum: $2,000
Split: 50/50
Setup fee: $400 USDT
CTA: "Start as Scout →" links to payment.html?tier=scout

Card 2 — Commander (highlighted as most popular):
Minimum: $5,000
Split: 40/60 (you keep 60%)
Setup fee: $400 USDT
CTA: "Start as Commander →" links to payment.html?tier=commander

Card 3 — Warlord:
Minimum: $10,000+
Split: Custom
Setup fee: $400 USDT
CTA: "Start as Warlord →" links to payment.html?tier=warlord

SCENE 5 — FOUNDER STORY + FAQ:
Left side — David Edet bio revealed line by line on scroll:
"My name is David Edet."
"I have traded NAS100 exclusively for 7 years."
"I trade the NY session only — 2PM to 4PM WAT."
"My system is built on ICT methodology."
"I call it DSP — Deceptive Swing Powercore."
"Every account I manage is traded with the same discipline."
"No gambling. No guessing. Only structure."

Right side — FAQ accordion, 5 questions:
Q1: How does the managed account work?
A1: You fund your Exness account and grant me limited trading access. I trade NAS100 during the NY session only using the DSP system. Profits are split according to your tier at the end of each agreed cycle.

Q2: What is the minimum to get started?
A2: The minimum is $2,000 for the Scout tier. Commander starts at $5,000 and Warlord at $10,000 and above. All tiers require a one-time $400 USDT setup fee.

Q3: How are profits shared?
A3: Scout is 50/50. Commander gives you 60% of all profits. Warlord is custom negotiated based on your capital size.

Q4: How do I send funds and what payment methods do you accept?
A4: Setup fees are paid in USDT via TRC20, ERC20, or BEP20 networks. Your trading capital goes directly into your own Exness account — you maintain full ownership at all times.

Q5: What results can I realistically expect?
A5: Results depend on market conditions and capital size. I trade with strict risk management — maximum 2 losses per day before I stop. Consistency over big wins is the goal.

SCENE 6 — THE CLOSE:
Full width dark section, centered Manifesto lines revealing one by one:
"The market is not random."
"It is engineered to deceive."
"DSP was built to see through the deception."
"One instrument. One session. One system."
"SmartTradeHQ."
Brand mark: D.S.P. in large cyan letters
Subtext: "Managed accounts now open."
Large pill CTA button: "Start Your Application →" links to payment.html

PAYMENT PAGE — payment.html:
Same dark design as index.html
Title: "Start Your Application"
Network selector pill toggle: TRC20 / ERC20 / BEP20
TRC20 wallet: TAv6bQQSvxsF7ruk26qfNur9Sogofa5tWJ
ERC20 wallet: (same address or update if different)
BEP20 wallet: (same address or update if different)
Wallet address updates live when network is selected
Full form fields:
- Full name
- Email address
- Selected tier (pre-filled from URL param)
- Investment amount
- Transaction ID
- Message (optional)
Submit via Web3Forms
Web3Forms key: fc88a5e5-a411-46e4-9f87-3525a39bcf63
Notification email: davidemre1991@gmail.com
Success state replaces form after submission with:
"Application received. David will contact you within 24 hours."

ANIMATIONS:
- Lenis smooth scroll, duration 1.2
- GSAP ScrollTrigger for all section entrances
- 4+ different animation types across scenes
- Scene 1: Three.js particle mesh, 30fps cap
- Scene 2: Stagger letter reveal
- Scene 3: Sequential step reveal left to right
- Scene 4: Scale up card entrance
- Scene 5: Line by line text reveal + accordion
- Scene 6: Line by line manifesto reveal

VANILLA HTML ONLY:
- No npm, no package.json, no node_modules
- No Next.js, no React, no Tailwind
- GSAP via CDN
- Lenis via CDN
- Three.js via CDN
- Space Grotesk + Inter via Google Fonts CDN