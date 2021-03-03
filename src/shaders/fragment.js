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

  float width = 0.01;

  float borderx = max(step(vUv.x, width),step(1.0 - vUv.x,width));
  float bordery = max(step(vUv.y, width),step(1.0 - vUv.y,width));
  float border = max(borderx,bordery);

  vec3 color = vec3(border);
  gl_FragColor = vec4(color,1.0);
}
`;
