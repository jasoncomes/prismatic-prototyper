import GUI from "lil-gui";
import type { BodySystem } from "../body/system";
import type { Renderer } from "../engine/renderer";
import type { FaceMode } from "../scene/motion";
import { DEFAULT_PARAMS, PALETTES, type Params } from "../scene/params";

// Dev panel: every dial, bound to the orby module's params; ` hides it
export const mountGui = (system: BodySystem, renderer: Renderer) => {
  const params: Params = { ...system.facts.orby.params };
  // the on-page switch owns the follow mode, so the panel never sends its own copy back
  const push = () => {
    const { follow: _follow, ...rest } = params;
    system.events.orby.setParams({ params: rest });
  };

  const gui = new GUI({ title: "Orby dials · ` to hide" });
  gui.domElement.style.left = "0";
  gui.domElement.style.right = "auto";

  const state = { mode: system.facts.orby.mode as FaceMode };
  const face = gui.addFolder("Face");
  face
    .add(state, "mode", ["idle", "listening", "thinking", "speaking"])
    .name("mode (T toggles speaking)")
    .onChange((mode: FaceMode) => system.events.orby.setMode({ mode }));

  const look = gui.addFolder("Look");
  look.add(params, "palette", Object.keys(PALETTES)).onChange(push);
  look.add(params, "bloom", 0, 3, 0.01).onChange(push);
  look.add(params, "bloomThreshold", 0, 3, 0.01).name("bloom threshold").onChange(push);
  const room = gui.addFolder("Room");
  room.add(params, "rays", 0, 2, 0.01).name("light rays").onChange(push);
  room.add(params, "haze", 0, 2, 0.01).onChange(push);
  room.add(params, "beams", 0, 2, 0.01).name("light beams").onChange(push);
  room.add(params, "grain", 0, 0.15, 0.001).name("film grain").onChange(push);

  const motion = gui.addFolder("Motion");
  motion.add(params, "yawRange", 0, 2, 0.01).name("turn range").onChange(push);
  motion.add(params, "pitchRange", 0, 1.2, 0.01).name("tilt range").onChange(push);
  motion.add(params, "stiffness", 1, 20, 0.1).onChange(push);
  motion.add(params, "autopilotAmp", 0, 1, 0.01).name("idle drift").onChange(push);

  const camera = gui.addFolder("Camera").close();
  camera.add(params, "cameraDistance", 2.5, 8, 0.01).name("distance").onChange(push);
  camera.add(params, "fov", 0.3, 1.4, 0.01).onChange(push);

  const stats = { fps: 0, hdr: renderer.hdr() };
  const perf = gui.addFolder("Perf");
  const fpsCtrl = perf.add(stats, "fps").disable();
  perf.add(stats, "hdr").disable();
  const timer = window.setInterval(() => {
    stats.fps = Math.round(system.facts.orby.fps);
    fpsCtrl.updateDisplay();
  }, 500);

  gui
    .add({ copy: () => void navigator.clipboard.writeText(JSON.stringify(system.facts.orby.params, null, 2)) }, "copy")
    .name("copy settings");
  gui
    .add(
      {
        reset: () => {
          Object.assign(params, DEFAULT_PARAMS);
          push();
          for (const c of gui.controllersRecursive()) c.updateDisplay();
        },
      },
      "reset",
    )
    .name("reset to defaults");

  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === "`") gui.show(gui._hidden);
    if (e.key === "t") {
      state.mode = system.facts.orby.mode === "speaking" ? "idle" : "speaking";
      system.events.orby.setMode({ mode: state.mode });
      for (const c of face.controllers) c.updateDisplay();
    }
  };
  window.addEventListener("keydown", onKey);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("keydown", onKey);
    gui.destroy();
  };
};
