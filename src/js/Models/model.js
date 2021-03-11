


export default class Model{
  constructor(model,loader){
    this.object;
    this.model = model;
    this.loader = loader;
    this.costumModelLoader();
  }

  costumModelLoader() {

    this.loader.load(this.model, gltf => {
     return this.object = gltf.scene;
  })
}
};
