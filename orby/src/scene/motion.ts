import {
  type AutoMood,
  createAutoMood,
  createMoodSprings,
  MOOD_POSES,
  type MoodChoice,
  type MoodPose,
  type MoodSprings,
  moodValues,
  stepAutoMood,
  stepMoodSprings,
} from "./mood";
import type { FollowMode } from "./params";
import { type Spring, spring } from "./spring";

// Pure motion: springs, where Orby wants to look, and how its face animates. (state, input) → next state.

export type { Spring } from "./spring";
export { spring } from "./spring";

export interface Pointer {
  x: number;
  y: number;
  held: boolean;
  hasMoved: boolean;
  lastMoveAt: number;
}

// where Orby wants to face: the cursor while following, otherwise straight at you, drifting once the cursor sits idle
export const aimOf = (pointer: Pointer, time: number, params: { follow: FollowMode; autopilotDelay: number; autopilotAmp: number }) => {
  const recent = pointer.hasMoved && time - pointer.lastMoveAt <= params.autopilotDelay;
  const following = params.follow === "always" ? recent : params.follow === "drag" && pointer.held;
  if (following) return { x: pointer.x, y: pointer.y };
  if (!pointer.hasMoved || (params.follow === "drag" && recent)) return { x: 0, y: 0 };
  const amp = params.autopilotAmp;

  return { x: amp * Math.sin(time * 0.21) * 1.4, y: amp * 0.6 * Math.sin(time * 0.29 + 1.1) };
};

export type FaceMode = "idle" | "listening" | "thinking" | "speaking";

// What Orby's eyes do on their own between blinks. Each act runs for a moment, then the next one is drawn by chance.
export type EyeAct = "blink" | "doubleBlink" | "winkLeft" | "winkRight" | "glance" | "roll" | "wide" | "squint";

export interface Act {
  kind: EyeAct;
  start: number;
  length: number;
  // for a glance: which way, as a unit direction
  dir: { x: number; y: number };
}

export interface Expression {
  speaking: Spring;
  // what's drawn: 0 open → 1 shut, per eye as you see them
  lids: { left: number; right: number };
  // the cursor resting on an eye pokes it: the eye becomes an X and Orby flinches
  poke: { left: Spring; right: Spring };
  pokedAt: number;
  // the mood pose, eased, and the auto mood's schedule
  mood: MoodSprings;
  auto: AutoMood;
  // where the eyes look within the face, and their size (wide-eyed is over 1)
  shift: { x: Spring; y: Spring };
  scale: Spring;
  act: Act | null;
  nextAct: number;
  // the first act is always a wink, so Orby greets you with one
  greeted: boolean;
}

export const createExpression = (): Expression => ({
  speaking: { x: 0, v: 0 },
  lids: { left: 0, right: 0 },
  poke: { left: { x: 0, v: 0 }, right: { x: 0, v: 0 } },
  pokedAt: Number.NEGATIVE_INFINITY,
  mood: createMoodSprings(),
  auto: createAutoMood(),
  shift: { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } },
  scale: { x: 1, v: 0 },
  act: null,
  nextAct: 1.6,
  greeted: false,
});

// chance of each act, in order; blinks stay the most common so the rest stay a surprise
const ACTS: [EyeAct, number, number][] = [
  // kind, weight, seconds
  ["blink", 0.3, 0.16],
  ["doubleBlink", 0.1, 0.42],
  ["winkLeft", 0.11, 0.6],
  ["winkRight", 0.11, 0.6],
  ["glance", 0.16, 1.2],
  ["roll", 0.05, 1.3],
  ["wide", 0.08, 0.9],
  ["squint", 0.09, 1.4],
];
const CALM: EyeAct[] = ["blink", "doubleBlink", "winkLeft", "winkRight"];

const fract = (x: number) => x - Math.floor(x);
const pulse = (s: number) => (s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0);
// eases in, holds, eases out
const hold = (s: number, edge = 0.2) => Math.min(1, s / edge, (1 - s) / edge);

const pickAct = (rand: number, time: number, reduced: boolean, first: boolean): Act => {
  const pool = ACTS.filter(([kind]) => !reduced || CALM.includes(kind));
  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let r = rand * total;
  let [kind, , length] = pool[0];
  for (const [k, w, l] of pool) {
    if (r < w) {
      kind = k;
      length = l;
      break;
    }
    r -= w;
  }
  if (first) {
    kind = "winkRight";
    length = 0.6;
  }
  const angle = fract(rand * 97.13) * Math.PI * 2;

  return { kind, start: time, length, dir: { x: Math.cos(angle), y: Math.sin(angle) * 0.6 } };
};

// one act's contribution at this moment: lids, where the eyes look, and how big they are
const actPose = (act: Act | null, time: number) => {
  const pose = { left: 0, right: 0, x: 0, y: 0, scale: 1 };
  if (!act) return pose;
  const s = (time - act.start) / act.length;
  if (s < 0 || s > 1) return pose;

  switch (act.kind) {
    case "blink":
      pose.left = pose.right = pulse(s);
      break;
    case "doubleBlink":
      pose.left = pose.right = s < 0.5 ? pulse(s / 0.45) : pulse((s - 0.55) / 0.45);
      break;
    case "winkLeft":
    case "winkRight": {
      // one eye shuts and holds; the other narrows a touch, the way a real wink pulls the face
      const amount = hold(s, 0.25);
      pose.left = act.kind === "winkLeft" ? amount : amount * 0.15;
      pose.right = act.kind === "winkRight" ? amount : amount * 0.15;
      pose.y = amount * 0.015;
      break;
    }
    case "glance":
      pose.x = act.dir.x * 0.07 * hold(s, 0.15);
      pose.y = act.dir.y * 0.07 * hold(s, 0.15);
      break;
    case "roll": {
      // a loop up and around, back to center
      const a = s * Math.PI * 2;
      const amount = hold(s, 0.12);
      pose.x = Math.sin(a) * 0.065 * amount;
      pose.y = Math.cos(a) * 0.05 * amount;
      break;
    }
    case "wide":
      pose.scale = 1 + 0.28 * hold(s);
      break;
    case "squint":
      pose.left = pose.right = 0.55 * hold(s);
      pose.y = 0.01 * hold(s);
      break;
  }

  return pose;
};

export interface ExpressionInput {
  mode: FaceMode;
  time: number;
  dt: number;
  // arrives with the frame, so stepping stays deterministic
  rand: number;
  // is the cursor resting on each eye?
  covered: { left: boolean; right: boolean };
  mood: MoodChoice;
  // where Orby is aiming, −1..1 with y down; the eyes lead the head toward it
  look: { x: number; y: number };
  reduced: boolean;
}

export const stepExpression = (e: Expression, input: ExpressionInput): Expression => {
  const { mode, time, dt, rand, reduced } = input;
  const speaking = spring(e.speaking, mode === "speaking" ? 1 : 0, 6, dt);

  let { act, nextAct } = e;
  if (act && time > act.start + act.length) act = null;
  if (!act && time >= nextAct) {
    act = pickAct(rand, time, reduced, !e.greeted);
    nextAct = time + act.length + 1.4 + fract(rand * 53.7) * 3.2;
  }

  const pose = actPose(act, time);
  const poke = {
    left: spring(e.poke.left, input.covered.left ? 1 : 0, 22, dt),
    right: spring(e.poke.right, input.covered.right ? 1 : 0, 22, dt),
  };
  // a fresh poke starts a flinch
  const wasPoked = Math.max(e.poke.left.x, e.poke.right.x) > 0.5;
  const isPoked = Math.max(poke.left.x, poke.right.x) > 0.5;
  const pokedAt = isPoked && !wasPoked ? time : e.pokedAt;

  const auto = input.mood === "auto" ? stepAutoMood(e.auto, time, rand) : e.auto;
  const mood = stepMoodSprings(e.mood, MOOD_POSES[input.mood === "auto" ? auto.mood : input.mood], dt);
  const m = moodValues(mood);

  const lead = reduced ? 0 : 0.035;
  const shift = {
    x: spring(e.shift.x, pose.x + input.look.x * lead, 14, dt),
    y: spring(e.shift.y, pose.y - input.look.y * lead - m.droop, 14, dt),
  };
  const clampLid = (x: number) => Math.min(1, Math.max(0, x));

  return {
    speaking,
    // the poked eye's partner squeezes half shut in sympathy
    lids: {
      left: clampLid(Math.max(pose.left, m.lid, poke.right.x * 0.5)),
      right: clampLid(Math.max(pose.right, m.lid, poke.left.x * 0.5)),
    },
    poke,
    pokedAt,
    mood,
    auto,
    shift,
    scale: spring(e.scale, pose.scale, 12, dt),
    act,
    nextAct,
    greeted: e.greeted || act !== null,
  };
};

// How the body moves on top of where it's aiming: its float, the mood's motion, and the flinch from a poke.
// The eye hover test uses the same numbers, so a poked eye stays under the cursor while Orby moves.
export const bodyMotion = (e: Expression, time: number, reduced: boolean) => {
  const m: MoodPose = moodValues(e.mood);
  if (reduced) return { bob: -0.1 * m.sink, yaw: 0, pitch: 0.12 * m.sink + 0.18 * m.sleepy };

  const talk = Math.max(0, e.speaking.x);
  const rate = 2.2 - 1.1 * m.sleepy;
  const since = time - e.pokedAt;
  const flinch = since >= 0 ? Math.exp(-since * 5) : 0;
  const bob =
    Math.sin(time * rate) * (0.05 - 0.02 * m.sleepy) +
    talk * Math.abs(Math.sin(time * 7)) * 0.06 +
    m.bounce * Math.abs(Math.sin(time * 5.5)) * 0.08 -
    m.sink * 0.12 +
    m.hop * 0.1 -
    flinch * 0.05;
  const yaw = m.shake * Math.sin(time * 41) * 0.035 + m.sway * Math.sin(time * 1.6) * 0.16 + flinch * Math.sin(time * 34) * 0.06;
  const pitch = m.sink * 0.14 + m.sleepy * (0.16 + Math.sin(time * 0.9) * 0.06) - flinch * 0.18;

  return { bob, yaw, pitch };
};
