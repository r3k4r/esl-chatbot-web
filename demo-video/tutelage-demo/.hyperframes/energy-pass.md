# Energy pass — make every frame more alive (client feedback)

The client watched the first cut and said: "add more fun to it and more moving … something not that boring, people like to watch!"
You are UPGRADING an existing, working frame file in place. Keep everything that is already right:
the frame id, the composition contract (template, #root, one paused timeline at window.__timelines[id]),
the real screenshots/logos, the real copy, the voice timing (every reveal still lands on its spoken word),
the caption keep-out (nothing below y = 900), Poppins only, orange #F59E0B as the only accent on ink #1C1B1B.
Read the current file first, then rewrite it with MORE MOTION and MORE PERSONALITY.

## What "more fun" means here (apply all of it)

1. **A living background, never a flat still ink.** Add a full-duration background layer with ONE slow deterministic
   motion across the whole frame: a soft orange radial light (≈ 8–14% opacity, large, blurred) that drifts/sweeps
   across, plus a very faint dot/line grid (≈ 4–6% opacity) that slowly parallaxes. Tween across the full frame
   duration (no infinite repeat, no randomness).
2. **A camera that moves.** Wrap the stage in a camera container and give it a motivated move: a gentle 3D dolly
   (perspective ~1600px, rotateX/rotateY 4–10°, scale 1.0→1.06) that changes on the key cue, not a lazy loop.
   App windows/screens float with depth: tilt in 3D, cast a soft long shadow, and parallax slightly against the
   background and foreground layers (3 depth layers).
3. **Springy, confident entrances.** Use `back.out(1.4–1.8)` / `expo.out` pops for cards, chips, bubbles and labels
   (playful is OK now). Fast moves get a short motion-blur (filter blur on x/y travel, cleared at rest).
   Stagger groups so things arrive like a rhythm, not all at once.
4. **One BIG kinetic keyword per frame** (the word in the table below), set huge in Poppins 700, punching in on its
   spoken word with a scale-slam (1.4→1) or a per-letter cascade, in orange or off-white with an orange underline
   swipe. It may sit behind/beside the product as a giant graphic layer (≈ 18–30% of frame height), then settle to a
   lower opacity so the product stays the hero. It is ONE word, never a sentence.
5. **Micro-life on held moments.** After the last reveal, keep ONE subtle thing alive (a caret blink, a glow pulse
   done as 2–3 finite tweens, a tiny float of a card) so no frame ever freezes dead — but no lazy breathing of
   everything.
6. **Stay seek-safe.** fromTo for entrances, everything on the one paused timeline, no CSS transitions/animations,
   no Math.random/Date.now, no repeat: -1. Total timeline length must not exceed the frame duration given to you.

## Per-frame direction (the keyword + the signature upgrade)

| frame | keyword (on its spoken word) | upgrade |
|---|---|---|
| 01-i-just-freeze | "freeze" — on "freeze" (1.79s) | The typed lines stay. On "freeze" the whole line SHIVERS (3–4 tiny x-jitters) and a cold frost-white flash washes over it, then the caret blinks alone. Giant faint "freeze" sits behind in off-white at ~6% opacity, sliding slowly. Camera slowly pushes in across the frame. |
| 02-meet-tutelage | "Tutelage" — the lockup itself | The logo assembly gets a burst: 6–10 thin orange rays/lines shoot out from the mark as it blooms (one-shot), a soft light sweep crosses the wordmark (a glint), the supporting line types in. Background light swirls behind the mark. |
| 03-it-talks-back | "Talk" — on "Chat" (0.30s) | The chat window flies in from a 3D tilt with motion blur and keeps a slow dolly; each bubble pops with back.out and a tiny overshoot; small floating chips ("your day", "your work", "your plans") pop around the window on their words (1.0s / 1.75s / 2.65s) and drift. Giant "Talk" behind on the left. |
| 04-corrected-kindly | "kindly" — on "kindly" (2.69s) | Keep the strike + rewrite (the hero moment). Add: the camera punches in on "Slip up?", the strike line draws with a red→orange flash, "went" lands with a pop + a small orange sparkle burst (4–6 particles, deterministic), the Better phrasing card does a subtle 3D tilt-settle. Giant "kindly" in orange script-like weight appears on its word, then settles behind. |
| 05-say-it-out-loud | "Speak" — on "Ready to speak?" (0.68s) | The orb gets alive: concentric rings ripple outward on each spoken cue (finite, 3–5 rings), the voice bars dance in a deterministic pattern while speaking, the orb scales gently with the "voice". Score chip flies up with a spin-in and the number counts. Giant "Speak" slams on the left at the start. |
| 06-words-that-stick | "Remember" — on "come back" (2.94s) | Word chips fly in on curved arcs with rotation and motion blur, the card stack shuffles (cards fan out then stack), the top card does a big 3D flip with a highlight glint, mastery bars fill with a bouncy stagger and a "17 due today" chip pops with overshoot. Giant "Remember" behind. |
| 07-watch-yourself-improve | "Improve" — on "climb" (4.48s) | Bars fill with an energetic stagger and slight overshoot, numbers count with a scale pulse when they land, an arrow/up-trend line draws upward across the panel, a glow bursts behind the panel on "climb", small "+" sparkles rise. Giant "Improve" slams on "climb". |
| 08-start-free | "Start" — the CTA | Frame is now 7.0s (voice ends at 5.54s, then a calm hold). The logo sting keeps its ring + bloom; "Talk. Improve. Repeat." land as three bouncy word slams on their words; the Start free button pops with overshoot, then a soft shine sweeps across it (once) and a gentle pulse ring (2 finite pulses) draws the eye during the hold; the background light swells slowly to the end. Everything holds still in the last ~0.6s. |
