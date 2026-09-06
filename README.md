# Telt

> Tetris that melts into sand.

Telt is a Tetris-inspired browser game where falling blocks can crumble into individual sand particles.

Instead of simply clearing completed rows, **Sand Mode** turns placed pieces into a cellular-automata-style simulation. Particles fall, pile up, and interact with other particles, creating a more chaotic version of traditional Tetris.

## Features

* **Normal Mode** — classic falling-block gameplay
* **Sand Mode** — blocks crumble into simulated sand
* Color-based sand particles
* Falling and settling particle simulation
* Matching-color clearing mechanic
* Animated clear effects
* Keyboard and mouse controls
* Chrome extension support

## Tech Stack

* TypeScript
* Vite
* HTML Canvas
* CSS
* Custom particle simulation
* Chrome Extensions Manifest V3

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

This is the core idea behind Telt: **what happens when Tetris pieces stop behaving like rigid blocks?**

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
