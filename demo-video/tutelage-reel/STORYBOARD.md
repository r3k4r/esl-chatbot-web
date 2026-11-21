---
format: 1920x1080
duration: 30s
message: "Scared to speak English? Practise with an AI tutor that fixes your mistakes kindly — start free."
arc: Reel (hook → intro → chat → correction → voice → flashcards → progress → CTA)
audience: Kurdish-speaking English learners scrolling Instagram / TikTok
mode: autonomous
music: upbeat modern pop electronic, bright and playful, 120–128 bpm, punchy drums, clean ending
captions: on
---

## Video direction

- **canvas**: LANDSCAPE 1920×1080 (it plays on the website from the "Watch a demo" button) — reel-STYLE energy, not reel size. Keep content in the top ~83% (y ≤ 900); captions sit below. The per-scene positions below were first written for a vertical canvas: re-compose each scene for a wide frame (side-by-side or centered layouts, phone/app cards at the right size, big type), keeping the same moves, timings and order.
- **palette** (frame.md): bold colour FIELDS change every scene — cream #FFF7EC, pink #FF5C8A, teal #14C8B4, sun #FFD23F, orange #F59E0B, ink #1C1B1B. Each frame owns one field colour (listed per frame); orange stays the Tutelage brand colour (logo, CTA). Text on colour fields is ink #1C1B1B or cream; never low-contrast pairs.
- **style**: Creative Mode bones — 4–6px ink outlines, hard offset ink shadows (no blur), sticker-like cards, Poppins 700 big type. Product screens sit inside rounded phone-style cards with an ink outline and a hard shadow, cropped to the part being talked about (readable at phone size — crop tight, scale big).
- **motion**: FAST and playful. Every scene opens with a hit (whip-in, punch-zoom, slam) on the first word; elements pop with `back.out(1.6–2.2)` overshoot, stagger 0.05–0.08s; kinetic words slam/scale/rotate in on their spoken word; camera shakes 2–3 frames on impacts; little sticker shapes (stars, sparkles, arrows, squiggles in the accent colours) pop around the hero and wiggle. Nothing ever sits still for more than ~0.6s, except the final CTA hold. All seek-safe: fromTo, one paused timeline, no repeat:-1, no randomness.
- **rhythm**: cuts every ~3–4s; F4 (correction) and F7 (progress) are the peaks; F8 lands and holds.
- **sound**: every transition gets a whoosh/swoosh; every slam an impact/pop; risers into F7; the music dips briefly under the hook and the CTA.
- **negative list**: no slow pans, no front-loading then freezing, no muddy dark-on-dark, no fake UI that isn't Tutelage, no tiny unreadable screenshots, no captions with a background box.

## Frame 1 — Scared to speak?

- type: hook
- blueprint: kinetic-type-beats (Adapt)
- duration: 1.974s
- transition_in: cut
- status: animated
- src: compositions/frames/01-scared.html
- scene: Pink field. "Scared" SLAMS in huge and shakes; "to speak" punches in under it; "English?" pops in a sun-yellow sticker box with a wobble.
- voiceover: "Scared to speak English?"
- asset_candidates: none
- focal: the kinetic words
- roles: words = hero
- sfx: impact hit, pop

Scene 1 (0.0–0.8s): pink field; on "Scared", the word slams from 2.4× scale to 1× with a 3-frame camera shake, ink text with a hard ink shadow, centered at y≈700, ~85% width.
Scene 2 (0.8–1.4s): "to speak" punches in below (scale 0→1, back.out), cream with ink outline.
Scene 3 (1.4–end): "English?" drops into a tilted sun-yellow sticker box (rotate −6°→−3°) with a bounce; two small sparkle stickers pop beside it and wiggle.

## Frame 2 — Meet Tutelage AI

- type: product_intro
- blueprint: logo-assemble-lockup (Adapt)
- duration: 4.273s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/02-meet.html
- scene: Ink field. The gold mark spins in and bounces, rays burst out in pink/teal/yellow, the TUTELAGE letters slam in, "your English tutor, any time" types under it in a cream pill.
- voiceover: "Meet Tutelage AI — your English tutor, any time."
- asset_candidates: assets/only-logo-black-border-yellow-bg.svg — the gold Tutelage mark; assets/logo-with-text-only-white.svg — white Tutelage wordmark
- focal: assets/only-logo-black-border-yellow-bg.svg
- roles: mark = hero · wordmark = supporting
- sfx: whoosh, shimmer sparkle

Scene 1 (0.0–1.2s): ink field; on "Meet", the gold mark spins in (rotate −180°→0, scale 0→1.15→1) at y≈640, ~40% width; on "Tutelage AI" a burst of 12 short rays in pink/teal/yellow shoots out once.
Scene 2 (1.2–2.4s): the TUTELAGE letters (cropped from the white wordmark file, its own shield hidden) slam in letter by letter below the mark.
Scene 3 (2.4–end): on "your English tutor", a cream pill with ink outline pops in with "Your English tutor, 24/7" — "24/7" in orange; small star stickers twinkle (finite tweens).

## Frame 3 — Chat about anything

- type: feature_showcase
- blueprint: device-surface-showcase (Adapt)
- duration: 4.325s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/03-chat.html
- scene: Teal field. A phone-style card bounces up with the real AI Chat thread, cropped tight on the bubbles; bubbles pop one by one; topic stickers ("Travel", "Work", "Football") fly around it.
- voiceover: "Chat about anything. It talks back like a real person."
- asset_candidates: assets/chat-past-dark.png — AI Chat thread, past experiences; assets/only-logo-black-border-yellow-bg.svg — the gold Tutelage mark
- focal: assets/chat-past-dark.png
- roles: chat-past-dark = hero (cropped to the conversation column, scaled big) · logo = tutor avatar
- sfx: swoosh, message pop, message pop

Scene 1 (0.0–1.0s): teal field; on "Chat", a rounded phone card (ink outline, hard shadow, ~86% width, y 330–1450) bounces up from below with a slight tilt that settles; label "AI Chat" sticker pops top-left of the card in orange.
Scene 2 (1.0–2.2s): on "anything", three topic stickers ("Travel" pink, "Work" yellow, "Football" cream) fly in around the card from different sides and wobble.
Scene 3 (2.2–end): on "talks back", the tutor bubbles inside the card pop in one by one (cropped real screenshot regions revealed in turn), each with a tiny bounce.

## Frame 4 — Oops, fixed nicely

- type: feature_showcase
- blueprint: device-surface-showcase (Adapt)
- duration: 3.75s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/04-fixed.html
- scene: Sun-yellow field. The learner's message "yesterday i go to the market" sits big in a card; a red-pink strike slashes "go", "went" stamps in orange with a sparkle burst, "Better phrasing" sticker pops, a big "Oops!" sticker spins in, then "nicely" with a heart.
- voiceover: "Oops, a mistake? It fixes it — nicely."
- asset_candidates: assets/chat-voice-dark.png — AI Chat with Better phrasing cards
- focal: assets/chat-voice-dark.png
- roles: chat-voice-dark = hero source (the Better phrasing card, rebuilt big as an overlay matching the real card)
- sfx: boing pop, pen swipe, success chime

Scene 1 (0.0–0.9s): yellow field; on "Oops", a giant "Oops!" sticker (pink, ink outline, rotated) spins in at top (y≈380) with a camera shake; below it the learner bubble "yesterday i go to the market" pops in big (cream card, ink outline, ~88% width, y≈720).
Scene 2 (0.9–2.2s): on "It fixes it", a pink strike line slashes through "i go"; "I went" stamps in below in bold with "went" orange; 6 sparkle stickers burst from it; a "Better phrasing" label sticker pops on the card.
Scene 3 (2.2–end): on "nicely", the word "nicely" with a small heart sticker bounces in under the card; everything settles with a tiny wiggle.

## Frame 5 — Say it out loud

- type: feature_showcase
- blueprint: device-surface-showcase (Adapt)
- duration: 3.385s
- transition_in: push-slide UP
- status: animated
- src: compositions/frames/05-voice.html
- scene: Orange field. The real Voice Lab call button grows into a big pulsing cream orb with ink outline; colourful sound bars dance on both sides; ripple rings shoot out; "Voice Lab" sticker slams on top.
- voiceover: "Then say it out loud in the Voice Lab."
- asset_candidates: assets/voice-dark.png — Voice Lab call screen
- focal: assets/voice-dark.png
- roles: voice-dark = hero for the first beat (cropped to the call card), then the rebuilt orb stage
- sfx: whoosh, soundwave swell, pop

Scene 1 (0.0–1.0s): orange field; the real Voice Lab call card (cropped tight around the orange call button and "Call Tutelage AI", in a phone card, ~86% width) bounces in; on "say it", the call button gets pressed (squash).
Scene 2 (1.0–2.2s): on "out loud", zoom through the button into a big cream orb (ink outline, ~55% width, y≈800); ripple rings in pink/teal/yellow shoot outward one after another; voice bars on both sides bounce in a fixed pattern.
Scene 3 (2.2–end): on "Voice Lab", a "Voice Lab" sticker slams in above the orb (ink box, cream text, rotated 4°) with a shake; a small "Fluency 82" chip pops beside the orb.

## Frame 6 — Instant flashcards

- type: feature_showcase
- blueprint: device-surface-showcase (Adapt)
- duration: 3.15s
- transition_in: squeeze
- status: animated
- src: compositions/frames/06-cards.html
- scene: Pink field. Word chips ("bought", "market", "perseverance") rain in and stack into flashcards; the top card flips to "perseverance" with a glint; "17 due today" sticker pops.
- voiceover: "New words? Instant flashcards."
- asset_candidates: assets/vocab-dark.png — Vocabulary flashcard + mastery
- focal: assets/vocab-dark.png
- roles: vocab-dark = supporting (cropped real flashcard + mastery bars shown inside a card behind the stack)
- sfx: card flips, pop

Scene 1 (0.0–1.0s): pink field; on "New words?", three word chips (cream, yellow, teal; ink outlines) rain down from the top with rotation and land in a stack at y≈800.
Scene 2 (1.0–2.0s): on "Instant", the stack fans out and snaps back; the top card does a big 3D flip to "perseverance" (Poppins 700) with a white glint sweep.
Scene 3 (2.0–end): on "flashcards", a crop of the real Vocabulary mastery bars slides in below the card inside a phone card and fills; a "17 due today" orange sticker pops with overshoot.

## Frame 7 — Skills go up

- type: benefit_highlight
- blueprint: dataviz-countup (Adapt)
- duration: 3.176s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/07-skills.html
- scene: Teal field. Four chunky bars shoot up like a bar chart (each its own colour) with numbers counting: Grammar 87, Vocabulary 75, Fluency 82, Speaking 82; a big arrow swoops up; confetti pops on "and up!".
- voiceover: "And watch your skills go up, and up!"
- asset_candidates: assets/dashboard-dark.png — student dashboard, Skills card
- focal: rebuilt bars
- roles: dashboard-dark = background texture only (the Skills card region, faint), never its hero area (0 min / 0 streak)
- sfx: riser, impact hit, confetti pop

Scene 1 (0.0–1.0s): teal field; "Your skills" title slams in at top (cream, ink outline/shadow); four vertical bar tracks with ink outlines appear.
Scene 2 (1.0–2.6s): on "go up", the bars shoot up one after another (orange, pink, yellow, cream) with overshoot, numbers count to 87 / 75 / 82 / 82 and labels Grammar / Vocabulary / Fluency / Speaking sit under them.
Scene 3 (2.6–end): on "and up!", a big ink arrow swoops upward across the bars, 20 confetti pieces in the palette burst once (deterministic) and fall; a "B1 → B2" sticker pops.

## Frame 8 — Start free

- type: cta
- blueprint: logo-assemble-lockup (Reproduce)
- duration: 4.4s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/08-start.html
- scene: Cream field. The gold mark bounces in with the TUTELAGE letters, "Start free today" slams in, the orange "Start free" button pops with a shine and a hand-drawn arrow pointing at it, "ai.tutelage.krd" under it; holds.
- voiceover: "Tutelage AI. Start free today."
- asset_candidates: assets/only-logo-black-border-yellow-bg.svg — the gold Tutelage mark; assets/logo-with-text-only-white.svg — white Tutelage wordmark
- focal: assets/only-logo-black-border-yellow-bg.svg
- roles: mark = hero · wordmark = supporting (on cream use it inside an ink pill or recolour the letters to ink)
- sfx: whoosh, logo sting, button click

Scene 1 (0.0–1.2s): cream field; on "Tutelage AI", the gold mark bounces in at y≈620 (~34% width) with a ring burst; the TUTELAGE letters slam in under it in ink.
Scene 2 (1.2–2.6s): on "Start free", an orange "Start free" button (ink outline, hard shadow, cream text) pops in at y≈1100 with overshoot; a hand-drawn ink arrow draws toward it; a shine sweeps across the button once.
Scene 3 (2.6–end): "ai.tutelage.krd" fades in under the button; two sparkle stickers twinkle once; everything holds still for the last ~0.8s.
