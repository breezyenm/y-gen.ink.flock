# Getting started with Ink Flock

This tutorial takes you from a fresh clone to the running experience, and then has
you make a small, visible change so you can see how the pieces fit. By the end you
will have the flock running locally and will have altered a scene with your own
eyes on the result.

You need [Node.js](https://nodejs.org) (version 20 or newer) installed. You do not
need to know how the simulation works yet — you will just follow the steps.

## Step 1: Install dependencies

From the project root, install the packages:

```bash
npm install
```

This downloads Next.js, React, and the tooling. It takes a minute the first time.

## Step 2: Start the development server

```bash
npm run dev
```

You will see Next.js print a local URL, usually `http://localhost:3000`.

## Step 3: Open the experience

Open `http://localhost:3000` in your browser. You will see a deep teal pond with a
few koi drifting. This is the opening scene.

Try it:

- **Move your mouse.** The koi turn and follow your cursor. A small ink ring marks
  where the cursor is.
- **Click anywhere.** The koi scatter away from the click, and a ripple spreads
  from the point.
- **Click a mode button** in the top-right (鳥 Birds, 鯉 Koi, 群 Safari). The screen
  briefly veils in a colour, then reveals a completely different scene — a migrating
  flock of birds, or a herd of antelope crossing a dusk plain. Each scene has its
  own caption in the bottom-left.

Leave your mouse still for a few seconds. The flock keeps moving on its own, drifting
in a slow figure across the screen. That is the idle behaviour taking over.

## Step 4: Make your first change

Now change something and watch it update live. You will retune how tightly the birds
flock together.

Open [`lib/flock/scenes/birds.ts`](../../lib/flock/scenes/birds.ts). Near the top is
the scene's configuration object, `cfg`. Find the cohesion weight:

```ts
  wCoh: 0.65,
```

Change it to a much larger value:

```ts
  wCoh: 3,
```

Save the file. Next.js reloads the page automatically. Switch to the Birds scene
(鳥) and move your cursor — the birds now clump together far more tightly than
before, because you increased how strongly each bird steers toward its neighbours.

Change it back to `0.65` and save. The flock loosens again.

You just changed the simulation by editing one number in one scene's `cfg` — and
nothing else. That is the core convention of this project: each scene owns its
constants, and the engine steers from them.

## Step 5: Stop the server

When you are done, stop the dev server with `Ctrl+C` in the terminal.

## What you did

You installed the project, ran it, interacted with all three scenes, and altered a
scene's behaviour with a live-reloading edit. You now have a working local setup and
a feel for where scene behaviour lives.

## Where to go next

- To understand how the engine and scenes fit together, read
  [Understanding the Ink Flock architecture](../explanation/architecture.md).
- To add a whole new scene of your own, follow
  [How to add a new scene](../how-to/add-a-scene.md).
- For the exact meaning of every field in a scene's `cfg`, see the
  [scene contract reference](../reference/scene-contract.md).
</content>
