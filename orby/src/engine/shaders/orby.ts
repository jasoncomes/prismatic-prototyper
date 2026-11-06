import { EYES } from "../../scene/eyes";

// GLSL needs a decimal point on every float literal
const glsl = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

// Orby: a fullscreen pass that ray-traces a smooth sphere, painted like the logo – the teal-to-blue diagonal,
// its lighter inner disc, and two pill eyes on the front. Colors are linear, because the composite tone-maps
// and gamma-corrects.

const ORBY_PAINT = /* glsl */ `
const vec3 TEAL = vec3(0.091, 0.716, 0.597);
const vec3 MID = vec3(0.050, 0.434, 0.624);
const vec3 BLUE = vec3(0.024, 0.115, 0.445);

// n is a unit direction; x right, y up. Top left is teal, bottom right is blue.
vec3 orbyAlbedo(vec3 n) {
  float t = clamp((n.x - n.y) * 0.55 + 0.5, 0.0, 1.0);
  vec3 col = t < 0.5 ? mix(TEAL, MID, t * 2.0) : mix(MID, BLUE, (t - 0.5) * 2.0);
  // the logo's lighter disc, offset up and to the left
  float d = length(n.xy - vec2(-0.16, 0.14));
  return mix(col, col + vec3(0.04, 0.08, 0.07), smoothstep(0.80, 0.70, d) * step(0.0, n.z));
}

// the eyes come from scene/eyes.ts, so the hover test and the drawing always agree on where they are
const vec2 EYE_L = vec2(${glsl(EYES.left.x)}, ${glsl(EYES.left.y)});
const vec2 EYE_R = vec2(${glsl(EYES.right.x)}, ${glsl(EYES.right.y)});
const float EYE_HALF_W = ${glsl(EYES.halfWidth)};
const float EYE_HALF_H = ${glsl(EYES.halfHeight)};

float dot2(vec2 v) { return dot(v, v); }

// a heart with its tip at the origin, about one unit tall (after Inigo Quilez's exact heart distance)
float sdHeart(vec2 p) {
  p.x = abs(p.x);
  if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// One eye. p is a point on Orby's front in its own space; c is the eye's center; inner is +1 when the nose
// is toward +x (the left eye) and −1 otherwise. lid 0 is open, 1 is shut; poke 0 → 1 turns the eye into an X.
// The mood shapes come from uniforms: uSlant cuts the top at an angle, uHappy turns the pill into an arc,
// uHeart into a heart. Returns (white glow, dark navy line, pink glow).
vec3 eyeAt(vec2 p, vec2 c, float inner, float lid, float poke, float scale, float soft) {
  float squash = clamp(lid / 0.85, 0.0, 1.0);
  float shut = smoothstep(0.72, 0.97, lid);
  float poked = smoothstep(0.25, 0.75, poke);

  float halfW = EYE_HALF_W * scale;
  float fullH = EYE_HALF_H * scale;
  float halfH = fullH * mix(1.0, 0.18, squash);
  vec2 q = p - c;
  // the lid comes down from the top, so the pill shrinks toward its lower half
  q.y += (fullH - halfH) * 0.6;
  // a rounded box with fully rounded ends: a tall pill when open
  float r = min(halfW, halfH);
  float d = length(max(abs(q) - vec2(halfW - r, halfH - r), 0.0)) - r;
  // brows: a slanted cut across the top. Angry tips down toward the nose, sad tips down toward the outside.
  float towardNose = q.x * inner;
  float cut = halfH * (1.0 - 0.42 * abs(uSlant)) - uSlant * towardNose * 1.9;
  d = max(d, q.y - cut);
  float pill = smoothstep(soft, -soft, d);

  // happy: an upturned arc, like a smile squeezing the eye
  vec2 h = p - (c - vec2(0.0, fullH * 0.15));
  float arcW = halfW * 1.55;
  float hx = clamp(h.x, -arcW, arcW);
  float hump = fullH * 0.4 * (1.0 - (hx / arcW) * (hx / arcW));
  float arc = smoothstep(soft, -soft, length(vec2(h.x - hx, h.y - hump)) - fullH * 0.1);

  // love: a heart in place of the eye
  float size = fullH * 1.55;
  float heart = smoothstep(soft, -soft, sdHeart((p - c + vec2(0.0, size * 0.52)) / size) * size);

  // the shut eye: a curve a little wider than the pill, sagging in the middle with its ends lifted
  vec2 a = p - (c - vec2(0.0, fullH * 0.42));
  float shutW = halfW * 1.45;
  float x = clamp(a.x, -shutW, shutW);
  float curve = -fullH * 0.28 * (1.0 - (x / shutW) * (x / shutW));
  float closed = smoothstep(soft, -soft, length(vec2(a.x - x, a.y - curve)) - fullH * 0.075);

  // poked: a bold X, squeezed shut
  vec2 k = p - c;
  float arm = EYE_HALF_H * 0.62;
  float xd = min(sdSegment(k, vec2(-arm, -arm), vec2(arm, arm)), sdSegment(k, vec2(-arm, arm), vec2(arm, -arm)));
  float xMark = smoothstep(soft, -soft, xd - EYE_HALF_H * 0.085);

  float visible = (1.0 - shut) * (1.0 - poked);
  float white = mix(pill, arc, uHappy) * (1.0 - uHeart) * visible;
  float pink = heart * uHeart * visible;
  float navy = max(closed * shut * (1.0 - poked), xMark * poked);

  return vec3(white, navy, pink);
}

// l is a unit direction in Orby's own space (+z is the front)
vec3 eyes(vec3 l, vec2 lids, vec2 pokes, vec2 shift, float scale, float soft) {
  if (l.z < 0.3) return vec3(0.0);
  return max(eyeAt(l.xy, EYE_L + shift, 1.0, lids.x, pokes.x, scale, soft),
             eyeAt(l.xy, EYE_R + shift, -1.0, lids.y, pokes.y, scale, soft));
}
`;

export const smoothOrbyFragment = /* glsl */ `#version 300 es
precision highp float;

uniform mat4 uModel;
uniform float uFov;
uniform float uAspect;
uniform float uDistance;
uniform float uRadius;
uniform float uBob;
uniform vec2 uLids;
uniform vec2 uEyeShift;
uniform float uEyeScale;
uniform vec2 uPokes;
uniform float uSlant;
uniform float uHappy;
uniform float uHeart;
uniform vec3 uTint;
uniform float uTintAmount;
uniform vec3 uBackground;
uniform vec3 uGlow;
uniform vec3 uSpecular;

in vec2 vUv;
out vec4 outColor;

${ORBY_PAINT}

void main() {
  // the camera sits at +z looking down −z, with the same vertical field of view
  vec2 ndc = vUv * 2.0 - 1.0;
  float t = tan(uFov * 0.5);
  vec3 ro = vec3(0.0, 0.0, uDistance);
  vec3 rd = normalize(vec3(ndc.x * uAspect * t, ndc.y * t, -1.0));
  vec3 center = vec3(0.0, uBob, 0.0);

  vec3 oc = ro - center;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - uRadius * uRadius;
  float disc = b * b - c;
  // how close this ray passes to Orby: a soft halo of Orby's light in the room
  float miss = sqrt(max(dot(oc, oc) - b * b, 0.0)) - uRadius;
  vec3 halo = uGlow * 0.05 * exp(-max(miss, 0.0) * 5.0);

  if (disc < 0.0 || b > 0.0) {
    outColor = vec4(uBackground + halo, 1.0);
    return;
  }

  vec3 p = ro + rd * (-b - sqrt(disc));
  vec3 n = normalize(p - center);
  vec3 v = -rd;
  // Orby's own space, so the eyes turn with the body while the gradient stays fixed to the light, like the logo
  vec3 l = transpose(mat3(uModel)) * n;

  vec3 key = normalize(vec3(-0.5, 0.65, 0.75));
  // the mood tints the body: red when angry, a grey-blue when sad, pink in love
  vec3 color = mix(orbyAlbedo(vec3(n.xy, 1.0)), uTint, uTintAmount);
  color *= 0.66 + 0.3 * max(dot(n, key), 0.0);
  color += uSpecular * 0.35 * pow(max(dot(n, normalize(key + v)), 0.0), 70.0);
  // a deeper blue rim toward the bottom right
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.5);
  color = mix(color, BLUE * 0.7, fresnel * 0.55 * smoothstep(-0.4, 0.6, n.x - n.y));

  vec3 eye = eyes(l, uLids, uPokes, uEyeShift, uEyeScale, 0.006);
  color = mix(color, vec3(2.2), eye.x * 0.96);
  // hearts glow pink, bright enough to bloom
  color = mix(color, vec3(2.4, 0.35, 0.8), eye.z * 0.96);
  // shut and poked eyes: a deep navy, darker than the blue in Orby's own gradient
  color = mix(color, BLUE * 0.32, eye.y * 0.9);
  outColor = vec4(color, 1.0);
}
`;
