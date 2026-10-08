"use client";

import { useEffect, useRef, useState } from "react";
import { fragmentShader, vertexShader } from "@/lib/shader";
import { cursorImpulse, dragTarget, smoothDrag, type Vec2 } from "@/lib/interaction";

export function ShaderBackground({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pauseRef = useRef(paused);
  const wakeRef = useRef<() => void>(() => {});
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => { pauseRef.current = paused; wakeRef.current(); }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", {
      alpha: false, antialias: false, depth: false, stencil: false,
      preserveDrawingBuffer: false, powerPreference: "low-power",
    });
    if (!gl) { setUnavailable(true); return; }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    let disposed = false;
    let lost = false;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let uniforms: Record<string, WebGLUniformLocation | null> = {};
    let raf = 0;
    let width = 1, height = 1, world = 1;
    let scale = 1;
    let quality = 1;
    const precisePointer = window.matchMedia("(pointer: fine)");
    let elapsed = 0;
    let previous = 0;
    let sampleSeconds = 0, samples = 0;
    let activePointer: number | null = null;
    let start: Vec2 = [0, 0];
    let touch: Vec2 = [0, 0];
    let drag: Vec2 = [0, 0];
    let mousePosition: Vec2 | null = null;
    let previousMouse: Vec2 | null = null;
    let impulse: Vec2 = [0, 0];
    let pulse = 0;
    let pulseAge: number | null = null;
    let pulseCenter: Vec2 = [0, 0];
    const seed = Math.random();
    const minPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const fragment = minPrecision?.precision ? fragmentShader : fragmentShader.replace("precision highp float", "precision mediump float");

    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) throw new Error("Cannot create shader");
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        const error = gl!.getShaderInfoLog(shader);
        gl!.deleteShader(shader);
        throw new Error(error || "Shader compile failed");
      }
      return shader;
    }
    function initialize() {
      const shaders: WebGLShader[] = [];
      try {
        shaders.push(compile(gl!.VERTEX_SHADER, vertexShader));
        shaders.push(compile(gl!.FRAGMENT_SHADER, fragment));
        program = gl!.createProgram();
        if (!program) throw new Error("Cannot create program");
        shaders.forEach(shader => gl!.attachShader(program!, shader));
        gl!.linkProgram(program);
        if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) throw new Error(gl!.getProgramInfoLog(program) || "Link failed");
        gl!.useProgram(program);
        buffer = gl!.createBuffer();
        if (!buffer) throw new Error("Cannot create vertex buffer");
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
        // A single oversized triangle covers the viewport without a diagonal seam.
        gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW);
        const attribute = gl!.getAttribLocation(program, "aPosition");
        gl!.enableVertexAttribArray(attribute);
        gl!.vertexAttribPointer(attribute, 2, gl!.FLOAT, false, 0, 0);
        uniforms = Object.fromEntries(["resolution", "time", "touch", "uDrag", "startRandom", "uWorldSize", "uElapsed", "uGridSize", "uDesktop", "uPulse", "uPulseCenter"].map(name => [name, gl!.getUniformLocation(program!, name)]));
        setUnavailable(false);
        return true;
      } catch (error) {
        console.error("Shader background unavailable:", error);
        if (buffer) gl!.deleteBuffer(buffer);
        if (program) gl!.deleteProgram(program);
        buffer = null; program = null;
        setUnavailable(true);
        return false;
      } finally { shaders.forEach(shader => gl!.deleteShader(shader)); }
    }
    function resize() {
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, bounds.width), nextHeight = Math.max(1, bounds.height);
      if (nextWidth !== width || nextHeight !== height) resetPointer();
      width = nextWidth; height = nextHeight;
      world = Math.min(width, height);
      // Keep at least one render pixel per CSS pixel on ordinary viewports.
      // On Retina desktops, start at DPR 2; adaptive quality must not turn the
      // shader into an enlarged low-resolution image.
      const pixelBudget = precisePointer.matches ? 4_000_000 : 1_600_000;
      const budgetScale = Math.sqrt(pixelBudget / (width * height));
      const nativeScale = Math.min(window.devicePixelRatio || 1, precisePointer.matches ? 2 : 1.5, budgetScale);
      const minimumScale = Math.min(1, nativeScale);
      scale = Math.max(minimumScale, nativeScale * quality);
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      gl!.viewport(0, 0, canvas.width, canvas.height);
      wake();
    }
    function draw() {
      if (lost || !program) return;
      gl!.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl!.uniform1f(uniforms.time, elapsed);
      gl!.uniform1f(uniforms.uElapsed, reduced ? 2 : elapsed);
      gl!.uniform1f(uniforms.startRandom, seed);
      gl!.uniform1f(uniforms.uGridSize, precisePointer.matches ? 140 : 70);
      gl!.uniform1f(uniforms.uDesktop, precisePointer.matches ? 1 : 0);
      gl!.uniform1f(uniforms.uWorldSize, world * scale);
      gl!.uniform2f(uniforms.touch, touch[0] * scale, touch[1] * scale);
      gl!.uniform2f(uniforms.uDrag, drag[0], drag[1]);
      gl!.uniform1f(uniforms.uPulse, pulse);
      gl!.uniform2f(uniforms.uPulseCenter, pulseCenter[0] * scale, pulseCenter[1] * scale);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }
    function tick(now: number) {
      raf = 0;
      if (disposed || lost || document.hidden) return;
      if (reduced || pauseRef.current) { draw(); previous = 0; return; }
      if (previous && now - previous < 1000 / 60 - 1) { raf = requestAnimationFrame(tick); return; }
      const dt = previous ? (now - previous) / 1000 : 1 / 60;
      previous = now;
      elapsed += dt;
      if (pulseAge !== null) {
        pulseAge += dt;
        const progress = Math.min(1, pulseAge / 0.16);
        pulse = progress * progress * (3 - 2 * progress) *
          Math.exp(-Math.max(0, pulseAge - 0.16) / 0.38);
        if (pulseAge > 0.16 && pulse < 0.001) { pulse = 0; pulseAge = null; }
      }
      if (activePointer !== null) {
        drag = smoothDrag(drag, dragTarget(start, touch, world), Math.min(dt, 0.5), true);
      } else if (mousePosition !== null) {
        const movement: Vec2 = previousMouse ? [mousePosition[0] - previousMouse[0], mousePosition[1] - previousMouse[1]] : [0, 0];
        previousMouse = mousePosition;
        impulse = cursorImpulse(impulse, movement, world, dt);
        touch = mousePosition;
        // The impulse already smooths velocity. Render it directly so it
        // starts decaying on the first frame without further movement.
        drag = impulse;
      } else {
        drag = smoothDrag(drag, [0, 0], Math.min(dt, 0.5), false);
      }
      sampleSeconds += dt; samples++;
      if (sampleSeconds > 3) {
        if (sampleSeconds / samples > 1 / 42 && quality > 0.5) {
          quality = Math.max(0.5, quality * 0.8);
          resize();
        }
        sampleSeconds = 0; samples = 0;
      }
      draw();
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function wake() {
      if (!raf && !disposed && !lost && !document.hidden) raf = requestAnimationFrame(tick);
    }
    function position(event: PointerEvent): Vec2 {
      const bounds = canvas.getBoundingClientRect();
      return [event.clientX - bounds.left, bounds.bottom - event.clientY];
    }
    function isControl(event: PointerEvent) {
      return event.target instanceof Element && !!event.target.closest("a, button, input, textarea, select, [data-no-gesture]");
    }
    function down(event: PointerEvent) {
      if (reduced || pauseRef.current || activePointer !== null || event.button !== 0) return;
      pulseCenter = position(event);
      pulseAge = 0;
      pulse = 0;
      wake();
      // Controls also give visual feedback without intercepting their action.
      if (event.pointerType === "mouse" || isControl(event)) return;
      mousePosition = previousMouse = null;
      impulse = [0, 0];
      activePointer = event.pointerId;
      start = touch = position(event);
      wake();
    }
    function move(event: PointerEvent) {
      if (reduced || pauseRef.current) return;
      if (event.pointerType === "mouse" && activePointer === null) {
        const next = position(event);
        if (mousePosition === null) previousMouse = next;
        mousePosition = next;
        wake();
      } else if (event.pointerId === activePointer) touch = position(event);
    }
    function leave(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      // Keep the last touch center for the return, but forget the cursor origin.
      mousePosition = previousMouse = null;
      impulse = [0, 0];
    }
    function up(event: PointerEvent) {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
    }
    function resetPointer() { activePointer = null; drag = [0, 0]; mousePosition = previousMouse = null; impulse = [0, 0]; pulse = 0; pulseAge = null; }
    function stop() { cancelAnimationFrame(raf); raf = 0; previous = 0; resetPointer(); }
    function visibility() { if (document.hidden) stop(); else wake(); }
    function preference() { reduced = motion.matches; stop(); wake(); }
    function contextLost(event: Event) { event.preventDefault(); lost = true; stop(); setUnavailable(true); }
    function contextRestored() {
      lost = false; previous = 0;
      if (initialize()) resize();
    }
    if (!initialize()) return;
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", stop);
    window.addEventListener("focus", wake);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", preference);
    precisePointer.addEventListener("change", resize);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    wakeRef.current = () => { stop(); wake(); };
    return () => {
      disposed = true; stop(); observer.disconnect(); wakeRef.current = () => {};
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", stop);
      window.removeEventListener("focus", wake);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", preference);
      precisePointer.removeEventListener("change", resize);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      if (!lost) { gl.deleteBuffer(buffer); gl.deleteProgram(program); }
    };
  }, []);
  return <canvas ref={canvasRef} className="shader" aria-hidden="true" data-unavailable={unavailable || undefined} />;
}
