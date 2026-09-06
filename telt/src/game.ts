import {
  canMove,
  clearLines,
  createBoard,
  lockPiece,
  type Cell,
} from "./board";
import {
  createPiece,
  rotatePiece,
  type Piece,
} from "./pieces";
import {
  CLEAR_EFFECT_MS,
  SAND_STEP_MS,
  clearSpanningComponents,
  createActivePieceMask,
  createSandGrid,
  findSpanningComponents,
  pieceHasCellsAboveBoard,
  projectSandToBoard,
  rasterizePieceToSand,
  stepSand,
  type ClearEffect,
  type SandGrid,
} from "./sand";

export type GameMode = "normal" | "sand";
export type GamePhase = "menu" | "playing" | "gameover";

export type NormalModeData = {
  kind: "normal";
  board: Cell[][];
  lines: number;
};

export type SandModeData = {
  kind: "sand";
  grid: SandGrid;
  clears: number;
  sandTick: number;
  sandAccumulatorMs: number;
  sandBiasSeed: number;
  lockSequence: number;
  clearEffects: ClearEffect[];
};

export type ModeData = NormalModeData | SandModeData;

export type GameModel = {
  phase: GamePhase;
  mode: GameMode;
  modeData: ModeData;
  piece: Piece;
  score: number;
  gravityAccumulatorMs: number;
};

const PIECE_GRAVITY_MS = 500;
const MAX_SAND_STEPS_PER_FRAME = 4;

export function createGameModel(): GameModel {
  return {
    phase: "menu",
    mode: "normal",
    modeData: createNormalModeData(),
    piece: createPiece(),
    score: 0,
    gravityAccumulatorMs: 0,
  };
}

export function startMode(game: GameModel, mode: GameMode) {
  game.mode = mode;
  restartGame(game);
}

export function restartGame(game: GameModel) {
  game.modeData =
    game.mode === "normal"
      ? createNormalModeData()
      : createSandModeData();
  game.piece = createPiece();
  game.score = 0;
  game.gravityAccumulatorMs = 0;
  game.phase = "playing";
}

export function goToMenu(game: GameModel) {
  game.phase = "menu";
}

export function getDisplayedCount(game: GameModel): number {
  return game.modeData.kind === "normal"
    ? game.modeData.lines
    : game.modeData.clears;
}

export function getDisplayedCountLabel(game: GameModel): string {
  return game.modeData.kind === "normal" ? "Lines" : "Clears";
}

export function tryMovePiece(
  game: GameModel,
  dx: number,
  dy: number,
): boolean {
  if (game.phase !== "playing") return false;

  const board = getCollisionBoard(game);

  if (!canMove(board, game.piece, dx, dy)) {
    return false;
  }

  game.piece.x += dx;
  game.piece.y += dy;
  return true;
}

export function rotateActivePiece(game: GameModel) {
  if (game.phase !== "playing") return;
  game.piece = rotatePiece(game.piece, getCollisionBoard(game));
}

export function softDrop(game: GameModel) {
  if (tryMovePiece(game, 0, 1)) {
    game.score += 1;
  }
}

export function hardDrop(game: GameModel) {
  if (game.phase !== "playing") return;

  let dropDistance = 0;

  while (tryMovePiece(game, 0, 1)) {
    dropDistance++;
  }

  game.score += dropDistance * 2;
  lockAndAdvance(game);
}

export function updateGame(
  game: GameModel,
  elapsedMs: number,
  nowMs: number,
) {
  if (game.phase !== "playing") return;

  const cappedElapsed = Math.min(Math.max(elapsedMs, 0), 100);

  if (game.modeData.kind === "sand") {
    game.modeData.sandAccumulatorMs += cappedElapsed;
    let sandSteps = 0;

    while (
      game.modeData.sandAccumulatorMs >= SAND_STEP_MS &&
      sandSteps < MAX_SAND_STEPS_PER_FRAME
    ) {
      game.modeData.sandAccumulatorMs -= SAND_STEP_MS;
      stepSandMode(game, nowMs);
      sandSteps++;
    }

    if (sandSteps === MAX_SAND_STEPS_PER_FRAME) {
      game.modeData.sandAccumulatorMs = Math.min(
        game.modeData.sandAccumulatorMs,
        SAND_STEP_MS,
      );
    }

    game.modeData.clearEffects =
      game.modeData.clearEffects.filter(
        (effect) => nowMs - effect.startedAtMs < effect.durationMs,
      );
  }

  game.gravityAccumulatorMs += cappedElapsed;

  while (
    game.gravityAccumulatorMs >= PIECE_GRAVITY_MS &&
    game.phase === "playing"
  ) {
    game.gravityAccumulatorMs -= PIECE_GRAVITY_MS;
    stepPieceGravity(game);
  }
}

function stepPieceGravity(game: GameModel) {
  if (!tryMovePiece(game, 0, 1)) {
    lockAndAdvance(game);
  }
}

function lockAndAdvance(game: GameModel) {
  if (game.modeData.kind === "normal") {
    lockPiece(game.modeData.board, game.piece);

    const cleared = clearLines(game.modeData.board);
    game.modeData.lines += cleared;

    if (cleared === 1) game.score += 100;
    if (cleared === 2) game.score += 300;
    if (cleared === 3) game.score += 500;
    if (cleared === 4) game.score += 800;
  } else {
    if (
      pieceHasCellsAboveBoard(game.piece) ||
      !rasterizePieceToSand(
        game.modeData.grid,
        game.piece,
        game.modeData.sandTick,
        game.modeData.sandBiasSeed + game.modeData.lockSequence,
      )
    ) {
      game.phase = "gameover";
      return;
    }

    game.modeData.lockSequence++;
  }

  game.piece = createPiece();

  if (!canMove(getCollisionBoard(game), game.piece, 0, 0)) {
    game.phase = "gameover";
  }
}

function stepSandMode(game: GameModel, nowMs: number) {
  if (game.modeData.kind !== "sand") return;

  const sand = game.modeData;
  sand.sandTick++;

  const activePieceMask = createActivePieceMask(game.piece);
  stepSand(
    sand.grid,
    sand.sandTick,
    activePieceMask,
    sand.sandBiasSeed,
  );

  const components = findSpanningComponents(
    sand.grid,
    sand.sandTick,
  );

  if (components.length === 0) return;

  const clearedCells = clearSpanningComponents(
    sand.grid,
    components,
  );

  for (const component of components) {
    game.score += 200 + component.length;
  }

  sand.clears += components.length;
  sand.clearEffects.push({
    cells: clearedCells,
    startedAtMs: nowMs,
    durationMs: CLEAR_EFFECT_MS,
  });
}

function getCollisionBoard(game: GameModel): Cell[][] {
  return game.modeData.kind === "normal"
    ? game.modeData.board
    : projectSandToBoard(game.modeData.grid);
}

function createNormalModeData(): NormalModeData {
  return {
    kind: "normal",
    board: createBoard(),
    lines: 0,
  };
}

function createSandModeData(): SandModeData {
  return {
    kind: "sand",
    grid: createSandGrid(),
    clears: 0,
    sandTick: 0,
    sandAccumulatorMs: 0,
    sandBiasSeed: Math.floor(Math.random() * 0x7fffffff),
    lockSequence: 0,
    clearEffects: [],
  };
}
