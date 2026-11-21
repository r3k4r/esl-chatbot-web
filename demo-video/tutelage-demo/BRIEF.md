---
workflow: product-launch-video
flow: automation
storyboard: yes
message: "Your AI English tutor: talk, get corrected kindly, and watch yourself improve."
destination: website-embed
aspect: 1920x1080
language: en
audience: Kurdish-speaking English learners (and their teachers) landing on the Tutelage AI site
length: 45s
angle: one learner's session
---

## Intent

The demo video behind the landing page hero's "Watch a demo" button for Tutelage AI, an AI
English tutor. Follow one learner through a real session: chats with the AI tutor and gets a
gentle correction, talks in the Voice Lab, new words land in Vocabulary, the dashboard shows the
streak and progress, then "Start free". Built on the landing page's own line: your AI tutor,
your voice lab, your progress, all in one place. The user wants it stunning, motion-graphic,
user friendly, "like a person with 10+ years of experience made it", "a $10,000 video".
Show the real product, sold with polish.

## Assets

- ../../frontend/public/features/*.webp (+ @2x/@3x) — real student screens (light theme), feature pages' screenshots.
- ../../frontend/app/components/Pages/Home/ChatMockup.vue + DashboardMockup.vue — coded, animated copies of today's AI Chat (dark) and student dashboard.
- ../../frontend/public (logo files) — the Tutelage logo for the end sting.
- Running app on http://localhost:3001 (seed student student_ali) — capture fresh high-resolution screens; nothing in the app is changed.

## Customizations

- English voice-over (Neville — Warm & Easygoing, HeyGen) + music bed; captions on so it works muted.
- Music: calm (user liked track B's character but wants calmer). Keep it LOW under the voice — "so they can hear the person talking": quiet bed, ducked under every narration line.
- Sound effects on the things that move (soft whooshes, pops, a gentle chime on the correction) — user: "not bad".
- Later: also render a version WITHOUT music (voice + SFX only) to compare.
- Cut to the music's beat: the narration sets scene changes, motion accents land on the beat.
- Logo sting at the end, before the "Start free" card.
- Shader (WebGL) transitions between scenes (heavier render, user accepted).
- Look: Tutelage's own brand — orange (brand-primary) on deep ink, Poppins, the real dark AI Chat / Voice Lab / dashboard UI.

## Notes

- "the things we have in here, but the quality is very important!" — every screen must be crisp at 1080p: capture at 2x, never upscale a 1x shot.
- Render is heavy on the user's PC: ask before the final render; no other heavy runs without asking.
- Deferred asks: 2–3 English voices after the script; 2–3 music tracks for the beat grid.
