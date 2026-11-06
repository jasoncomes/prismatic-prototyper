import { createModule } from "@directive-run/core";
import type { Renderer } from "../../engine/renderer";
import { pointerOverEye } from "../../scene/eyes";
import { moodValues } from "../../scene/mood";
import { aimOf, bodyMotion, createExpression, spring, stepExpression } from "../../scene/motion";
import type { Params } from "../../scene/params";
import { orbySchema } from "../schemas";
import { scopedFact, scopedPublish } from "../scoped";

interface OrbyDeps {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  initialParams: Params;
}

// Orby's body: where it faces, how its eyes and float move, and the frame loop that draws it.
// Handlers are the only writers and stay deterministic (randomness arrives in payloads); effects only draw.
export const createOrbyModule = ({ canvas, renderer, initialParams }: OrbyDeps) => {
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  return createModule("orby", {
    schema: orbySchema,

    init: (facts) => {
      facts.visible = !document.hidden;
      facts.reducedMotion = reducedQuery.matches;
      facts.viewportSeq = 0;
      facts.pointer = { x: 0, y: 0, held: false, hasMoved: false, lastMoveAt: Number.NEGATIVE_INFINITY };
      facts.params = { ...initialParams };
      facts.mode = "idle";
      facts.mood = "auto";
      facts.time = 0;
      facts.lastNow = performance.now();
      facts.dt = 0;
      facts.turn = { yaw: { x: 0, v: 0 }, pitch: { x: 0, v: 0 } };
      facts.expression = createExpression();
      facts.fps = 0;
    },

    events: {
      // one frame: advance the clock, turn toward the aim, animate the eyes
      tick: (facts, { now, rand, aspect }) => {
        const dt = Math.min((now - facts.lastNow) / 1000, 0.05);
        const time = facts.time + dt;
        const { params } = facts;
        const aim = aimOf(facts.pointer, time, params);
        facts.turn = {
          yaw: spring(facts.turn.yaw, aim.x * params.yawRange, params.stiffness, dt),
          pitch: spring(facts.turn.pitch, aim.y * params.pitchRange, params.stiffness, dt),
        };
        // the cursor pokes whichever eye it rests on, judged where that eye was last frame
        const e = facts.expression;
        const body = bodyMotion(e, time, facts.reducedMotion);
        const view = {
          yaw: facts.turn.yaw.x + body.yaw,
          pitch: facts.turn.pitch.x + body.pitch,
          bob: body.bob,
          shift: { x: e.shift.x.x, y: e.shift.y.x },
          cameraDistance: params.cameraDistance,
          fov: params.fov,
          aspect,
        };
        const at = { x: facts.pointer.x, y: -facts.pointer.y };
        const over = facts.pointer.hasMoved;
        facts.expression = stepExpression(e, {
          mode: facts.mode,
          time,
          dt,
          rand,
          covered: { left: over && pointerOverEye("left", at, view), right: over && pointerOverEye("right", at, view) },
          look: aim,
          mood: facts.mood,
          reduced: facts.reducedMotion,
        });
        facts.time = time;
        facts.lastNow = now;
        facts.dt = dt;
        if (dt > 0) facts.fps += (1 / dt - facts.fps) * 0.1;
      },
      pointerMoved: (facts, { x, y }) => {
        facts.pointer = { ...facts.pointer, x, y, hasMoved: true, lastMoveAt: facts.time };
      },
      pointerHeld: (facts, { held }) => {
        facts.pointer = { ...facts.pointer, held, lastMoveAt: facts.time };
      },
      visibilityChanged: (facts, { visible }) => {
        facts.visible = visible;
        // a fresh clock on return, so the first frame back doesn't jump
        facts.lastNow = performance.now();
      },
      reducedMotionChanged: (facts, { reduced }) => {
        facts.reducedMotion = reduced;
      },
      resized: (facts) => {
        facts.viewportSeq += 1;
      },
      setParams: (facts, { params }) => {
        facts.params = { ...facts.params, ...params };
      },
      setPalette: (facts, { palette }) => {
        facts.params = { ...facts.params, palette };
      },
      setMode: (facts, { mode }) => {
        facts.mode = mode;
      },
      setMood: (facts, { mood }) => {
        facts.mood = mood;
      },
    },

    effects: {
      draw: {
        run: (facts) => {
          const e = facts.expression;
          const body = bodyMotion(e, facts.time, facts.reducedMotion);
          const m = moodValues(e.mood);
          renderer.draw({
            time: facts.time,
            yaw: facts.turn.yaw.x + body.yaw,
            pitch: facts.turn.pitch.x + body.pitch,
            lids: e.lids,
            pokes: { left: e.poke.left.x, right: e.poke.right.x },
            eyeShift: { x: e.shift.x.x, y: e.shift.y.x },
            eyeScale: e.scale.x * m.scale,
            mood: m,
            bob: body.bob,
            params: facts.params,
          });
        },
      },
      measure: {
        run: (facts) => {
          void facts.viewportSeq;
          const dpr = Math.min(devicePixelRatio, facts.params.dprCap);
          renderer.resize(Math.round(canvas.clientWidth * dpr), Math.round(canvas.clientHeight * dpr));
        },
      },
    },

    sources: {
      // frames run while the tab is visible
      frames: {
        active: (facts) => scopedFact("orby", facts, "visible") === true,
        attach: (raw) => {
          const publish = scopedPublish("orby", raw);
          let raf = requestAnimationFrame(function loop(now) {
            publish("tick", { now, rand: Math.random(), aspect: canvas.clientWidth / Math.max(1, canvas.clientHeight) });
            raf = requestAnimationFrame(loop);
          });

          return () => cancelAnimationFrame(raf);
        },
      },
      pointer: {
        attach: (raw) => {
          const publish = scopedPublish("orby", raw);
          const onMove = (e: PointerEvent) =>
            publish("pointerMoved", { x: (e.clientX / innerWidth) * 2 - 1, y: (e.clientY / innerHeight) * 2 - 1 });
          // in drag mode, holding the mouse down on the canvas steers Orby; releasing anywhere lets it go
          const onDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            onMove(e);
            publish("pointerHeld", { held: true });
          };
          const onUp = () => publish("pointerHeld", { held: false });
          window.addEventListener("pointermove", onMove);
          canvas.addEventListener("pointerdown", onDown);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);

          return () => {
            window.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
          };
        },
      },
      viewport: {
        attach: (raw) => {
          const publish = scopedPublish("orby", raw);
          const observer = new ResizeObserver(() => publish("resized"));
          observer.observe(canvas);

          return () => observer.disconnect();
        },
      },
      visibility: {
        attach: (raw) => {
          const publish = scopedPublish("orby", raw);
          const onChange = () => publish("visibilityChanged", { visible: !document.hidden });
          document.addEventListener("visibilitychange", onChange);

          return () => document.removeEventListener("visibilitychange", onChange);
        },
      },
      reducedMotion: {
        attach: (raw) => {
          const publish = scopedPublish("orby", raw);
          const onChange = () => publish("reducedMotionChanged", { reduced: reducedQuery.matches });
          reducedQuery.addEventListener("change", onChange);

          return () => reducedQuery.removeEventListener("change", onChange);
        },
      },
    },
  });
};
