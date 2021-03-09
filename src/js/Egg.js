import RedEgg from '../assets/models/redegg.glb';
import Bunny from '../assets/models/Bunny.glb';
import GLTFLoader from 'three-gltf-loader';

export default class BunnyModel{
  constructor(){
    this.collisionBox = 'cylinder';
    this.object;
    this.costumModelLoader();
  }

  costumModelLoader() {
    let date = new Date();

    let month = date.getMonth();
    let model;

    if (month === 11) {
      model = KerstRed;
    }

    if (month === 2) {
      model = Bunny;
    }

    const loader = new GLTFLoader();
    loader.load(model, gltf => {

      console.log(gltf.scene);
     return this.object = gltf.scene;
  })
}
}
