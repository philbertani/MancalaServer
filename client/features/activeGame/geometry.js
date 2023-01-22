import * as THREE from "three"

const t = ( 1 + Math.sqrt( 5 ) ) / 2;
const r = 1 / t;

export const d12Vertices = [

    // (±1, ±1, ±1)
    [- 1, - 1, - 1], [- 1, - 1, 1],
    [- 1, 1, - 1], [- 1, 1, 1],
    [1, - 1, - 1], [1, - 1, 1],
    [1, 1, - 1], [1, 1, 1],

    // (0, ±1/φ, ±φ)
    [0, - r, - t], [0, - r, t],
    [0, r, - t], [0, r, t],

    // (±1/φ, ±φ, 0)
    [- r, - t, 0], [- r, t, 0],
    [r, - t, 0], [r, t, 0],

    // (±φ, 0, ±1/φ)
    [- t, 0, - r], [t, 0, - r],
    [- t, 0, r], [t, 0, r]
];

export const d20Vertices = [
    [- 1, t, 0], 	[1, t, 0], 	[- 1, - t, 0], 	[1, - t, 0],
    [0, - 1, t], 	[0, 1, t],	[0, - 1, - t], 	[0, 1, - t],
    [t, 0, - 1], 	[t, 0, 1], 	[- t, 0, - 1], 	[- t, 0, 1]
];


//2*root2 length centered at origin
export const d4Vertices = [
    [1,1,1], [-1,-1,1], [-1,1,-1], [1,-1,-1]
]

//flip all signs to get the dual
export const d4DualVertices = [
    [-1,-1,-1], [1,1,-1], [1,-1,1], [-1,1,1]
]
// d4 + d4Dual are vertices of a cube

