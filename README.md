# Telt

Telt is a Tetris-inspired browser game where falling blocks can crumble into individual sand particles.

There are 2 gamemodes: Classic Tetris and a version where each block crumbles into sand particles

## Build Process

The project is almost fully built in TypeScript, with rendering the board handled through Canvas API. The extension contains the tetris physics and mechanics in the `board.ts` (renders the board), `pieces.ts` (piece spawning and rotation), `game.ts` (game loop), `renderer.ts` (draws each fram of the canvas), and `main.ts` (which connects the canvas to start the game).

`board.ts` just has the conventional Tetris grid. The board stores data on each cell, checking if they are empty or have a block occupying the space. It's not responsible for drawing pieces, which is left for `renderer.ts`

`pieces.ts` contains all the info for each tetris piece. Here we define what type, shape, color, position and rotation pieces that fall from the top have. Both normal mode and sand mode use the same pieces, so they both come from here.

`game.ts` contains all the rules and phases of the game. The file contains all the data about what should happen beyond the game itself: gamemodes, win/lose, menus and changing the grid based on which mode is being played. 

`main.ts` connects the HTML to all the other typescript files of the game. In handles player input and some animation loops.

`renderer.ts` covers the drawing for the game, drawing the different screens and the different gamemodes.

`sand.ts` covers the particle simulation for the sand gamemode, where the pieces break apart. This is what determines how the sand grains fall and interact with surrounding particles. The color end to end detection to clear the colors for the sand gamemode is also here. This portion uses some ai as it was relatively difficult to implement on my own.

The chrome extension is built originally like a webapp using Vite and then packaged into `/dist` for a chrome extension.  `npm run build` bundles the application to generate the production files for the `/dist` which I then unpacked onto chrome and submitted it for review. After a few days, they accepted my extension! (Keep in mind it costs 5$ to create a dev account for chrome extensions.)


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
