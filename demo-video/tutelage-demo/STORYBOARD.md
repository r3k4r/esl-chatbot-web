---
format: 1920x1080
duration: 45s
message: "Your AI English tutor: talk, get corrected kindly, and watch yourself improve."
arc: Demo Loop (hook → product intro → chat → correction → voice → vocabulary → progress → CTA)
audience: Kurdish-speaking English learners landing on the Tutelage AI site
mode: autonomous
music: calm warm ambient electronic, soft pads, gentle hopeful pulse; quiet bed, ducked under the voice
captions: on
---

## Video direction

- **palette system** (frame.md, Broadside remixed to Tutelage): ground = deep ink `#1C1B1B` (the app's dark UI family), text = warm off-white `#F2F2F2`, the ONE accent = Tutelage orange `#F59E0B` (with its deep `#CA8100` for pressed/shadow tones and `#FEC016` only as a glow highlight). Orange is spent on what matters in each beat: the caret, the logo, the corrected words, the call orb, the climbing bars, the CTA button. Never a second accent; never purple/blue "AI" gradients.
- **type**: display = Poppins (frame.md display role) for every headline and the typed lines; body = Poppins regular for supporting lines; numbers in tabular figures.
- **the product is the hero**: real captured screens (3200×1800, 2x) shown as floating app windows on the ink ground with a soft long shadow and a thin border — never full-bleed flat screenshots, never browser chrome. Crops and push-ins go to the part the voice is naming.
- **motion grammar**: long-tail `power3`-style settles (smooth over bouncy); entrances only, every reveal fired on its spoken word (word timings in audio_meta.json) — nothing appears before the voice names it. Camera moves are single purposeful pushes on a cue, not drifting. A held read after the last reveal; at most a subtle jitter on a held hero.
- **rhythm**: frames 1–3 build quietly; frame 4 (the correction) is the first climax — a held read after the rewrite; frame 5 lifts energy (the orb); frame 6 is brisk; frame 7 is the build (count-ups); frame 8 lands calm and still on the logo, then the CTA. Held reads: end of F4, end of F7, end of F8.
- **sound**: low music bed ducked under every voice line; small, soft SFX on the moves (whoosh on pushes, light pops on arrivals, one gentle chime on the correction, soft tick on the counters, a warm sting on the logo). Never loud, never cartoonish.
- **caption band**: plan all content into the top ~83%; the bottom band carries the caption pill.
- **negative list**: no slideshow (front-load then freeze), no screensaver (everything floating independently), no lazy breathing loops, no back-half slow pans, no bokeh/particles/gradient blobs, no fake UI that isn't Tutelage's, no stock photos, no em-dash-style decorative lines.

## Frame 1 — I just freeze

- type: hook
- blueprint: typewriter-reveal (Adapt)
- duration: 3.903s
- transition_in: cut
- status: animated
- src: compositions/frames/01-i-just-freeze.html
- scene: On deep ink, a learner's thought types itself: "I know English. I just can't speak it." — "speak" backspaces and retypes, then the line hangs.
- voiceover: "You know English. You just freeze when it's time to speak."
- asset_candidates: none
- focal: the typed line
- roles: typed line = hero (centered, display weight)
- sfx: soft keyboard typing, gentle backspace click

Adapt: keep the typewriter signature (live caret + an in-place edit); the edit is a hesitation, not a typo fix — the line freezes the way the learner does. No brand payoff here (frame 2 owns it).

Scene 1 (0.0–1.4s): ink ground, a single orange caret blinks dead-center-left; on "You know English." the first sentence types on in display type, off-white, Centered, ~60% width.
Scene 2 (1.4–2.6s): on "You just freeze", the second sentence types "I just can't sp" — and STOPS mid-word; the caret blinks, alone, twice (the freeze).
Scene 3 (2.6–end): on "time to speak", the partial word backspaces and retypes as "speak it." with the caret ending in orange; the whole line holds still (held read into the cut).

## Frame 2 — Meet Tutelage AI

- type: product_intro
- blueprint: logo-assemble-lockup (Adapt)
- duration: 5.81s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/02-meet-tutelage.html
- scene: The gold Tutelage mark assembles in the center, the wordmark slides beside it; the promise lands under it: talk · get corrected kindly · improve.
- voiceover: "Meet Tutelage AI — a patient English tutor you can talk to, any time."
- asset_candidates: assets/only-logo-black-border-yellow-bg.svg — the gold Tutelage mark; assets/logo-with-text-only-white.svg — white Tutelage wordmark
- focal: brand/only-logo-black-border-yellow-bg.svg
- roles: mark = hero (center) · white wordmark = supporting (beside the mark)
- sfx: warm soft whoosh, gentle shimmer

Adapt: keep the signature (the mark comes to exist from parts and spring-BLOOMS whole, then resolves to a lockup); the CTA push-through variant is saved for frame 8.

Scene 1 (0.0–1.4s): on "Meet Tutelage AI", the mark's shield outline SVG self-draws in orange at center (~22% of frame height), then fills and blooms whole with a soft orange glow behind it.
Scene 2 (1.4–3.0s): the mark slides left as the white "Tutelage" wordmark wipes in beside it — Centered lockup, ~45% of frame width; the glow settles.
Scene 3 (3.0–end): on "a patient English tutor you can talk to", a single supporting line types under the lockup in off-white body type: "Your patient English tutor." then "Talk any time." resolves beside it with "any time" in orange on its word; hold.

## Frame 3 — It talks back

- type: feature_showcase
- blueprint: device-surface-showcase (Adapt)
- duration: 6.228s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/03-it-talks-back.html
- scene: The real AI Chat (dark) floats in at a slight tilt; messages arrive one by one: the tutor's note on past simple, the learner's answer, "Brilliant! 'I have been to' — textbook present perfect."
- voiceover: "Chat about your day, your work, your plans. It replies like a real person."
- asset_candidates: assets/chat-past-dark.png — AI Chat thread, past experiences; assets/chat-new-dark.png — empty AI Chat with composer; assets/only-logo-black-border-yellow-bg.svg — the gold Tutelage mark
- focal: screens/chat-past-dark.png
- roles: chat-past-dark = hero app window (cropped to the message thread) · logo = supporting (tutor avatar) · chat-new-dark = background (unused unless needed for the window frame)
- sfx: soft message pop, soft message pop, soft message pop

Adapt: keep the surface-as-hero signature (a real app window held in frame while its content advances); instead of swapping screens, the thread's messages arrive one by one on the window's face. Crop the window to the conversation column (no sidebar), so the bubbles read large.

Scene 1 (0.0–1.6s): the AI Chat window establishes — drifts in from a slight 3D tilt (rotateY ~8°) to near-flat, asymmetric 60/40 right, ~62% of frame, soft shadow; a short orange label "AI Chat" sits upper-left in display type. On "Chat about your day", the first tutor bubble ("Good topic! Note: with 'last summer' we use past simple…") pops in.
Scene 2 (1.6–3.6s): on "your work", the learner's reply bubble ("I stayed for five days. I visited the British Museum…") pops in from the right; on "your plans", the tutor's next bubble arrives.
Scene 3 (3.6–end): on "It replies like a real person", the tutor's "Brilliant! 'I have been to' — textbook present perfect." bubble pops in with the Tutelage avatar, a soft orange underline sweeps under "textbook present perfect"; hold.

## Frame 4 — Corrected kindly

- type: feature_showcase
- blueprint: device-surface-showcase (Adapt)
- duration: 5.548s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/04-corrected-kindly.html
- scene: Push in on the learner's message; the "Better phrasing" card unfolds beneath it — "yesterday i go to the market" strikes through, "yesterday I went to the market" writes itself in bold, the one-line rule fades up; the tutor's reply "Nice! What else did you buy?" keeps the chat moving.
- voiceover: "Slip up? It shows you the better way — kindly — and keeps the conversation going."
- asset_candidates: assets/chat-voice-dark.png — AI Chat with Better phrasing cards
- focal: screens/chat-voice-dark.png
- roles: chat-voice-dark = hero (cropped to the first "Better phrasing" card + the tutor reply under it)
- sfx: soft whoosh push-in, gentle chime, soft message pop

Adapt: the surface is held, the camera does the work — one push to the correction card, then the correction is performed live as an overlay rebuilt on top of the real card (struck words + rewritten words + rule), so the signature "real interface" stays true while the key moment animates.

Scene 1 (0.0–1.1s): hard cut in on the same window style, framed on the learner's bubble "yesterday i go to the market…" — on "Slip up?", a single push-in (zoom-to-target) settles on the bubble and the card space below it, Centered, ~70% of frame.
Scene 2 (1.1–3.2s): on "It shows you the better way", the "Better phrasing" card unfolds beneath (height reveal, orange "Better phrasing" label first); "yesterday i go to the market" draws a strike line through it; on "kindly", "yesterday I went to the market" writes itself in bold off-white with "went" in orange, and a gentle chime lands; the one-line rule ("Use the past simple form went for actions that happened yesterday.") fades up under it.
Scene 3 (3.2–end): on "keeps the conversation going", the tutor's "Nice! What else did you buy?" bubble pops in below with the avatar; everything holds — the held read of the video's first climax.

## Frame 5 — Say it out loud

- type: feature_showcase
- blueprint: device-surface-showcase (Adapt)
- duration: 7.586s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/05-say-it-out-loud.html
- scene: The Voice Lab call button blooms into a living orb; a voice wave pulses with the learner's line, the tutor answers, and the answer's score ticks up beside it.
- voiceover: "Ready to speak? Call your tutor in the Voice Lab. It listens, answers in a real voice, and scores every answer."
- asset_candidates: assets/voice-dark.png — Voice Lab call screen
- focal: screens/voice-dark.png
- roles: voice-dark = hero app window (Voice Lab card with the orange call button) then the call button becomes the orb (rebuilt)
- sfx: soft call ring, gentle soundwave swell, soft score tick

Adapt: the surface establishes (the real Voice Lab), then the camera zooms through its call button into a rebuilt "on a call" stage — the orb, a voice wave, two short captions, a score chip. Keep the real Voice Lab window visible for the first beat so it's unmistakably the product.

Scene 1 (0.0–2.0s): the Voice Lab window establishes, Centered, ~64% of frame, with "Voice Lab" label upper-left; on "Call your tutor", the orange call button gets a press (button press: compression then recovery) and a soft ring ripple.
Scene 2 (2.0–4.2s): on "in the Voice Lab", the camera zooms THROUGH the call button into the call stage: a large orange orb, Centered, ~38% of frame height, a thin outer ring; on "It listens", the ring pulses with a short voice-wave of bars on the learner side and a small caption "Can we talk about my day?" types under it.
Scene 3 (4.2–5.6s): on "answers in a real voice", the orb's core blooms and the wave flips to the tutor side; the tutor caption "Of course! How was your morning?" types under it.
Scene 4 (5.6–end): on "scores every answer", a score chip slides up beside the orb — "Fluency 82 · Good" with the number counting up; hold.

## Frame 6 — Words that stick

- type: feature_showcase
- blueprint: device-surface-showcase (Adapt)
- duration: 5.209s
- transition_in: push-slide UP
- status: animated
- src: compositions/frames/06-words-that-stick.html
- scene: Words from the chats fly into a stack of flashcards; the top card flips to "perseverance" with its pronunciation; the mastery bars fill behind it.
- voiceover: "New words from every chat become flashcards that come back right before you forget them."
- asset_candidates: assets/vocab-dark.png — Vocabulary flashcard + mastery
- focal: screens/vocab-dark.png
- roles: vocab-dark = hero app window (flashcard + mastery breakdown) · rebuilt flashcard = foreground
- sfx: soft card flips, light whoosh

Adapt: cut-the-curve in from frame 5 (the score chip exits right as words enter from the left); the real Vocabulary window holds while a rebuilt flashcard stack performs the move on top of it.

Scene 1 (0.0–1.8s): on "New words from every chat", three word chips ("bought", "market", "perseverance") fly in from the left in a short staggered arc, asymmetric 40/60, and drop into a card stack.
Scene 2 (1.8–3.0s): on "become flashcards", the real Vocabulary window resolves behind the stack (right, ~60% of frame); the top card flips (3D flip) to "perseverance /ˌpɜːrsɪˈvɪərəns/".
Scene 3 (3.0–end): on "come back right before you forget them", the mastery bars on the window fill one by one (Seen → Learning → Familiar → Proficient → Mastered) and a small orange "17 due today" chip pops by the card; hold.

## Frame 7 — Watch yourself improve

- type: benefit_highlight
- blueprint: dataviz-countup (Adapt)
- duration: 5.496s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/07-watch-yourself-improve.html
- scene: The four skill bars race up and their numbers count: Grammar 87, Vocabulary 75, Fluency 82, Speaking 82; "B1 → aiming for B2" settles under them.
- voiceover: "And every session counts — watch your grammar, fluency and speaking climb."
- asset_candidates: assets/dashboard-dark.png — student dashboard, Skills card
- focal: screens/dashboard-dark.png
- roles: dashboard-dark = background context (the Skills card region, dimmed ~40%) · rebuilt skill bars + counters = hero
- sfx: soft rising tick, gentle riser into the last bar

Adapt: keep the count-up signature (numbers count up while their bars fill, landing on one hero metric with a soft glow); the "instruments" are the app's own Skills bars rebuilt large over a dimmed crop of the real dashboard (never the hero area, which shows 0 minutes on the seed account).

Scene 1 (0.0–1.8s): a dimmed crop of the real dashboard's Skills card sits behind; on "every session counts", a large "Your skills" title and the four bar tracks establish, Centered, ~70% of frame.
Scene 2 (1.8–4.4s): each bar fills and its number counts up exactly on its spoken word — Grammar 87 on "grammar", Fluency 82 on "fluency", Speaking 82 on "speaking", with Vocabulary 75 between; each lands with a "Good"/"Strong" band chip.
Scene 3 (4.4–end): on "climb", a soft orange glow blooms behind the panel and a chip "B1 · aiming for B2" settles under the bars; hold (the build's peak).

## Frame 8 — Start free

- type: cta
- blueprint: logo-assemble-lockup (Reproduce)
- duration: 7.2s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/08-start-free.html
- scene: The interface melts away; the gold mark lands center with a short sting on the beat, "Talk. Improve. Repeat." resolves under it, then the button "Start free" and ai.tutelage.krd.
- voiceover: "Tutelage AI. Talk, improve, repeat. Start free today."
- asset_candidates: assets/only-logo-black-border-yellow-bg.svg — the gold Tutelage mark; assets/logo-with-text-only-white.svg — white Tutelage wordmark
- focal: brand/only-logo-black-border-yellow-bg.svg
- roles: mark = hero · white wordmark = supporting · CTA button = foreground
- sfx: warm logo sting, soft button click

Reproduce: the lockup builds and blooms (the logo sting), then the end card stack lands under it.

Scene 1 (0.0–1.6s): on "Tutelage AI", the mark lands center with a single spring-bloom and one soft orange ring expanding behind it (the sting), the white wordmark wipes in beside it — Centered lockup, ~40% of frame width.
Scene 2 (1.6–4.0s): "Talk." "Improve." "Repeat." land one by one under the lockup on their spoken words, per-word reveal, off-white with the period in orange.
Scene 3 (4.0–end): on "Start free today", an orange "Start free" button (white text, 12px radius) pops up below with a soft press, and "ai.tutelage.krd" fades in under it in muted off-white; everything holds still to the end.
