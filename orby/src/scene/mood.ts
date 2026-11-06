import { type Spring, spring } from "./spring";

// Orby's moods. Each one is a pose: how the eyes are shaped, how the body is tinted, and how it moves.
// Moods blend through springs, so changing from one to another always eases instead of snapping.

export const MOODS = ["calm", "happy", "angry", "sad", "surprised", "sleepy", "love"] as const;
export type Mood = (typeof MOODS)[number];
// auto lets Orby change its own mood every so often
export type MoodChoice = "auto" | Mood;

export interface MoodPose {
  // eyes
  slant: number; // + tips the lids toward the nose (angry), − toward the outside (sad)
  happy: number; // pills become upturned arcs
  heart: number; // pills become hearts
  scale: number; // eye size
  lid: number; // how far the lids come down
  droop: number; // eyes sit lower in the face
  // body color: blend toward this linear color by `tint`
  tintR: number;
  tintG: number;
  tintB: number;
  tint: number;
  // body motion
  bounce: number; // quick happy hops
  shake: number; // an angry tremble
  sink: number; // sinks low and looks down
  hop: number; // jumps up in surprise
  sleepy: number; // slow float, nodding head
  sway: number; // a dreamy side-to-side
}

export type MoodKey = keyof MoodPose;

const CALM: MoodPose = {
  slant: 0,
  happy: 0,
  heart: 0,
  scale: 1,
  lid: 0,
  droop: 0,
  tintR: 0,
  tintG: 0,
  tintB: 0,
  tint: 0,
  bounce: 0,
  shake: 0,
  sink: 0,
  hop: 0,
  sleepy: 0,
  sway: 0,
};

export const MOOD_POSES: Record<Mood, MoodPose> = {
  calm: CALM,
  happy: { ...CALM, happy: 1, bounce: 1, tintR: 0.1, tintG: 0.75, tintB: 0.55, tint: 0.12 },
  angry: { ...CALM, slant: 1, scale: 0.92, shake: 1, tintR: 0.62, tintG: 0.03, tintB: 0.015, tint: 0.68 },
  sad: { ...CALM, slant: -0.9, lid: 0.2, droop: 0.05, sink: 1, tintR: 0.05, tintG: 0.08, tintB: 0.22, tint: 0.4 },
  surprised: { ...CALM, scale: 1.4, hop: 1 },
  sleepy: { ...CALM, lid: 0.62, droop: 0.02, sleepy: 1, tintR: 0.12, tintG: 0.12, tintB: 0.35, tint: 0.22 },
  love: { ...CALM, heart: 1, sway: 1, tintR: 0.6, tintG: 0.05, tintB: 0.3, tint: 0.18 },
};

export type MoodSprings = Record<MoodKey, Spring>;

export const createMoodSprings = (): MoodSprings =>
  Object.fromEntries(Object.entries(CALM).map(([k, v]) => [k, { x: v, v: 0 }])) as MoodSprings;

export const stepMoodSprings = (s: MoodSprings, target: MoodPose, dt: number): MoodSprings =>
  Object.fromEntries((Object.keys(s) as MoodKey[]).map((k) => [k, spring(s[k], target[k], 7, dt)])) as MoodSprings;

export const moodValues = (s: MoodSprings): MoodPose =>
  Object.fromEntries((Object.keys(s) as MoodKey[]).map((k) => [k, s[k].x])) as unknown as MoodPose;

// In auto, Orby flashes a mood for a few seconds now and then, and rests calm in between
export interface AutoMood {
  mood: Mood;
  until: number;
  next: number;
}

export const createAutoMood = (): AutoMood => ({ mood: "calm", until: 0, next: 7 });

const fract = (x: number) => x - Math.floor(x);
const SHOWN: Mood[] = ["happy", "angry", "sad", "surprised", "sleepy", "love"];

export const stepAutoMood = (a: AutoMood, time: number, rand: number): AutoMood => {
  if (time >= a.next) {
    const mood = SHOWN[Math.floor(fract(rand * 13.7) * SHOWN.length)];
    const until = time + 3.2 + fract(rand * 7.9) * 1.6;

    return { mood, until, next: until + 6 + fract(rand * 31.3) * 7 };
  }
  if (time > a.until && a.mood !== "calm") return { ...a, mood: "calm" };

  return a;
};
