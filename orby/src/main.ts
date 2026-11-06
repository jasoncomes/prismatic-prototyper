import "./style.css";
import { createBodySystem } from "./body/system";
import { createRenderer } from "./engine/renderer";
import { MOODS, type MoodChoice } from "./scene/mood";
import { DEFAULT_PARAMS, FOLLOW_MODES, type FollowMode } from "./scene/params";

const canvas = document.getElementById("orby") as HTMLCanvasElement;

// the renderer is the only GL writer, and rebuilds itself when a lost context comes back
const renderer = createRenderer(canvas);
if (!renderer) {
  document.body.classList.add("no-webgl");
  throw new Error("WebGL2 is unavailable");
}

// ?follow=drag|always picks how Orby follows you; the switch at the bottom changes it
const requested = new URLSearchParams(location.search).get("follow");
const startFollow = FOLLOW_MODES.find((m) => m === requested) ?? DEFAULT_PARAMS.follow;
const system = createBodySystem({ canvas, renderer, initialParams: { ...DEFAULT_PARAMS, follow: startFollow } });
system.initialize();
system.start();

const followButtons = [...document.querySelectorAll<HTMLButtonElement>(".follow button")];
const setFollow = (follow: FollowMode) => {
  system.events.orby.setParams({ params: { follow } });
  for (const b of followButtons) b.setAttribute("aria-pressed", String(b.dataset.follow === follow));
  document.body.classList.toggle("dragging", follow === "drag");
  const url = new URL(location.href);
  url.searchParams.set("follow", follow);
  history.replaceState(null, "", url);
};
for (const b of followButtons) b.addEventListener("click", () => setFollow(b.dataset.follow as FollowMode));
setFollow(startFollow);

// the mood bar: Auto lets Orby pick its own moods now and then; keys 1–8 pick them too
const moodChoices: MoodChoice[] = ["auto", ...MOODS];
const moodButtons = [...document.querySelectorAll<HTMLButtonElement>(".moods button")];
const setMood = (mood: MoodChoice) => {
  system.events.orby.setMood({ mood });
  for (const b of moodButtons) b.setAttribute("aria-pressed", String(b.dataset.mood === mood));
};
for (const b of moodButtons) b.addEventListener("click", () => setMood(b.dataset.mood as MoodChoice));
window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
  const n = Number(e.key);
  if (n >= 1 && n <= moodChoices.length) setMood(moodChoices[n - 1]);
});
setMood("auto");

if (import.meta.env.DEV || new URLSearchParams(location.search).has("dial")) {
  void import("./dev/gui").then(({ mountGui }) => mountGui(system, renderer));
  // dev only: inspect the body from the console
  Object.assign(window, { __body: system });
}
