#define GLSLIFY 1
uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec4 resolution;
varying vec2 vUv;
varying vec4 vPosition;

void main() {
  gl_FragColor = vec4(1.,0.,0.0,1.);
}
