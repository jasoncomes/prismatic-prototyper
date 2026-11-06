import { createSystem } from "@directive-run/core";
import type { Renderer } from "../engine/renderer";
import type { Params } from "../scene/params";
import { createOrbyModule } from "./modules/orby";

interface BodyDeps {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  initialParams: Params;
}

// The body: everything the browser runs. Conversation, voice, visitor and examples join as modules later.
export const createBodySystem = (deps: BodyDeps) =>
  createSystem({
    // dials start from the code's defaults on every load; the dev panel's "copy settings" keeps a look worth keeping
    modules: { orby: createOrbyModule(deps) },
  });

export type BodySystem = ReturnType<typeof createBodySystem>;
