// Thin WebGL2 helpers: programs with cached uniform lookups, render targets, and the fullscreen pass

export interface Program {
  program: WebGLProgram;
  use(): void;
  f(name: string, value: number): void;
  i(name: string, value: number): void;
  v2(name: string, x: number, y: number): void;
  v3(name: string, value: ArrayLike<number>): void;
  mat4(name: string, value: Float32Array): void;
}

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type) as WebGLShader;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  // a lost context fails every compile; that isn't a bug in the shader, so it isn't reported as one
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    throw new Error(`shader compile failed: ${gl.getShaderInfoLog(shader)}`);
  }

  return shader;
};

export const createProgram = (gl: WebGL2RenderingContext, vertex: string, fragment: string): Program => {
  const program = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  const locations = new Map<string, WebGLUniformLocation | null>();
  const at = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));

    return locations.get(name) ?? null;
  };

  return {
    program,
    use: () => gl.useProgram(program),
    f: (name, value) => gl.uniform1f(at(name), value),
    i: (name, value) => gl.uniform1i(at(name), value),
    v2: (name, x, y) => gl.uniform2f(at(name), x, y),
    v3: (name, value) => gl.uniform3f(at(name), value[0], value[1], value[2]),
    mat4: (name, value) => gl.uniformMatrix4fv(at(name), false, value),
  };
};

export interface Target {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

// HDR when the GPU can render to half floats, so bloom has real brightness to work with
export const createTarget = (
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  options: { depth?: boolean; hdr: boolean },
): Target => {
  const texture = gl.createTexture() as WebGLTexture;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if (options.hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const framebuffer = gl.createFramebuffer() as WebGLFramebuffer;
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (options.depth) {
    const depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  }

  return { framebuffer, texture, width, height };
};

export const bindTexture = (gl: WebGL2RenderingContext, unit: number, texture: WebGLTexture) => {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
};

// one triangle covering the target; the vertex shader builds it from gl_VertexID
export const drawFullscreen = (gl: WebGL2RenderingContext, target: Target | null, width: number, height: number) => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
  gl.viewport(0, 0, width, height);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
};
