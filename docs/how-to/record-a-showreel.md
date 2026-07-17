# How to record a showreel video

This guide records the flock canvas to a clean MP4 — a portfolio showreel that
tours every scene, leading and scattering the flock in each. The recorder is
**dev-only** ([`lib/flock/dev-recorder.ts`](../../lib/flock/dev-recorder.ts)); it is
wired in only when `NODE_ENV !== "production"` and ships no route or production code.

There are two capture paths. Use the **deterministic** path — it is the one that
works reliably in an automated/headless browser. The real-time path is documented
last as a fallback for a fully interactive local browser.

> Why two paths: an automated preview browser renders the tab with
> `document.hidden === true`, which pauses `requestAnimationFrame`. A real-time
> `MediaRecorder` capture then freezes between frames and writes a broken,
> non-seekable timeline. Driving the simulation by hand at a fixed timestep sidesteps
> that entirely.

## Prerequisites

- `ffmpeg` on your PATH (assembles frames into MP4).
- The dev server running (`npm run dev`) with the app open in the browser you will
  drive.

## Deterministic frame-stepped capture (recommended)

This path drives the engine one fixed 30fps frame at a time via
`window.__inkcap`, renders each frame — canvas plus the wordmark/caption chrome
drawn on by `drawChrome` — to a JPEG, and POSTs batches to a small localhost sink.
`ffmpeg` then assembles a constant-30fps MP4.

The harness emits frames to `http://127.0.0.1:8791/frames` as JSON batches of
`{ i, jpg }` (base64 JPEG). Output geometry is 1920×1080 at 30fps, 210 frames per
scene.

### 1. Start a frame sink on port 8791

Run a tiny HTTP server that accepts `POST /frames` with a JSON body
`{ frames: [{ i, jpg }, …] }`, decodes each base64 JPEG, and writes it as
`f_%05d.jpg`. It must reply with JSON `{ written: <count> }`. Any language works;
keep it listening on `127.0.0.1:8791` for the duration of the capture.

### 2. Drive the capture from the page context

In the browser console (or a single JS evaluation against the page), run the whole
render loop in **one** invocation — hot-module reload nulls the harness closure
between separate calls, so chunk internally but do not split across evals:

```js
const cap = window.__inkcap;
const { totalFrames } = await cap.init('koi');   // opening scene
for (let s = 0; s < totalFrames; s += 105) {      // chunk internally, single call
  await cap.renderRange(s, Math.min(s + 105, totalFrames));
}
'done ' + totalFrames;
```

`init(mode)` sizes the output canvas, reads the resolved fonts, builds the opening
scene, and returns `{ W, H, totalFrames }`. `renderRange(start, end)` renders and
posts that frame range, advancing scenes automatically at each 210-frame boundary
and firing the scripted cursor tour (glide in → two slow loops → hold → a scatter
click at frame 172 of each scene).

### 3. Assemble with ffmpeg

```bash
ffmpeg -framerate 30 -i f_%05d.jpg \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
  ink-flock.mp4
```

For a seamless loop, crossfade the last ~0.8s tail back over the head with an
`xfade` filter. The shipped `ink-flock.mp4` at the repo root was produced this way
(1920×1080).

### 4. Still and animated companions (optional)

`ink-flock-poster.webp` (a still) and animated `ink-flock.webp` were generated with
Pillow (`pip install --user Pillow`) rather than ffmpeg, because the local ffmpeg
build lacked a WebP encoder.

## Real-time capture (fallback, interactive browser only)

In a fully interactive local browser where `requestAnimationFrame` runs normally,
you can capture the live canvas directly. The harness exposes `window.__inkflock`:

```js
window.__inkflock.record();          // starts a captureStream recording
// ... wait for the scripted tour across all scenes to finish ...
window.__inkflock.result;            // { mime, ext, bytes, base64 } when done
window.__inkflock.error;             // populated instead if it failed
```

`record()` swaps the page's sparse/drifting engine for a capture-tuned one (natural
density and pace read better on video), tours every scene, and resolves with the
encoded video as base64. Pull `result.base64`, decode it, and write it to a file
with `result.ext`. Do **not** use this path in an automated/headless browser — it
will produce frozen, broken output for the reason given above.
</content>
