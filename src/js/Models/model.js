export default class Model{
  // Hier worden alle models ingeladen
  constructor(model,loader){
    this.object;
    this.model = model;
    this.loader = loader;
    this.costumModelLoader();
  }

  costumModelLoader() {
    let o ;
    // Hier wordt de function voor de load gebeurd
    this.loader.load(this.model, gltf => {
      o = gltf.scene;
      o.traverse(n => {
        if(n.isMesh) {
          n.recieveShadow = true;
        }
      })
     return this.object = gltf.scene;
  })
}
};
