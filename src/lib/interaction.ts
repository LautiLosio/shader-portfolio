export type Vec2 = [number, number];
export function dragTarget(start: Vec2, position: Vec2, worldSize: number): Vec2 {
  const x = (position[0] - start[0]) / worldSize;
  const y = (position[1] - start[1]) / worldSize;
  const distance = Math.hypot(x, y);
  if (distance < 0.0001) return [0, 0];
  const fraction = Math.min(1, distance / (0.25 * 0.65));
  const strength = fraction * fraction * (3 - 2 * fraction);
  return [x / distance * strength, y / distance * strength];
}
export function smoothDrag(previous: Vec2, target: Vec2, dt: number, active: boolean): Vec2 {
  const follow = 1 - Math.exp(-dt / (active ? 0.030 : 0.43));
  const next: Vec2 = [previous[0] + (target[0] - previous[0]) * follow,
    previous[1] + (target[1] - previous[1]) * follow];
  return !active && Math.hypot(...next) < 0.012 ? [0, 0] : next;
}

// A first-order velocity impulse, integrated over the rendered frame rather
// than per pointer event. Identical speed produces the same response at any Hz.
export function cursorImpulse(previous: Vec2, movement: Vec2, worldSize: number, dt: number): Vec2 {
  if (dt <= 0 || worldSize <= 0) return previous;
  const decay = Math.exp(-dt / 0.38);
  // Keep the sustained movement strength independent of the return time.
  const gain = 2.16 * (1 - decay) / (worldSize * dt);
  const next: Vec2 = [previous[0] * decay + movement[0] * gain,
    previous[1] * decay + movement[1] * gain];
  const length = Math.hypot(...next);
  if (length > 1) return [next[0] / length, next[1] / length];
  return length < 0.0001 ? [0, 0] : next;
}
