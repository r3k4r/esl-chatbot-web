---
workflow: product-launch-video
flow: automation
storyboard: no
message: "Scared to speak English? Practise with an AI tutor that fixes your mistakes kindly — start free."
destination: website-embed
aspect: 1920x1080
language: en
audience: Kurdish-speaking English learners scrolling Instagram / TikTok
length: 30s
angle: reel — fast, colourful, kinetic version of the one-learner demo
---

## Intent

FORMAT CORRECTION from the user: "not a reel!! something like reel, not reel size" → 16:9 landscape for the website, with reel-style pacing/colour/motion.

Version 2 of the Tutelage AI demo (version 1 is demo-video/tutelage-demo, 16:9, calm). The user:
"something more moving, and like the other instagram reels they have great transitions and fade sounds
and those things with talking, the things animating and moves fast and not boring! … and more colourful!
just do it whatever you recommend". Landscape 16:9 (reel STYLE, not reel size), ~30s, energetic narration, bold colour fields,
kinetic type, fast cuts every 3–4s, a whoosh/impact on every transition, music that swells and dips.

## Assets

- capture/assets/*.png — the same real 2x product screens as v1 (chat-past-dark, chat-voice-dark, voice-dark, vocab-dark, dashboard-dark, chat-new-dark).
- capture/assets/only-logo-black-border-yellow-bg.svg, logo-with-text-only-white.svg — the real logo files.

## Customizations

- Colourful palette (frame.md hand-fixed): orange #F59E0B lead + pink #FF5C8A, teal #14C8B4, sun #FFD23F on cream #FFF7EC and ink #1C1B1B; Creative Mode layout bones (thick ink outlines, hard offset shadows), Poppins.
- Voice: energetic, upbeat English narrator; music: upbeat modern pop/electronic 120–128 bpm.
- SFX on every cut (whoosh / swoosh / impact / pop / riser), short music dips under key lines.
- Captions on, bold, no box (v1 rule: subtitles have no background or border).

## Notes

- Usage: session limit nearly reached at planning time; frames are built after the reset.
- DONE before the reset: frame.md (Creative Mode, colours hand-fixed), STORYBOARD.md (8 frames, full shot design, synced
  durations, F8 = 4.4s hold), SCRIPT.md, voice (Keeva 1.08, lines faded + 0.25s breath; originals in assets/voice-original),
  music (real MP3, 29s, vol 0.14), 20 SFX fetched, assets + fonts staged, frame packets built (.hyperframes/frame-packets/).
- NEXT: dispatch 8 frame workers (role _role.md + packet + this BRIEF's look; canvas 1080×1920; keep content y 220–1500;
  captions below y 1594; Poppins files in assets/fonts; voice word timings in audio_meta.json) → time the 20 SFX offsets
  to the cues in audio_meta.json (fetch-sfx puts them all at 0 and resets voice durations: re-apply the durations above) →
  captions (no box/border, like v1) → assemble → transitions inject → lint/check/snapshot → preview → render on the user's go.
- Lessons from v1: HeyGen music arrives as WAV named .mp3 (convert, or the preview stalls); keep every keyword/heading in
  proper English casing (the frame.md lowercase display rule is off for this brand); captions must have no background/border.
- Render only with the user's go (it loads their PC).
