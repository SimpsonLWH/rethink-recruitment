# Rivet demo video — production plan

Prepared 2026-11-15 02:50 EET. Target: **2:00–2:10**, 1920×1080, 30 fps, H.264 MP4, caption-first. Record with **Recordly**; assemble in **Remotion**.

This is a demo, not a testimonial. All data is synthetic and the video must not claim a live model run, a validated assessment or a production hiring system.

## 1. What the video has to prove

1. Rivet is a **two-sided product**, not a landing page.
2. The **role's bar is stated before the first swipe**, and both sides see it.
3. Evidence stays **advisory**; a human decides. The evidence reading explains the record and cannot change the bar or decision.

Keep those three ideas in every edit decision. If a shot does not support one of them, cut it.

## 2. Source state and pre-flight

- Source: app commit `773da7b`; deployed demo https://rethink-recruitment.vercel.app.
- Record from the **local seeded build** for reliability:
  ```bash
  cd recruitment-app
  npm install
  npm run seed
  npm run dev
  ```
- Open a fresh browser profile. No extensions, no bookmarks bar, no personal tabs, no visible terminal with secrets. The frame must never contain a key, `.env`, cookie, email address or real data.
- Set a **1440×900 content viewport** (or 1512×982 if the display is larger) at 100% zoom. Keep the same viewport for every scene.
- Do **not** configure `NVIDIA_API_KEY`. The demo must show **Deterministic reading · demo mode**. If a key is ever configured, do not record a "live" claim unless a real capture exists and is registered.
- Reset state between takes: `npm run seed` (or use a fresh temporary account) and reload. Do not leave a test account's state in a later shot.
- Close notifications, Slack, mail and any window that could pop into frame.

## 3. Recordly setup

- Capture the browser window at **16:9**, target **2560×1440** if the display allows; otherwise 1920×1080. Do not mix scales.
- **60 fps** for slow-down headroom; export at 30 fps from Remotion.
- Cursor visible; no click highlight unless Recordly provides a subtle one. Do not over-zoom or add pans; let the UI be readable.
- No system audio. Record narration separately (or use captions only) so the edit is not tied to one take.
- Record each scene as a **separate take** with 2 seconds of handle before and after. Slate at the start by filename or a quiet spoken number, never by typing in frame.
- Naming: `takes/01-landing-v1.mp4`, `takes/02-enter-v1.mp4`, etc. Keep the raw takes; do not delete them until the final export is approved.

## 4. Scene-by-scene record plan

Times below are **edit targets**, not raw take lengths.

| # | Time | Scene | Start state | Actions to record | End state | Overlay / caption |
|---|---|---|---|---|---|---|
| 1 | 0:00–0:08 | Cold open | Landing at `/` | Let the hero settle; slow scroll to "One bar. Both sides see it." | Evidence record visible | "Evidence first, then decide." |
| 2 | 0:08–0:16 | Two doors | `/enter` | Hover the candidate and hiring doors; click **Open candidate demo** | Candidate dashboard | "Two flows. One bar." |
| 3 | 0:16–0:30 | Candidate evidence | Candidate dashboard | Assessments → open **JavaScript: Data handling** result (80/100) → show the one-sitting copy → back | Assessment result | "A recorded result, not a CV screen." |
| 4 | 0:30–0:42 | Candidate feed | `/jobs` or dashboard | Open a role card; hover the evidence badge to show exact version and score; point at Like / Priority counters | Role card with stated bar | "The bar is on the card." |
| 5 | 0:42–0:56 | Employer need | Switch to Northwind Labs (or Kallio Capital) | Role cards → open an existing role card → scroll "The need" and "The evidence you accept"; show two assessment bars | Role card form | "State the bar before browsing." |
| 6 | 0:56–1:10 | Employer review | Review / feed | Show the mixed feed; switch to the below-bar / no-evidence view; hover an evidence badge; open one review card | Review card with fixed bar | "Below-bar stays visible. No auto-reject." |
| 7 | 1:10–1:28 | Evidence reading | Review card | Click **Read the evidence**; hold on the deterministic label, covered requirements with citations, open questions; close; show the bar and actions unchanged | Review card | "Advisory. Never a decision." |
| 8 | 1:28–1:44 | Invitation → match | Candidate invitations | Accept a message-only invitation; switch to employer; say yes; open match; move stage; close with an honest outcome; check candidate updates | Outcome wording | "A match needs two yeses." |
| 9 | 1:44–1:55 | Close | `/how-it-works` or landing footer | Hold on the public URL; end card | End card | "Synthetic demo. No keys. Human decides." |

Total edit target ~1:55; final should be under 2:10.

### Take notes

- Scene 3: the result screen must show the final score and the one-sitting rule. Do not stage a fake score.
- Scene 7: the dialog must show **Deterministic reading · demo mode**. Do not edit out that label.
- Scene 8: the invitation is message-only; do not show it as an application. The match requires the second yes.
- If a flow feels slow, cut it in Remotion rather than speeding up the whole clip.

## 5. Narration script (optional but recommended)

Record this separately at a calm pace. If used, keep the visuals subordinate to the voice.

1. "Hiring events produce volume, not signal. Candidates polish CVs. Teams arrive with vague needs."
2. "Rivet flips the order: the role's bar comes first. Candidates show a recorded assessment against that exact bar."
3. "Hiring teams see the evidence before they swipe. Below-bar candidates stay visible. Nothing is ranked or auto-rejected."
4. "The evidence reading explains the record and names the open questions. It cannot change the bar, the feed or the decision."
5. "Two explicit yeses make a match."
6. "Everything here is a synthetic demo. No keys. No live model claim. Evidence first, then decide."

Word count ~90; at a measured pace this is about 40–50 seconds. Leave room for UI pauses; the total video can still be around 2 minutes.

## 6. Remotion assembly

### Folder

```
video/
  package.json
  remotion.config.ts
  src/index.ts
  src/Root.tsx
  src/RivetDemo.tsx
  src/scenes.ts
  src/Overlay.tsx
  public/
    recordings/01-landing.mp4 ... 09-close.mp4
    vo.wav
    fonts/
```

### Composition

- Composition id `RivetDemo`; 1920×1080; 30 fps; duration = sum of scene durations (about 3,450–3,900 frames for 115–130 s).
- `scenes.ts` is the single source of truth:
  ```ts
  export type Scene = {
    id: string; src: string; trimBefore: number; durationInFrames: number;
    title?: string; caption?: string;
  };
  ```
- `RivetDemo.tsx` maps scenes to `<Sequence>` + `<OffthreadVideo src={staticFile(src)} trimBefore={...} />`.
- Keep all video local in `public/recordings`; no remote URLs in the final render.
- Audio: one `<Audio src={staticFile('vo.wav')} />` if narration exists; otherwise no audio track. Do not add music unless it is licensed and mixed under the voice.

### Visual system

- 1920×1080 frame; 96 px side margins; captions bottom-left at y=900–980; one line, maximum two.
- Brand: paper `#F7F5F0`, ink `#171717`, accent `#A64056`, bright rose `#E9B4C0`. Use Inter for captions and Fraunces (or the deck's Iowan) for the few title cards.
- Open on a 12-frame fade from paper. Between scenes use a 8–12 frame opacity/position transition; no spinning, zooming or glitch effects.
- Hold a scene for at least 2 seconds after the last click so the viewer can read.
- Slow down only when the UI needs it: `playbackRate={0.85}` on a clip, or trim in Remotion. Never speed up typing without a visible reason.
- Add a small "Synthetic demo" label on every scene that could be mistaken for real data (at minimum scenes 3–8).

### Render

```bash
npx remotion render src/index.ts RivetDemo out/rivet-demo.mp4 \
  --codec=h264 --crf=18 --pixel-format=yuv420p
```
Then verify duration, audio, file size and playback. Upload to the chosen host and put the URL in the submission form.

## 7. Edit decision list

| Clip | Trim | Duration | Overlay |
|---|---|---|---|
| 01-landing | keep the hero + one short scroll | 8 s | "Evidence first, then decide." |
| 02-enter | cut between the two doors | 8 s | "Two flows. One bar." |
| 03-candidate-result | cut to the result and the one-sitting line | 14 s | "A recorded result, not a CV screen." |
| 04-candidate-feed | hold on the badge and the stated bar | 12 s | "The bar is on the card." |
| 05-employer-need | cut to the two assessment requirements | 14 s | "State the bar before browsing." |
| 06-employer-review | below-bar view, then the review card | 14 s | "Below-bar stays visible. No auto-reject." |
| 07-reading | hold on the deterministic label and citations | 18 s | "Advisory. Never a decision." |
| 08-mutual | invitation, second yes, outcome | 16 s | "A match needs two yeses." |
| 09-close | end card with URL/repo | 11 s | "Synthetic demo. No keys." |

## 8. QA before upload

- [ ] No live-model claim: the reading says deterministic demo mode, and the narration agrees.
- [ ] No key, token, email, phone, real person or real employer in any frame or audio.
- [ ] Every number matches the deck: 148 tests, 32 UI assertions, 29 screens, 12 assessments, 47 questions, 21/12/21 dataset.
- [ ] The bar is visible on screen when the voice says "bar".
- [ ] The invitation is described as message-only; the match requires two yeses.
- [ ] Captions match the spoken words, are readable at 1080p, and stay inside safe margins.
- [ ] No cursor stuck, no accidental hover, no loading spinner, no error toast, no dev overlay.
- [ ] 1920×1080, 30 fps, H.264, under ~2:10, audio peaks under -1 dBFS, no music clipping.
- [ ] Final file plays end to end on a clean machine and the link is public/unlisted as intended.

## 9. Schedule (Helsinki)

| Time | Action |
|---|---|
| 03:00–03:15 | Seed, reset browser, set Recordly area, do a 10-second test take |
| 03:15–04:30 | Record scenes 1–9 as separate takes |
| 04:30–05:30 | Log the takes, mark in/out points, record voiceover |
| 05:30–06:45 | Assemble in Remotion; add captions and end card |
| 06:45–07:30 | Review against this checklist; export; upload |
| 07:30–08:00 | Put the link in the submission and keep a local copy |

Hard deadline for the Junction submission is 10:00; the export should be done by 08:00 to leave buffer.

## 10. Contingencies

- Recordly fails: use OBS with the same scene list and naming. Do not change the edit plan.
- Local app behaves differently from the deployed demo: record the local seeded build; add one short shot of the public URL at the end as proof.
- NVIDIA key is configured and a live capture exists: make a separate 20–30 s `RivetReading` cut that shows the live/cached label and the capture artifact. Do not mix it into the main demo or call the deterministic fallback "live".
- A scene is unusable: cut it; do not replace it with a static screenshot unless the voice needs it.
- Time is short: a clean 60-second cut of scenes 2, 4, 6, 7 and 9 is better than a rushed 2-minute cut with errors.
