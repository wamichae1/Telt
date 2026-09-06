import type { Cell } from "./board";
import { canMove } from "./board";

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Piece = {
  shape: number[][];
  x: number;
  y: number;
  color: string;
  rotation: number;
  type: PieceType;
};

const I_SHAPES = [
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0],
  ],
  [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
  ],
];

const SHAPES: Record<PieceType, number[][]> = {
  I: [
    [1, 1, 1, 1],
  ],

  O: [
    [1, 1],
    [1, 1],
  ],

  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],

  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],

  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],

  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],

  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

export const PIECE_COLORS: Record<PieceType, string> = {
  I: "#00e5ff",
  O: "#ffd600",
  T: "#b44cff",
  S: "#39d353",
  Z: "#ff4d6d",
  J: "#4d7cff",
  L: "#ff9f43",
};

const I_KICKS: Record<string, [number, number][]> = {
  "0-1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1-0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],

  "1-2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2-1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],

  "2-3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3-2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],

  "3-0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0-3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const JLSTZ_KICKS: Record<string, [number, number][]> = {
  "0-1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "1-0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],

  "1-2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "2-1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],

  "2-3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "3-2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],

  "3-0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "0-3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

export function createIPiece(): Piece {
  return {
    shape: I_SHAPES[0],
    x: 3,
    y: 0,
    color: "#00e5ff",
    rotation: 0,
    type: "I",
  };
}

export function createPiece(): Piece {
  const types = Object.keys(SHAPES) as PieceType[];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    shape: SHAPES[type],
    x: 3,
    y: 0,
    color: PIECE_COLORS[type],
    rotation: 0,
    type,
  };
}

export function rotateIPiece(
  piece: Piece,
  board: Cell[][]
): Piece {
  const nextRotation = (piece.rotation + 1) % 4;
  const key = `${piece.rotation}-${nextRotation}`;

  for (const [dx, dy] of I_KICKS[key]) {
    const rotated: Piece = {
      ...piece,
      shape: I_SHAPES[nextRotation],
      rotation: nextRotation,
      x: piece.x + dx,
      y: piece.y - dy,
    };

    if (canMove(board, rotated, 0, 0)) {
      return rotated;
    }
  }

  return piece;
}

export function rotatePiece(
  piece: Piece,
  board: Cell[][]
): Piece {
  if (piece.type === "O") {
    return piece;
  }

  if (piece.type === "I") {
    return rotateIPiece(piece, board);
  }

  const nextRotation = (piece.rotation + 1) % 4;
  const key = `${piece.rotation}-${nextRotation}`;

  const rotatedShape = Array.from(
    { length: 3 },
    () => Array<number>(3).fill(0)
  );

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      rotatedShape[col][2 - row] = piece.shape[row][col];
    }
  }

  for (const [dx, dy] of JLSTZ_KICKS[key]) {
    const rotated: Piece = {
      ...piece,
      shape: rotatedShape,
      rotation: nextRotation,
      x: piece.x + dx,
      y: piece.y - dy,
    };

    if (canMove(board, rotated, 0, 0)) {
      return rotated;
    }
  }

  return piece;
}
