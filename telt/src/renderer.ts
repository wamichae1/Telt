import { COLS, ROWS, type Cell } from "./board";
import type { GameModel } from "./game";
import {
  PIECE_COLORS,
  type Piece,
} from "./pieces";
import {
  SAND_CELL_SIZE,
  SAND_COLS,
  SAND_ROWS,
  type ClearEffect,
  type SandGrid,
} from "./sand";

const CELL_SIZE = 30;

export type HoveredButton =
  | "normal"
  | "sand"
  | "restart"
  | "menu"
  | null;

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  game: GameModel,
  hoveredButton: HoveredButton = null,
  nowMs = performance.now(),
) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);

  if (game.phase === "menu") {
    drawMenu(ctx, hoveredButton);
    return;
  }

  if (game.modeData.kind === "normal") {
    drawNormalGame(ctx, game.modeData.board, game.piece);
  } else {
    drawSandGame(
      ctx,
      game.modeData.grid,
      game.modeData.sandTick,
      game.modeData.clearEffects,
      game.piece,
      nowMs,
    );
  }

  if (game.phase === "gameover") {
    drawGameOver(ctx, game.score, hoveredButton);
    return;
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "400 22px Oswald, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    `Score: ${game.score}`,
    (COLS * CELL_SIZE) / 2,
    8,
  );
}

function drawNormalGame(
  ctx: CanvasRenderingContext2D,
  board: Cell[][],
  piece?: Piece,
) {
  drawLogicalGrid(ctx);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];

      if (cell) {
        ctx.fillStyle = cell;
        ctx.fillRect(
          col * CELL_SIZE + 2,
          row * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4,
        );
      }
    }
  }

  drawPiece(ctx, piece);
}

function drawSandGame(
  ctx: CanvasRenderingContext2D,
  grid: SandGrid,
  sandTick: number,
  effects: ClearEffect[],
  piece: Piece,
  nowMs: number,
) {
  drawLogicalGrid(ctx);

  for (let y = 0; y < SAND_ROWS; y++) {
    for (let x = 0; x < SAND_COLS; x++) {
      const grain = grid[y][x];

      if (!grain) continue;

      const released = grain.releaseTick <= sandTick;
      const size = released ? SAND_CELL_SIZE - 1 : SAND_CELL_SIZE;
      const inset = (SAND_CELL_SIZE - size) / 2;

      ctx.fillStyle = PIECE_COLORS[grain.colorId];
      ctx.fillRect(
        x * SAND_CELL_SIZE + inset,
        y * SAND_CELL_SIZE + inset,
        size,
        size,
      );
    }
  }

  drawPiece(ctx, piece);
  drawClearEffects(ctx, effects, nowMs);
}

function drawLogicalGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#292d30";
  ctx.lineWidth = 1;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      ctx.strokeRect(
        col * CELL_SIZE,
        row * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE,
      );
    }
  }
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece?: Piece,
) {
  if (!piece) return;

  ctx.fillStyle = piece.color;

  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        ctx.fillRect(
          (piece.x + col) * CELL_SIZE + 2,
          (piece.y + row) * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4,
        );
      }
    }
  }
}

function drawClearEffects(
  ctx: CanvasRenderingContext2D,
  effects: ClearEffect[],
  nowMs: number,
) {
  for (const effect of effects) {
    const progress = Math.min(
      1,
      Math.max(0, (nowMs - effect.startedAtMs) / effect.durationMs),
    );
    const size = Math.max(
      1,
      (SAND_CELL_SIZE - 1) * (1 - progress * 0.75),
    );
    const inset = (SAND_CELL_SIZE - size) / 2;

    ctx.globalAlpha = 1 - progress;

    for (const cell of effect.cells) {
      ctx.fillStyle = PIECE_COLORS[cell.colorId];
      ctx.fillRect(
        cell.x * SAND_CELL_SIZE + inset,
        cell.y * SAND_CELL_SIZE + inset,
        size,
        size,
      );
    }
  }

  ctx.globalAlpha = 1;
}

function drawMenu(
  ctx: CanvasRenderingContext2D,
  hoveredButton: HoveredButton,
) {
  ctx.fillStyle = "#fff";
  ctx.font = "600 32px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "TELT",
    (COLS * CELL_SIZE) / 2,
    150,
  );

  drawButton(
    ctx,
    90,
    230,
    120,
    40,
    "NORMAL",
    hoveredButton === "normal",
  );

  drawButton(
    ctx,
    90,
    285,
    120,
    40,
    "SAND",
    hoveredButton === "sand",
  );
}

function drawGameOver(
  ctx: CanvasRenderingContext2D,
  score: number,
  hoveredButton: HoveredButton,
) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
  ctx.fillRect(
    0,
    0,
    COLS * CELL_SIZE,
    ROWS * CELL_SIZE,
  );

  ctx.strokeStyle = "#292d30";
  ctx.lineWidth = 1;

  ctx.strokeRect(
    45,
    210,
    210,
    190,
  );

  ctx.fillStyle = "#fff";
  ctx.font = "600 24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "GAME OVER",
    (COLS * CELL_SIZE) / 2,
    250,
  );

  ctx.fillStyle = "#9281f7";
  ctx.font = "12px monospace";

  ctx.fillText(
    `SCORE ${score}`,
    (COLS * CELL_SIZE) / 2,
    280,
  );

  drawButton(
    ctx,
    105,
    315,
    90,
    36,
    "RESTART",
    hoveredButton === "restart",
  );

  drawButton(
    ctx,
    80,
    360,
    140,
    36,
    "MAIN MENU",
    hoveredButton === "menu",
  );
}

function drawButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  hovered: boolean,
) {
  ctx.strokeStyle = hovered ? "#fff" : "#9281f7";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = hovered ? "#9281f7" : "#fff";
  ctx.font = "500 13px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    text,
    x + width / 2,
    y + height / 2,
  );
}
