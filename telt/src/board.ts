import type { Piece } from "./pieces";
export const COLS = 10;
export const ROWS = 20;

export type Cell = string | null;

export function createBoard(): Cell[][] {
  return Array.from(
    { length: ROWS },
    () => Array<Cell>(COLS).fill(null)
  );
}

export function canMove(
  board: Cell[][],
  piece: Piece,
  dx: number,
  dy: number
): boolean {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (!piece.shape[row][col]) continue;

      const newX = piece.x + col + dx;
      const newY = piece.y + row + dy;

      if (newX < 0 || newX >= COLS || newY >= ROWS) {
        return false;
      }

      if (newY >= 0 && board[newY][newX]) {
        return false;
      }
    }
  }

  return true;
}

export function lockPiece(board: Cell[][], piece: Piece) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        board[piece.y + row][piece.x + col] = piece.color;
      }
    }
  }
}

export function clearLines(board: Cell[][]): number {
  let cleared = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every((cell) => cell !== null)) {
      board.splice(row, 1);
      board.unshift(Array<Cell>(COLS).fill(null));

      cleared++;
      row++;
    }
  }

  return cleared;
}