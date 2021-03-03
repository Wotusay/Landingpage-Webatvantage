import * as THREE from 'three';
import { fragmentShader } from './shaders/fragment.js';
import { vertexShader } from './shaders/vertex.js'
import './style.css';
const OrbitControls = require('three-orbitcontrols');

export default class Sketch {
  constructor(selector) {
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.container = document.getElementById('container');
    this.container.appendChild( this.renderer.domElement );
    this.width =  this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 0.001, 1000 );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.setupResize();
    this.addMesh();
    this.time = 0;
    this.resize();
    this.render();
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this))
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  addMesh() {
    this.geometry = new THREE.PlaneBufferGeometry(1,1);
    this.geometry = new THREE.OctahedronBufferGeometry(1)
    this.material = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
    this.material = new THREE.ShaderMaterial({
      fragmentShader: fragmentShader,
      vertexShader: vertexShader,
      uniforms: {
        time: {type:'f', value:0},
        resolution:{type: "v4", value: new THREE.Vector4()} ,
        uvRate1: {
          value: new THREE.Vector2(1,1)
        }
      },
      side: THREE.DoubleSide
    })
    this.mesh = new THREE.Mesh( this.geometry, this.material );
    this.scene.add( this.mesh );
  }



  render() {
    this.time++;

    this.renderer.render( this.scene, this.camera );
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch();

