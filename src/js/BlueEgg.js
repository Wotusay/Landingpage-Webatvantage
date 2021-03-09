import BlueEgg from '../assets/models/blueegg.glb';
import BlueKerst from '../assets/models/kerstblue.glb';
import GLTFLoader from 'three-gltf-loader';

export default class BlueModel{
  constructor(){
    this.object;
    this.collisionBox = 'sphere';
    this.costumModelLoader();
  }

  costumModelLoader() {
    let date = new Date();

    let month = date.getMonth();
    let model;

    if (month === 11) {
      model = BlueKerst;
    }

    if (month === 2) {
      model = BlueEgg;
    }

    const loader = new GLTFLoader();
    loader.load(model, gltf => {
     return this.object = gltf.scene.getObjectByName('Sphere');
  })
}
}
