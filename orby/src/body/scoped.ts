import type { SourcePublish } from "@directive-run/core";

// In a composed system, sources must name events "module::event" and gates read "module::fact".
// These keep each module's sources written as if the module stood alone.
export const scopedPublish =
  (module: string, publish: SourcePublish) =>
  (event: string, payload?: unknown): void =>
    publish(`${module}::${event}`, payload);

export const scopedFact = (module: string, facts: Readonly<Record<string, unknown>>, fact: string) => facts[`${module}::${fact}`];
