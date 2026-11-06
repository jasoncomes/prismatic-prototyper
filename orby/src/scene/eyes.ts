import { rotation } from "../engine/math";

// Orby's eyes, as one source of truth for the shader that draws them and the hover test that closes them.
// Centers are directions on Orby's front (+z), in units of its radius; left and right are as you see them.

export const ORBY_RADIUS = 0.95;

export const EYES = {
  left: { x: -0.14, y: 0.14 },
  right: { x: 0.14, y: 0.14 },
  halfWidth: 0.065,
  halfHeight: 0.17,
};

export type Side = "left" | "right";

export interface EyeView {
  yaw: number;
  pitch: number;
  bob: number;
  // where the eyes are looking within the face, in the same units as the centers
  shift: { x: number; y: number };
  cameraDistance: number;
  fov: number;
  aspect: number;
}

// The pointer in normalized device coordinates: x right, y up, −1..1 across the canvas
export interface ScreenPoint {
  x: number;
  y: number;
}

// Is the pointer over this eye? The eye's center is turned with Orby and projected through the same camera the
// shader uses; the hit area is the eye's own size on screen, padded so the target isn't fiddly.
export const pointerOverEye = (side: Side, p: ScreenPoint, view: EyeView): boolean => {
  const c = EYES[side];
  const lx = c.x + view.shift.x;
  const ly = c.y + view.shift.y;
  const lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly));
  const m = rotation(view.yaw, view.pitch);
  const wx = lx * m[0] + ly * m[4] + lz * m[8];
  const wy = lx * m[1] + ly * m[5] + lz * m[9];
  const wz = lx * m[2] + ly * m[6] + lz * m[10];
  // an eye turned away from you can't be covered
  if (wz < 0.25) return false;

  const x = wx * ORBY_RADIUS;
  const y = wy * ORBY_RADIUS + view.bob;
  const depth = view.cameraDistance - wz * ORBY_RADIUS;
  const f = 1 / Math.tan(view.fov / 2);
  const sx = (f * x) / (view.aspect * depth);
  const sy = (f * y) / depth;
  const halfW = (f * ORBY_RADIUS * EYES.halfWidth * 2.4) / (view.aspect * depth);
  const halfH = (f * ORBY_RADIUS * EYES.halfHeight * 1.5) / depth;

  return ((p.x - sx) / halfW) ** 2 + ((p.y - sy) / halfH) ** 2 <= 1;
};
