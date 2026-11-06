export interface Spring {
  x: number;
  v: number;
}

// critically damped: arrives without overshoot, at a speed set by stiffness
export const spring = (s: Spring, target: number, stiffness: number, dt: number): Spring => {
  const a = stiffness * stiffness * (target - s.x) - 2 * stiffness * s.v;
  const v = s.v + a * dt;

  return { x: s.x + v * dt, v };
};
