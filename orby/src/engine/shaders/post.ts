// After Orby: bloom (dual-Kawase down and up chains) and the final composite

export const fullscreenVertex = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

// four taps around the pixel; the first step also keeps only what's brighter than the threshold
export const bloomDown = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uThreshold;
in vec2 vUv;
out vec4 outColor;
vec3 bright(vec3 c) { return max(c - uThreshold, 0.0); }
void main() {
  vec3 sum = bright(texture(uSource, vUv).rgb) * 4.0;
  sum += bright(texture(uSource, vUv + uTexel * vec2(-1, -1)).rgb);
  sum += bright(texture(uSource, vUv + uTexel * vec2(1, -1)).rgb);
  sum += bright(texture(uSource, vUv + uTexel * vec2(-1, 1)).rgb);
  sum += bright(texture(uSource, vUv + uTexel * vec2(1, 1)).rgb);
  outColor = vec4(sum / 8.0, 1.0);
}
`;

// eight taps in a diamond, blended additively into the next larger level
export const bloomUp = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec3 sum = texture(uSource, vUv + uTexel * vec2(-2, 0)).rgb + texture(uSource, vUv + uTexel * vec2(2, 0)).rgb;
  sum += texture(uSource, vUv + uTexel * vec2(0, -2)).rgb + texture(uSource, vUv + uTexel * vec2(0, 2)).rgb;
  sum += (texture(uSource, vUv + uTexel * vec2(-1, -1)).rgb + texture(uSource, vUv + uTexel * vec2(1, -1)).rgb) * 2.0;
  sum += (texture(uSource, vUv + uTexel * vec2(-1, 1)).rgb + texture(uSource, vUv + uTexel * vec2(1, 1)).rgb) * 2.0;
  outColor = vec4(sum / 12.0, 1.0);
}
`;

export const composite = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomAmount;
uniform float uRays;
uniform float uHaze;
uniform float uBeams;
uniform float uGrain;
uniform float uTime;
uniform float uAspect;
uniform vec3 uHazeColor;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 color = texture(uScene, vUv).rgb + texture(uBloom, vUv).rgb * uBloomAmount;

  // light rays: the bloom smeared outward from the screen's center, fading with distance
  vec2 toCenter = vUv - 0.5;
  vec3 rays = vec3(0.0);
  for (int i = 0; i < 24; i++) {
    float t = float(i) / 24.0;
    rays += texture(uBloom, vUv - toCenter * t * 0.65).rgb * (1.0 - t);
  }
  color += rays / 24.0 * uRays * 1.6;

  // haze: a soft glow of the room's air around Orby
  float fromCenter = length(toCenter * vec2(uAspect, 1.0));
  color += uHazeColor * uHaze * 0.08 * exp(-fromCenter * 2.4);

  // beams: slow diagonal shafts of light across the dark room
  float band = sin((vUv.x * uAspect * 0.8 + vUv.y * 1.1) * 7.0 + uTime * 0.12) * sin((vUv.x * uAspect * 0.8 + vUv.y * 1.1) * 2.3 - uTime * 0.05);
  color += uHazeColor * smoothstep(0.35, 1.0, band) * uBeams * 0.05 * (1.2 - vUv.y);

  color = aces(color);
  color *= smoothstep(1.25, 0.3, length(toCenter));
  color = pow(color, vec3(1.0 / 2.2));
  color += (hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) * uGrain;
  outColor = vec4(color, 1.0);
}
`;
