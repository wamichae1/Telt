import { COLS, ROWS } from "./board";
import {
  createGameModel,
  getDisplayedCount,
  getDisplayedCountLabel,
  goToMenu,
  hardDrop,
  restartGame,
  rotateActivePiece,
  softDrop,
  startMode,
  tryMovePiece,
  updateGame,
  type GameMode,
} from "./game";
import {
  drawBoard,
  type HoveredButton,
} from "./renderer";

const canvas = document.querySelector<HTMLCanvasElement>("#game");

if (!canvas) {
  throw new Error("Canvas not found");
}

const context = canvas.getContext("2d");

if (!context) {
  throw new Error("Canvas context not available");
}

const ctx: CanvasRenderingContext2D = context;
const scoreElement = requireElement<HTMLElement>("#score");
const countElement = requireElement<HTMLElement>("#lines");
const countLabelElement =
  requireElement<HTMLElement>("#stat-label");

canvas.width = COLS * 30;
canvas.height = ROWS * 30;

const MENU_BUTTONS: Record<GameMode, [number, number, number, number]> = {
  normal: [72, 184, 96, 32],
  sand: [72, 228, 96, 32],
};

const GAMEOVER_BUTTONS: Record<
  "restart" | "menu",
  [number, number, number, number]
> = {
  restart: [84, 252, 72, 29],
  menu: [64, 288, 112, 29],
};


const game = createGameModel();
let hoveredButton: HoveredButton = null;

let leftHeld = false;
let rightHeld = false;
let leftNextRepeatAt = 0;
let rightNextRepeatAt = 0;
let lastFrameTime = performance.now();

function updateStats() {
  scoreElement.textContent = game.score.toString();
  countElement.textContent = getDisplayedCount(game).toString();
  countLabelElement.textContent = getDisplayedCountLabel(game);
}

function resetHeldInput() {
  leftHeld = false;
  rightHeld = false;
  leftNextRepeatAt = 0;
  rightNextRepeatAt = 0;
}

function processHeldInput(nowMs: number) {
  if (game.phase !== "playing") return;

  if (leftHeld && nowMs >= leftNextRepeatAt) {
    tryMovePiece(game, -1, 0);
    leftNextRepeatAt = nowMs + 80;
  }

  if (rightHeld && nowMs >= rightNextRepeatAt) {
    tryMovePiece(game, 1, 0);
    rightNextRepeatAt = nowMs + 80;
  }
}

function hitButton(
  buttons: Record<string, [number, number, number, number]>,
  x: number,
  y: number,
): HoveredButton {
  for (const [name, [bx, by, bw, bh]] of Object.entries(buttons)) {
    if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
      return name as HoveredButton;
    }
  }

  return null;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  return element;
}

document.addEventListener("keydown", (event) => {
  if (event.key.startsWith("Arrow") || event.key === " ") {
    event.preventDefault();
  }

  if (event.key.toLowerCase() === "r") {
    if (game.phase === "playing" || game.phase === "gameover") {
      restartGame(game);
      resetHeldInput();
    }
    return;
  }

  if (game.phase !== "playing") {
    return;
  }

  const nowMs = performance.now();

  if (event.key === "ArrowLeft" && !leftHeld) {
    leftHeld = true;
    leftNextRepeatAt = nowMs + 150;
    tryMovePiece(game, -1, 0);
  }

  if (event.key === "ArrowRight" && !rightHeld) {
    rightHeld = true;
    rightNextRepeatAt = nowMs + 150;
    tryMovePiece(game, 1, 0);
  }

  if (event.key === "ArrowUp") {
    rotateActivePiece(game);
  }

  if (event.key === "ArrowDown") {
    softDrop(game);
  }

  if (event.key === " ") {
    hardDrop(game);
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") {
    leftHeld = false;
  }

  if (event.key === "ArrowRight") {
    rightHeld = false;
  }
});

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (game.phase === "menu") {
    const hit = hitButton(MENU_BUTTONS, x, y);

    if (hit === "normal" || hit === "sand") {
      startMode(game, hit);
      resetHeldInput();
    }

    return;
  }

  if (game.phase === "gameover") {
    const hit = hitButton(GAMEOVER_BUTTONS, x, y);

    if (hit === "restart") {
      restartGame(game);
      resetHeldInput();
    } else if (hit === "menu") {
      goToMenu(game);
      resetHeldInput();
    }
  }
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  let hovered: HoveredButton = null;

  if (game.phase === "menu") {
    hovered = hitButton(MENU_BUTTONS, x, y);
  } else if (game.phase === "gameover") {
    hovered = hitButton(GAMEOVER_BUTTONS, x, y);
  }

  hoveredButton = hovered;
});

canvas.addEventListener("mouseleave", () => {
  hoveredButton = null;
});

window.addEventListener("blur", resetHeldInput);

function animationFrame(nowMs: number) {
  const elapsedMs = nowMs - lastFrameTime;
  lastFrameTime = nowMs;

  processHeldInput(nowMs);
  updateGame(game, elapsedMs, nowMs);
  updateStats();
  drawBoard(ctx, game, hoveredButton, nowMs);

  requestAnimationFrame(animationFrame);
}

updateStats();
requestAnimationFrame(animationFrame);
