import { ORBY_RADIUS } from "../scene/eyes";
import type { MoodPose } from "../scene/mood";
import { hexToRgb, PALETTES, type PaletteName, type Params } from "../scene/params";
import { bindTexture, createProgram, createTarget, drawFullscreen, type Program, type Target } from "./gl";
import { rotation } from "./math";
import { smoothOrbyFragment } from "./shaders/orby";
import { bloomDown, bloomUp, composite, fullscreenVertex } from "./shaders/post";

// Everything one frame needs; the renderer reads it and never keeps state of its own between frames
export interface Frame {
  time: number;
  yaw: number;
  pitch: number;
  // 0 open → 1 shut, per eye as you see them
  lids: { left: number; right: number };
  // 0 → 1: how far each eye has turned into a poked X
  pokes: { left: number; right: number };
  // the eased mood: eye shapes and body tint
  mood: MoodPose;
  // where the eyes look within the face, and how big they are
  eyeShift: { x: number; y: number };
  eyeScale: number;
  // how far Orby floats above its rest, in world units
  bob: number;
  params: Params;
}

const BLOOM_LEVELS = [2, 4, 8, 16, 32];

// Every GL resource is made in init(), so a restored context rebuilds the whole renderer from scratch
export const createRenderer = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, powerPreference: "high-performance" });
  if (!gl) return null;

  let programs: { orby: Program; down: Program; up: Program; composite: Program };
  let scene: Target;
  let chain: Target[] = [];
  let hdr = false;
  let palette = { name: "" as PaletteName | "", colors: { background: [0, 0, 0], glow: [0, 0, 0], specular: [0, 0, 0] } };

  const allocateTargets = () => {
    scene = createTarget(gl, canvas.width, canvas.height, { hdr });
    chain = BLOOM_LEVELS.map((d) => createTarget(gl, Math.max(1, (canvas.width / d) | 0), Math.max(1, (canvas.height / d) | 0), { hdr }));
  };

  const init = () => {
    hdr = Boolean(gl.getExtension("EXT_color_buffer_float"));
    programs = {
      orby: createProgram(gl, fullscreenVertex, smoothOrbyFragment),
      down: createProgram(gl, fullscreenVertex, bloomDown),
      up: createProgram(gl, fullscreenVertex, bloomUp),
      composite: createProgram(gl, fullscreenVertex, composite),
    };
    allocateTargets();
  };

  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
  canvas.addEventListener("webglcontextrestored", init);
  init();

  const colorsOf = (name: PaletteName) => {
    if (palette.name !== name) {
      const p = PALETTES[name];
      palette = { name, colors: { background: hexToRgb(p.background), glow: hexToRgb(p.glow), specular: hexToRgb(p.specular) } };
    }

    return palette.colors;
  };

  const drawOrby = (frame: Frame) => {
    const { params } = frame;
    const colors = colorsOf(params.palette);
    const p = programs.orby;
    p.use();
    p.mat4("uModel", rotation(frame.yaw, frame.pitch));
    p.f("uFov", params.fov);
    p.f("uAspect", canvas.width / canvas.height);
    p.f("uDistance", params.cameraDistance);
    p.f("uRadius", ORBY_RADIUS);
    p.f("uBob", frame.bob);
    p.v2("uLids", frame.lids.left, frame.lids.right);
    p.v2("uEyeShift", frame.eyeShift.x, frame.eyeShift.y);
    p.v2("uPokes", frame.pokes.left, frame.pokes.right);
    p.f("uEyeScale", frame.eyeScale);
    p.f("uSlant", frame.mood.slant);
    p.f("uHappy", frame.mood.happy);
    p.f("uHeart", frame.mood.heart);
    p.v3("uTint", [frame.mood.tintR, frame.mood.tintG, frame.mood.tintB]);
    p.f("uTintAmount", frame.mood.tint);
    p.v3("uBackground", colors.background);
    p.v3("uGlow", colors.glow);
    p.v3("uSpecular", colors.specular);
    drawFullscreen(gl, scene, scene.width, scene.height);
  };

  const drawBloom = (params: Params) => {
    const { down, up } = programs;
    down.use();
    let source = scene;
    chain.forEach((target, i) => {
      bindTexture(gl, 0, source.texture);
      down.i("uSource", 0);
      down.v2("uTexel", 1 / source.width, 1 / source.height);
      down.f("uThreshold", i === 0 ? params.bloomThreshold : 0);
      drawFullscreen(gl, target, target.width, target.height);
      source = target;
    });

    up.use();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = chain.length - 1; i > 0; i--) {
      bindTexture(gl, 0, chain[i].texture);
      up.i("uSource", 0);
      up.v2("uTexel", 0.5 / chain[i].width, 0.5 / chain[i].height);
      drawFullscreen(gl, chain[i - 1], chain[i - 1].width, chain[i - 1].height);
    }
    gl.disable(gl.BLEND);
  };

  return {
    hdr: () => hdr,
    resize(width: number, height: number) {
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      if (!gl.isContextLost()) allocateTargets();
    },
    draw(frame: Frame) {
      if (gl.isContextLost()) return;
      drawOrby(frame);
      if (frame.params.bloom > 0) drawBloom(frame.params);

      const c = programs.composite;
      c.use();
      bindTexture(gl, 0, scene.texture);
      c.i("uScene", 0);
      bindTexture(gl, 1, chain[0].texture);
      c.i("uBloom", 1);
      c.f("uBloomAmount", frame.params.bloom);
      c.f("uRays", frame.params.rays);
      c.f("uHaze", frame.params.haze);
      c.f("uBeams", frame.params.beams);
      c.f("uGrain", frame.params.grain);
      c.f("uTime", frame.time);
      c.f("uAspect", canvas.width / canvas.height);
      c.v3("uHazeColor", colorsOf(frame.params.palette).glow);
      drawFullscreen(gl, null, canvas.width, canvas.height);
    },
    capture: () => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png")),
  };
};

export type Renderer = NonNullable<ReturnType<typeof createRenderer>>;
