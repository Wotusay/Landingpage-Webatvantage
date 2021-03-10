import Egg from '../../assets/models/egg.glb';
import GLTFLoader from 'three-gltf-loader';

export default class EggModel{
  constructor(){
    this.collisionBox = 'sphere';
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
      model = Egg;
    }

    const loader = new GLTFLoader();
    loader.load(model, gltf => {

      console.log(gltf.scene);
     return this.object = gltf.scene;
  })
}
}
