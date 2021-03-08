import RedEgg from '../assets/models/redegg.glb';
import KerstRed from '../assets/models/kerstred.glb';
import GLTFLoader from 'three-gltf-loader';

export default class RedModel{
  constructor(){
    this.test;
    this.costumModelLoader();
  }

  costumModelLoader() {
    let date = new Date();

    let month = date.getMonth();
    let model;

    if (month === 2) {
      model = KerstRed;
    }

    if (month === 2) {
      model = RedEgg;
    }

    const loader = new GLTFLoader();
    loader.load(model, gltf => {
     return this.test = gltf.scene.getObjectByName('Sphere');
  })
}
}
