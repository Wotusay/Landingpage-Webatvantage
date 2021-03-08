import BlueEgg from '../assets/models/blueegg.glb';
import GLTFLoader from 'three-gltf-loader';

export default class BlueModel{
  constructor(){
    this.test;
    this.costumModelLoader();
  }

  costumModelLoader() {
    const loader = new GLTFLoader();
    loader.load(BlueEgg, gltf => {
     return this.test = gltf.scene.getObjectByName('Sphere');
  })
}
}
