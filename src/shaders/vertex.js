 export const vertexShader = `
uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec4 resolution;
varying vec4 vPosition;
varying vec2 vUv;

attribute vec3 barycentric;

varying vec3 vBarycentric;

 void main() {
  vUv = uv;
  vBarycentric = barycentric;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;

}`;
