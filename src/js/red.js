import RedEgg from '../assets/models/redegg.glb';
import GLTFLoader from 'three-gltf-loader';

export default class RedModel{
  constructor(){
    this.test;
    this.costumModelLoader();
  }

  costumModelLoader() {
    const loader = new GLTFLoader();
    loader.load(RedEgg, gltf => {
     return this.test = gltf.scene.getObjectByName('Sphere');
  })
}
}
