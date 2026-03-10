# Pipe Sprint

Pipe Sprint is a Mario-inspired 2D platformer built with React, Vite, and the HTML canvas API. The game runs as a single-screen web app with side-scrolling movement, coins, patrolling enemies, pits, respawns, and a finish flag.

## Gameplay

You start on the left side of the level and need to reach the flag on the far right.

- Jump across pits and elevated platforms.
- Collect coins placed throughout the course.
- Stomp enemies from above to remove them.
- Avoid walking into enemies or falling into hazards, or you will respawn at the start.

## Controls

### Desktop

- `A` / `Left Arrow`: move left
- `D` / `Right Arrow`: move right
- `W` / `Up Arrow` / `Space`: jump

### Mobile / Touch

- Use the on-screen `Left`, `Jump`, and `Right` buttons below the canvas.

## Local Development

### Prerequisites

- Node.js 25+
- npm 11+

### Install

```bash
npm install
```

### Run the game

```bash
npm run dev
```

The Vite dev server is configured to run on:

- `http://localhost:3000`

### Production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Available Scripts

- `npm run dev`: start the local development server on port `3000`
- `npm run build`: create an optimized production build in `dist/`
- `npm run preview`: serve the production build locally on port `3000`
- `npm run lint`: run ESLint across the project

## Project Structure

```text
.
|-- index.html
|-- package.json
|-- public/
|   `-- vite.svg
|-- src/
|   |-- App.css
|   |-- App.jsx
|   |-- index.css
|   |-- main.jsx
|   `-- assets/
|       `-- react.svg
`-- vite.config.js
```

## Implementation Notes

- The game loop is implemented with `requestAnimationFrame`.
- Level data, enemy routes, coin placement, and collision solids are defined directly in `src/App.jsx`.
- Rendering is done with canvas drawing primitives instead of sprite assets.
- The HUD and control shell are rendered with React, while gameplay state is updated in the canvas loop.
- Vite is pinned to port `3000` in `vite.config.js` for both `dev` and `preview`.

## Verification

The current project has been checked with:

```bash
npm run lint
npm run build
```

## Future Improvements

- Add sprite sheets and animation states for the player and enemies
- Add checkpoints instead of full-start respawns
- Add sound effects and music
- Split level data and renderer logic into separate modules

