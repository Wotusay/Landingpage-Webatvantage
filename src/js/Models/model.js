import GLTFLoader from 'three-gltf-loader';

export default class Model{
  constructor(model){
    this.object;
    this.model = model;
    this.collisionBox = 'cylinder';
    this.costumModelLoader();
  }

  costumModelLoader() {
    const loader = new GLTFLoader();
    loader.load(this.model, gltf => {
     return this.object = gltf.scene;
  })
}
};
