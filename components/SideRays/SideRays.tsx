import { useEffect, useRef } from "react";
import styles from "./SideRays.module.css";

type SideRaysProps = {
  speed?: number;
  rayColor1?: string;
  rayColor2?: string;
  intensity?: number;
  spread?: number;
  origin?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  tilt?: number;
  saturation?: number;
  blend?: number;
  falloff?: number;
  opacity?: number;
  className?: string;
};

type Uniforms = Record<string, { value: number | number[] }>;

const hexToRgb = (hex: string) => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match
    ? [
        parseInt(match[1], 16) / 255,
        parseInt(match[2], 16) / 255,
        parseInt(match[3], 16) / 255,
      ]
    : [1, 1, 1];
};

const originToFlip = (origin: SideRaysProps["origin"]) => {
  switch (origin) {
    case "top-left":
      return [1, 0];
    case "bottom-right":
      return [0, 1];
    case "bottom-left":
      return [1, 1];
    default:
      return [0, 0];
  }
};

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShader = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);
  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);
  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

const SideRays = ({
  speed = 2.5,
  rayColor1 = "#EAB308",
  rayColor2 = "#96c8ff",
  intensity = 2,
  spread = 2,
  origin = "top-right",
  tilt = 0,
  saturation = 1.5,
  blend = 0.75,
  falloff = 1.6,
  opacity = 1,
  className = "",
}: SideRaysProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uniformsRef = useRef<Uniforms | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    cleanupRef.current?.();

    let cancelled = false;
    const initializeWebGL = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (cancelled || !containerRef.current) return;

      const canvas = document.createElement("canvas");
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      containerRef.current.replaceChildren(canvas);

      const gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
      });
      if (!gl) return;
      glRef.current = gl;

      const compileShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertexShaderObject = compileShader(gl.VERTEX_SHADER, vertexShader);
      const fragmentShaderObject = compileShader(
        gl.FRAGMENT_SHADER,
        fragmentShader
      );
      const program = gl.createProgram();
      if (!vertexShaderObject || !fragmentShaderObject || !program) return;

      gl.attachShader(program, vertexShaderObject);
      gl.attachShader(program, fragmentShaderObject);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW
      );
      const positionLocation = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const locations = {
        iTime: gl.getUniformLocation(program, "iTime"),
        iResolution: gl.getUniformLocation(program, "iResolution"),
        iSpeed: gl.getUniformLocation(program, "iSpeed"),
        iRayColor1: gl.getUniformLocation(program, "iRayColor1"),
        iRayColor2: gl.getUniformLocation(program, "iRayColor2"),
        iIntensity: gl.getUniformLocation(program, "iIntensity"),
        iSpread: gl.getUniformLocation(program, "iSpread"),
        iFlipX: gl.getUniformLocation(program, "iFlipX"),
        iFlipY: gl.getUniformLocation(program, "iFlipY"),
        iTilt: gl.getUniformLocation(program, "iTilt"),
        iSaturation: gl.getUniformLocation(program, "iSaturation"),
        iBlend: gl.getUniformLocation(program, "iBlend"),
        iFalloff: gl.getUniformLocation(program, "iFalloff"),
        iOpacity: gl.getUniformLocation(program, "iOpacity"),
      };

      const [flipX, flipY] = originToFlip(origin);
      const uniforms: Uniforms = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },
        iSpeed: { value: speed },
        iRayColor1: { value: hexToRgb(rayColor1) },
        iRayColor2: { value: hexToRgb(rayColor2) },
        iIntensity: { value: intensity },
        iSpread: { value: spread },
        iFlipX: { value: flipX },
        iFlipY: { value: flipY },
        iTilt: { value: tilt },
        iSaturation: { value: saturation },
        iBlend: { value: blend },
        iFalloff: { value: falloff },
        iOpacity: { value: opacity },
      };
      uniformsRef.current = uniforms;

      const applyUniforms = () => {
        const u = uniformsRef.current;
        if (!u) return;
        gl.uniform1f(locations.iTime, u.iTime.value as number);
        gl.uniform2fv(locations.iResolution, u.iResolution.value as number[]);
        gl.uniform1f(locations.iSpeed, u.iSpeed.value as number);
        gl.uniform3fv(locations.iRayColor1, u.iRayColor1.value as number[]);
        gl.uniform3fv(locations.iRayColor2, u.iRayColor2.value as number[]);
        gl.uniform1f(locations.iIntensity, u.iIntensity.value as number);
        gl.uniform1f(locations.iSpread, u.iSpread.value as number);
        gl.uniform1f(locations.iFlipX, u.iFlipX.value as number);
        gl.uniform1f(locations.iFlipY, u.iFlipY.value as number);
        gl.uniform1f(locations.iTilt, u.iTilt.value as number);
        gl.uniform1f(locations.iSaturation, u.iSaturation.value as number);
        gl.uniform1f(locations.iBlend, u.iBlend.value as number);
        gl.uniform1f(locations.iFalloff, u.iFalloff.value as number);
        gl.uniform1f(locations.iOpacity, u.iOpacity.value as number);
      };

      const updateSize = () => {
        if (!containerRef.current) return;
        const dpr = Math.min(window.devicePixelRatio, 2);
        const { clientWidth, clientHeight } = containerRef.current;
        canvas.width = Math.max(1, Math.floor(clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(clientHeight * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
        uniforms.iResolution.value = [canvas.width, canvas.height];
      };

      const loop = (time: number) => {
        if (!glRef.current || !uniformsRef.current) return;
        uniforms.iTime.value = time * 0.001;
        applyUniforms();
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        animationIdRef.current = requestAnimationFrame(loop);
      };

      window.addEventListener("resize", updateSize);
      updateSize();
      animationIdRef.current = requestAnimationFrame(loop);

      cleanupRef.current = () => {
        if (animationIdRef.current)
          cancelAnimationFrame(animationIdRef.current);
        window.removeEventListener("resize", updateSize);
        canvas.parentNode?.removeChild(canvas);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        glRef.current = null;
        uniformsRef.current = null;
        animationIdRef.current = null;
      };
    };

    initializeWebGL();
    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [
    speed,
    rayColor1,
    rayColor2,
    intensity,
    spread,
    origin,
    tilt,
    saturation,
    blend,
    falloff,
    opacity,
  ]);

  useEffect(() => {
    if (!uniformsRef.current) return;
    const [flipX, flipY] = originToFlip(origin);
    uniformsRef.current.iSpeed.value = speed;
    uniformsRef.current.iRayColor1.value = hexToRgb(rayColor1);
    uniformsRef.current.iRayColor2.value = hexToRgb(rayColor2);
    uniformsRef.current.iIntensity.value = intensity;
    uniformsRef.current.iSpread.value = spread;
    uniformsRef.current.iFlipX.value = flipX;
    uniformsRef.current.iFlipY.value = flipY;
    uniformsRef.current.iTilt.value = tilt;
    uniformsRef.current.iSaturation.value = saturation;
    uniformsRef.current.iBlend.value = blend;
    uniformsRef.current.iFalloff.value = falloff;
    uniformsRef.current.iOpacity.value = opacity;
  }, [
    speed,
    rayColor1,
    rayColor2,
    intensity,
    spread,
    origin,
    tilt,
    saturation,
    blend,
    falloff,
    opacity,
  ]);

  return (
    <div
      ref={containerRef}
      className={`${styles.sideRaysContainer} ${className}`.trim()}
    />
  );
};

export default SideRays;
