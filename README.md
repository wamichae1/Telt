# Telt

Telt is a Tetris-inspired browser game where falling blocks can crumble into individual sand particles.

There are 2 gamemodes: Classic Tetris and a version where each block crumbles into sand particles

## Build Process

The project is almost fully built in TypeScript, with rendering the board handled through Canvas API. The extension contains the tetris physics and mechanics in the `board.ts` (renders the board), `pieces.ts` (piece spawning and rotation), `game.ts` (game loop), `renderer.ts` (draws each fram of the canvas), and `main.ts` (which connects the canvas to start the game).

`sand.ts` covers the particle simulation for the sand gamemode, where the pieces break apart. This is what determines how the sand grains fall and interact with surrounding particles. The color end to end detection is also here. 

## Stack

Built with TypeScript and Vite, rendered on an HTML canvas, packaged as a Chrome extension (Manifest V3). 

## Running Locally

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/Telt.git
cd Telt/telt
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open the local URL shown by Vite.

## Building the Extension

Create a production build:

```bash
npm run build
```

The Chrome extension will be generated in:

```text
telt/dist/
```

To load it manually in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Select **Load unpacked**
4. Choose the `telt/dist` folder

## Game Modes

### Normal

Traditional Tetris-style gameplay. Move and rotate falling pieces, complete lines, and keep the board from filling up.

### Sand

Placed pieces break apart into individual particles. The particles fall and settle according to the simulation, while connected matching colors can trigger clears.

## Project Structure

```text
telt/
├── public/
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── board.ts
│   ├── game.ts
│   ├── main.ts
│   ├── pieces.ts
│   ├── renderer.ts
│   └── sand.ts
├── index.html
├── package.json
└── vite.config.ts
```

## License

This project is currently available for personal and educational use.
