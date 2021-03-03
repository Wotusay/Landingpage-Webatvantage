#define GLSLIFY 1
void main() {
  vUv = uv;

  // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);

  // gl_PointSize = size* 5 (1. / - mvPosition.z);

  gl_PointSize = size*10;
  gl_Position = projectionMatrix * mvPosition;

}
