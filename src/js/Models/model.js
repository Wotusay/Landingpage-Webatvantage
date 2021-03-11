export default class Model{
  // Hier worden alle models ingeladen
  constructor(model,loader){
    this.object;
    this.model = model;
    this.loader = loader;
    this.costumModelLoader();
  }

  costumModelLoader() {
    // Hier wordt de function voor de load gebeurd
    this.loader.load(this.model, gltf => {
     return this.object = gltf.scene;
  })
}
};
