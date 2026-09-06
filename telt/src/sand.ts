import { COLS, ROWS, type Cell } from "./board";
import {
  PIECE_COLORS,
  type Piece,
  type PieceType,
} from "./pieces";

export const SAND_SCALE = 5;
export const SAND_COLS = COLS * SAND_SCALE;
export const SAND_ROWS = ROWS * SAND_SCALE;
export const SAND_CELL_SIZE = 30 / SAND_SCALE;
export const SAND_STEP_MS = 50;
export const CLEAR_EFFECT_MS = 220;

export type SandCell = {
  colorId: PieceType;
  releaseTick: number;
  movedTick: number;
};

export type SandGrid = (SandCell | null)[][];

export type ClearedGrain = {
  x: number;
  y: number;
  colorId: PieceType;
};

export type ClearEffect = {
  cells: ClearedGrain[];
  startedAtMs: number;
  durationMs: number;
};

export function createSandGrid(): SandGrid {
  return Array.from(
    { length: SAND_ROWS },
    () => Array<SandCell | null>(SAND_COLS).fill(null),
  );
}

export function projectSandToBoard(grid: SandGrid): Cell[][] {
  const board = Array.from(
    { length: ROWS },
    () => Array<Cell>(COLS).fill(null),
  );

  for (let y = 0; y < SAND_ROWS; y++) {
    for (let x = 0; x < SAND_COLS; x++) {
      const grain = grid[y][x];

      if (!grain) continue;

      const boardX = Math.floor(x / SAND_SCALE);
      const boardY = Math.floor(y / SAND_SCALE);
      board[boardY][boardX] = PIECE_COLORS[grain.colorId];
    }
  }

  return board;
}

export function pieceHasCellsAboveBoard(piece: Piece): boolean {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] && piece.y + row < 0) {
        return true;
      }
    }
  }

  return false;
}

export function rasterizePieceToSand(
  grid: SandGrid,
  piece: Piece,
  currentTick: number,
  variationSeed: number,
): boolean {
  const positions: [number, number][] = [];

  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (!piece.shape[row][col]) continue;

      const logicalX = piece.x + col;
      const logicalY = piece.y + row;

      if (
        logicalX < 0 ||
        logicalX >= COLS ||
        logicalY < 0 ||
        logicalY >= ROWS
      ) {
        return false;
      }

      for (let grainY = 0; grainY < SAND_SCALE; grainY++) {
        for (let grainX = 0; grainX < SAND_SCALE; grainX++) {
          positions.push([
            logicalX * SAND_SCALE + grainX,
            logicalY * SAND_SCALE + grainY,
          ]);
        }
      }
    }
  }

  if (positions.some(([x, y]) => grid[y][x] !== null)) {
    return false;
  }

  const lowestY = Math.max(...positions.map(([, y]) => y));

  for (const [x, y] of positions) {
    const verticalDelay = Math.floor((lowestY - y) / SAND_SCALE);
    const jitter = hashDirection(x, y, variationSeed, currentTick) & 1;
    const releaseDelay = Math.min(3, verticalDelay + jitter);

    grid[y][x] = {
      colorId: piece.type,
      releaseTick: currentTick + releaseDelay,
      movedTick: -1,
    };
  }

  return true;
}

export function createActivePieceMask(piece: Piece): Uint8Array {
  const mask = new Uint8Array(SAND_COLS * SAND_ROWS);

  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (!piece.shape[row][col]) continue;

      const logicalX = piece.x + col;
      const logicalY = piece.y + row;

      for (let grainY = 0; grainY < SAND_SCALE; grainY++) {
        for (let grainX = 0; grainX < SAND_SCALE; grainX++) {
          const x = logicalX * SAND_SCALE + grainX;
          const y = logicalY * SAND_SCALE + grainY;

          if (isInside(x, y)) {
            mask[toIndex(x, y)] = 1;
          }
        }
      }
    }
  }

  return mask;
}

export function stepSand(
  grid: SandGrid,
  currentTick: number,
  activePieceMask: Uint8Array,
  variationSeed: number,
): boolean {
  let moved = false;

  for (let y = SAND_ROWS - 1; y >= 0; y--) {
    const leftToRight = ((y + currentTick) & 1) === 0;

    for (let offset = 0; offset < SAND_COLS; offset++) {
      const x = leftToRight ? offset : SAND_COLS - 1 - offset;
      const grain = grid[y][x];

      if (
        !grain ||
        grain.releaseTick > currentTick ||
        grain.movedTick === currentTick
      ) {
        continue;
      }

      if (isOpen(grid, x, y + 1, activePieceMask)) {
        moveGrain(grid, x, y, x, y + 1, currentTick);
        moved = true;
        continue;
      }

      const downLeftOpen = isOpen(
        grid,
        x - 1,
        y + 1,
        activePieceMask,
      );
      const downRightOpen = isOpen(
        grid,
        x + 1,
        y + 1,
        activePieceMask,
      );

      if (!downLeftOpen && !downRightOpen) {
        continue;
      }

      let targetX: number;

      if (downLeftOpen && downRightOpen) {
        const preferLeft =
          (hashDirection(x, y, variationSeed, currentTick) & 1) === 0;
        targetX = preferLeft ? x - 1 : x + 1;
      } else {
        targetX = downLeftOpen ? x - 1 : x + 1;
      }

      moveGrain(grid, x, y, targetX, y + 1, currentTick);
      moved = true;
    }
  }

  return moved;
}

export function findSpanningComponents(
  grid: SandGrid,
  currentTick: number,
): number[][] {
  const visited = new Uint8Array(SAND_COLS * SAND_ROWS);
  const spanningComponents: number[][] = [];

  for (let startY = 0; startY < SAND_ROWS; startY++) {
    const start = grid[startY][0];
    const startIndex = toIndex(0, startY);

    if (
      !start ||
      start.releaseTick > currentTick ||
      visited[startIndex]
    ) {
      continue;
    }

    const component: number[] = [];
    const queue: number[] = [startIndex];
    let queueIndex = 0;
    let reachesRight = false;
    visited[startIndex] = 1;

    while (queueIndex < queue.length) {
      const index = queue[queueIndex++];
      const x = index % SAND_COLS;
      const y = Math.floor(index / SAND_COLS);
      component.push(index);

      if (x === SAND_COLS - 1) {
        reachesRight = true;
      }

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nextX = x + dx;
          const nextY = y + dy;

          if (!isInside(nextX, nextY)) continue;

          const nextIndex = toIndex(nextX, nextY);

          if (visited[nextIndex]) continue;

          const next = grid[nextY][nextX];

          if (
            !next ||
            next.releaseTick > currentTick ||
            next.colorId !== start.colorId
          ) {
            continue;
          }

          visited[nextIndex] = 1;
          queue.push(nextIndex);
        }
      }
    }

    if (reachesRight) {
      spanningComponents.push(component);
    }
  }

  return spanningComponents;
}

export function clearSpanningComponents(
  grid: SandGrid,
  components: number[][],
): ClearedGrain[] {
  const cleared: ClearedGrain[] = [];

  for (const component of components) {
    for (const index of component) {
      const x = index % SAND_COLS;
      const y = Math.floor(index / SAND_COLS);
      const grain = grid[y][x];

      if (!grain) continue;

      cleared.push({ x, y, colorId: grain.colorId });
      grid[y][x] = null;
    }
  }

  return cleared;
}

function moveGrain(
  grid: SandGrid,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  currentTick: number,
) {
  const grain = grid[fromY][fromX];

  if (!grain) return;

  grain.movedTick = currentTick;
  grid[toY][toX] = grain;
  grid[fromY][fromX] = null;
}

function isOpen(
  grid: SandGrid,
  x: number,
  y: number,
  activePieceMask: Uint8Array,
): boolean {
  return (
    isInside(x, y) &&
    grid[y][x] === null &&
    activePieceMask[toIndex(x, y)] === 0
  );
}

function isInside(x: number, y: number): boolean {
  return x >= 0 && x < SAND_COLS && y >= 0 && y < SAND_ROWS;
}

function toIndex(x: number, y: number): number {
  return y * SAND_COLS + x;
}

function hashDirection(
  x: number,
  y: number,
  seed: number,
  tick: number,
): number {
  let value =
    Math.imul(x + 1, 73856093) ^
    Math.imul(y + 1, 19349663) ^
    Math.imul(seed + 1, 83492791) ^
    Math.imul(tick + 1, 2654435761);

  value ^= value >>> 16;
  return value >>> 0;
}
