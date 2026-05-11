(() => {
  // ------------------------------------------------------------------
  // Gaussian wave-packet field, WebGL fragment shader.
  //
  //   ψᵢ(r, t) = exp(−|r − rᵢ|² / 2σᵢ²) · cos(kᵢ·(r − rᵢ) − ωᵢ·t)
  //   Re{Ψ}(r, t) = Σᵢ ψᵢ(r, t)
  //
  // Each "packet" is a localized wavefunction — a Gaussian envelope
  // around a carrier plane wave. We display Re{Ψ}, which shows the
  // wave inside each envelope (the stripes you'd see inside a quantum
  // particle's spatial wavefunction). Packets drift at their own group
  // velocities. Where two overlap, their fields add: in-phase carriers
  // → bright spot (constructive); out-of-phase → cancellation (white).
  //
  // Parallax: each packet has its own scroll-depth multiplier. Some
  // packets are "close" (large multiplier — slide fast across screen
  // as you scroll); others are "far" (small multiplier — drift almost
  // imperceptibly). The differential gives true layered depth.
  // ------------------------------------------------------------------

  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
    display: block;
  `;
  document.body.prepend(canvas);

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  }) || canvas.getContext('experimental-webgl');

  if (!gl) { canvas.remove(); return; }

  const VS = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  // For each packet, the shader needs:
  //   pos   — Gaussian centre, scroll-parallax already applied
  //   k     — carrier wave vector (direction × wavenumber)
  //   sigma — Gaussian envelope width
  //   freq  — carrier angular frequency (time-phase drift rate)
  //   amp   — peak amplitude contribution
  //
  // We wrap pos.y by mod() so each packet recycles vertically through
  // the viewport as the user scrolls — no packet ever runs out.
  const FS = `
    precision highp float;
    #define N 5
    uniform vec2  u_res;
    uniform float u_time;
    uniform float u_scroll;
    uniform vec2  u_pos[N];
    uniform vec2  u_k[N];
    uniform float u_sigma[N];
    uniform float u_freq[N];
    uniform float u_depth[N];
    uniform float u_amp[N];

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res.y;
      float ar = u_res.x / u_res.y;

      float field = 0.0;
      for (int i = 0; i < N; i++) {
        // Per-packet parallax: scroll shifts each packet's centre by its
        // own depth multiplier.  Then wrap so packets cycle through the
        // viewport instead of running off forever.
        vec2 pos = u_pos[i] + vec2(0.0, u_scroll * u_depth[i]);
        pos.x = mod(pos.x + 0.4, ar + 0.8) - 0.4;
        pos.y = mod(pos.y + 0.4, 1.8)      - 0.4;

        vec2  r       = uv - pos;
        float sigma   = u_sigma[i];
        float env     = exp(-dot(r, r) / (2.0 * sigma * sigma));
        float carrier = cos(dot(u_k[i], r) - u_freq[i] * u_time);
        field += u_amp[i] * env * carrier;
      }

      // |field| treats constructive crests symmetrically (+ and − carriers
      // both count as "high amplitude"). Destructive overlap → field ≈ 0 → white.
      float amp = abs(field);
      float t   = smoothstep(0.18, 0.62, amp);

      vec3 base = vec3(1.0);                  // white page
      vec3 wave = vec3(0.82, 0.88, 0.95);     // light cool grey

      // Peak tint ≈ mix(white, slate, 0.50) → ~9% darker than white.
      vec3 color = mix(base, wave, t * 0.50);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compile(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(VS, gl.VERTEX_SHADER);
  const fs = compile(FS, gl.FRAGMENT_SHADER);
  if (!vs || !fs) { canvas.remove(); return; }

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    canvas.remove();
    return;
  }
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes    = gl.getUniformLocation(program, 'u_res');
  const uTime   = gl.getUniformLocation(program, 'u_time');
  const uScroll = gl.getUniformLocation(program, 'u_scroll');
  const uPos    = gl.getUniformLocation(program, 'u_pos');
  const uK      = gl.getUniformLocation(program, 'u_k');
  const uSigma  = gl.getUniformLocation(program, 'u_sigma');
  const uFreq   = gl.getUniformLocation(program, 'u_freq');
  const uDepth  = gl.getUniformLocation(program, 'u_depth');
  const uAmp    = gl.getUniformLocation(program, 'u_amp');

  // ----- Packet definitions -----
  // Ordered roughly from far-background → close-foreground.
  // Each has a unique drift velocity (vx, vy), carrier wave vector
  // (kx, ky), envelope width σ, time-phase rate, parallax depth,
  // and amplitude. Closer packets: smaller σ (sharper), higher amp,
  // higher depth (slide faster with scroll). Farther packets: wider σ,
  // lower amp, lower depth (almost stationary as scroll happens).
  const CONFIG = [
    // ix    iy    vx       vy       kx    ky    sigma  freq    depth     amp
    [ 0.30, 0.20,  0.010,   0.006,   70,   18,   0.22,  0.40,   0.00012,  0.40 ],
    [ 0.85, 0.45, -0.008,   0.013,  -55,   50,   0.18,  0.55,   0.00035,  0.50 ],
    [ 0.20, 0.70,  0.014,  -0.009,   60,  -38,   0.15,  0.48,   0.00065,  0.60 ],
    [ 0.60, 0.10, -0.012,   0.011,  -45,  -55,   0.13,  0.58,   0.00105,  0.70 ],
    [ 0.45, 0.85,  0.007,  -0.015,   42,   65,   0.11,  0.45,   0.00155,  0.80 ],
  ];

  const N = CONFIG.length;
  const posArr   = new Float32Array(N * 2);
  const kArr     = new Float32Array(N * 2);
  const sigmaArr = new Float32Array(N);
  const freqArr  = new Float32Array(N);
  const depthArr = new Float32Array(N);
  const ampArr   = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const c = CONFIG[i];
    kArr[i * 2]     = c[4];
    kArr[i * 2 + 1] = c[5];
    sigmaArr[i] = c[6];
    freqArr[i]  = c[7];
    depthArr[i] = c[8];
    ampArr[i]   = c[9];
  }

  // Static uniforms — bound once, never change.
  gl.uniform2fv(uK, kArr);
  gl.uniform1fv(uSigma, sigmaArr);
  gl.uniform1fv(uFreq,  freqArr);
  gl.uniform1fv(uDepth, depthArr);
  gl.uniform1fv(uAmp,   ampArr);

  function updatePositions(time, ar) {
    // Time-driven drift: each packet's natural-position component.
    // Wrap to a range slightly larger than the viewport so packets
    // recycle invisibly off the edge.
    for (let i = 0; i < N; i++) {
      const c = CONFIG[i];
      let x = c[0] + c[2] * time;
      let y = c[1] + c[3] * time;

      const xRange = ar + 0.8;
      const yRange = 1.8;
      x = ((x + 0.4) % xRange + xRange) % xRange - 0.4;
      y = ((y + 0.4) % yRange + yRange) % yRange - 0.4;

      posArr[i * 2]     = x;
      posArr[i * 2 + 1] = y;
    }
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  let paused = false;
  let rafHandle = null;

  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused && rafHandle === null) {
      rafHandle = requestAnimationFrame(render);
    }
  });

  function render(t) {
    rafHandle = null;
    if (paused) return;
    const time = t * 0.001;
    const ar = canvas.width / canvas.height;

    updatePositions(time, ar);

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform1f(uScroll, scrollY * dpr);
    gl.uniform2fv(uPos, posArr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    rafHandle = requestAnimationFrame(render);
  }
  rafHandle = requestAnimationFrame(render);
})();
