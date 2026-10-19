# ChessKey

ChessKey is a Firefox add-on for lichess.org that locks Lichess games until you reach your Puzzle Streak goal. Reaching the goal unlocks games for ten minutes, and every 5 more puzzles past it unlocks another ten.

## Building from source

The add-on's JavaScript (`dist/bundle.js`) is produced by webpack from the TypeScript in `src/`. These steps reproduce it exactly.

### Requirements

- Any OS that runs Node.js (built on Windows 10; Linux and macOS work the same way)
- Node.js 22.13.1 (https://nodejs.org/) and the npm that comes with it (npm 10 or later)

All other build tools (TypeScript, webpack, ts-loader, sass and the loaders) are pinned in `package.json` / `package-lock.json` and installed by `npm ci`.

### Steps

From the directory containing this README:

```
npm ci
npm run build
```

`npm run build` runs webpack (`webpack.config.js`) and writes:

- `dist/bundle.js` and `dist/bundle.js.map`: the content script and options page script
- `dist/options.html`: the options page, generated from `src/template.html`

The add-on package is then `manifest.json`, `icons/` and `dist/`.

### Tests

```
npm test
```
