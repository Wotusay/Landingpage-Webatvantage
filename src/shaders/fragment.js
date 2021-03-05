export const fragmentShader =
`
uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec4 resolution;
varying vec4 vPosition;
varying vec2 vUv;

varying vec3 vBarycentric;

void main() {

  vec3 b = vBarycentric;
  float width = 0.01;

  //float borderx = max(step(vUv.x, width),step(1.0 - vUv.x,width));
  //float bordery = max(step(vUv.y, width),step(1.0 - vUv.y,width));
  //float border = max(borderx,bordery);


  float border = max(max(step(b.x, width), step(b.y,width)), step(b.z,width))/1;
  vec3 color = vec3(border/3.);
  gl_FragColor = vec4(vUv,0.0,1.0);
  gl_FragColor = vec4(vBarycentric,1.0);
  gl_FragColor = vec4(color/10.0,1.0);
}
`;
