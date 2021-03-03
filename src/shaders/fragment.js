export const fragmentShader =
`
uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec4 resolution;
varying vec4 vPosition;
varying vec2 vUv;

void main() {
  gl_FragColor = vec4(1.0,0.0,0.0,1.0);
}
`;
