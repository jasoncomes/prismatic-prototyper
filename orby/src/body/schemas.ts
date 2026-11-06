import { t } from "@directive-run/core";
import { MOODS, type MoodChoice } from "../scene/mood";
import type { Expression, FaceMode, Pointer, Spring } from "../scene/motion";
import { PALETTES, type PaletteName, type Params } from "../scene/params";

const PALETTE = Object.keys(PALETTES) as [PaletteName, ...PaletteName[]];
const MODES = ["idle", "listening", "thinking", "speaking"] as [FaceMode, ...FaceMode[]];
const MOOD_CHOICES = ["auto", ...MOODS] as [MoodChoice, ...MoodChoice[]];

export interface Turn {
  yaw: Spring;
  pitch: Spring;
}

// Everything one frame reads lives in one module, because an event handler only sees its own module.
// Other modules (conversation, voice, examples) will steer Orby through these events.
export const orbySchema = {
  facts: {
    // what the browser reports
    visible: t.boolean(),
    reducedMotion: t.boolean(),
    viewportSeq: t.number(),
    pointer: t.object<Pointer>(),
    // what was chosen
    params: t.object<Params>(),
    mode: t.enum(...MODES),
    mood: t.enum(...MOOD_CHOICES),
    // what moves between frames
    time: t.number(),
    lastNow: t.number(),
    dt: t.number(),
    turn: t.object<Turn>(),
    expression: t.object<Expression>(),
    fps: t.number(),
  },
  derivations: {},
  events: {
    tick: { now: t.number(), rand: t.number(), aspect: t.number() },
    pointerMoved: { x: t.number(), y: t.number() },
    pointerHeld: { held: t.boolean() },
    visibilityChanged: { visible: t.boolean() },
    reducedMotionChanged: { reduced: t.boolean() },
    resized: {},
    setParams: { params: t.object<Partial<Params>>() },
    setPalette: { palette: t.enum(...PALETTE) },
    setMode: { mode: t.enum(...MODES) },
    setMood: { mood: t.enum(...MOOD_CHOICES) },
  },
  requirements: {},
};
