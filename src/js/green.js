import GreenEgg from '../assets/models/greenegg.glb';
import GLTFLoader from 'three-gltf-loader';

export default class GreenModel{
  constructor(){
    this.test;
    this.costumModelLoader();
  }

  costumModelLoader() {
    const loader = new GLTFLoader();
    loader.load(GreenEgg, gltf => {
     return this.test = gltf.scene.getObjectByName('Sphere');
  })
}
}
