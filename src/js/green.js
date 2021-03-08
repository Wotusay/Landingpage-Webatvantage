import GreenEgg from '../assets/models/greenegg.glb';
import KerstGreen from '../assets/models/kerstgreen.glb';
import GLTFLoader from 'three-gltf-loader';

export default class GreenModel{
  constructor(){
    this.test;
    this.costumModelLoader();
  }

  costumModelLoader() {
    let date = new Date();

    let month = date.getMonth();
    let model;

    if (month === 11) {
      model = KerstGreen ;
    }

    if (month === 2) {
      model = GreenEgg;
    }

    const loader = new GLTFLoader();
    loader.load(model, gltf => {
     return this.test = gltf.scene.getObjectByName('Sphere');
  })
}
}
