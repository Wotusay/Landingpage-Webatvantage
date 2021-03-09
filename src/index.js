import * as THREE from 'three';
import { fragmentShader } from './shaders/fragment.js';
import { vertexShader } from './shaders/vertex.js';
import * as dat from 'dat.gui';
import './style.css';

import BlueModel from './js/blue';
import RedModel from './js/red';
import GreenModel from './js/green';
import BunnyModel from './js/bunny';


import * as OIMO from 'oimo';

const fontPathOne = require('./assets/fonts/HalyardDisplay-ExtraLight.json');
const fontPathTwo = require('./assets/fonts/HalyardDisplay-Regular.json');

export default class Sketch {
  constructor(date) {
    this.date = date;
    this.renderer = new THREE.WebGLRenderer( { alpha: true , powerPreference: "high-performance", antialias:true } );
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.container = document.getElementById('container');
    this.container.appendChild( this.renderer.domElement );
    this.width =  this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.mouse = new THREE.Vector2();
    this.point = new THREE.Vector3(0,0,0)
    this.light = new THREE.AmbientLight( 0xfffffff );

    this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 0.001, 300 );
    this.camera.position.set(0, 0, 6);
    this.scene = new THREE.Scene();
    this.raycaster =  new THREE.Raycaster();
    this.loader = new THREE.FontLoader();
    this.fontLight;

    this.scene.add(this.light);

    this.setupResize();
    this.fontMaker();
    this.physics();
    this.addMesh();
    this.time = 0;
    this.mouseMove();
    this.onLoad();
    //this.mouseClick();
    this.render();
    //this.settings();

    this.resize();
  }

  dateCheckerForModels(size) {
    let month = this.date.getMonth();
    let model;
    switch (month) {
      case 11 :
      case 0 :
      case 1 :
        model = new THREE.SphereBufferGeometry(size / 1.5);
        break;
      case 2 :
      case 3 :
      case 4 :
        model = new THREE.BoxBufferGeometry(size,size,size);
        break;
      case 5 :
      case 6 :
      case 7 :
        model = new THREE.CylinderBufferGeometry(0,size/2,size/2);
        break;
      case 8 :
      case 9 :
      case 10 :
        model = new THREE.TetrahedronBufferGeometry(size/1.5);
        break;
      default:
        model = new THREE.BoxBufferGeometry(size,size,size);
    }

    return model;
  }


  setModelForHoliday() {
    let numberGen = Math.floor(Math.random() * 3);
    let model;
    switch (numberGen) {
      case 0 :
        model = new BlueModel();
        break;
      case 1 :
        model = new BunnyModel() ;
        break;
      case 2 :
        model = new RedModel();
        break;
    }
    return model;
  }

  setColorForBlock() {
    let numberGen = Math.floor(Math.random() * 3);
    let color;
    switch (numberGen) {
      case 0 :
        color = 0x57BDA0;
        break;
      case 1 :
        color = 0x7ED7FA;
        break;
      case 2 :
        color = 0xE17474;
        break;
    }

    return color;
  }

  setPositionForBlock() {
    let numberGen = Math.floor(Math.random() * 7);
    let position;
    switch (numberGen) {
      case 0 :
        position = {x:-3 ,y:5 ,z:0};
        break;
      case 1 :
        position = {x:-2 ,y:5 ,z:0};
        break;
      case 2 :
        position = {x:-1 ,y:5 ,z:0};
        break;
      case 3 :
        position = {x:0 ,y:5 ,z:0};
        break;
      case 4 :
        position = {x:1 ,y:5 ,z:0};
        break;
      case 5 :
        position = {x:2 ,y:5 ,z:0};
        break;
      case 6 :
        position = {x:3 ,y:5 ,z:0};
        break;
    }

    return position;
  }

  setSizeForBlock() {
    let numberGen = Math.floor(Math.random() * 3);
    let size;
    switch (numberGen) {
      case 0 :
        size = 0.5;
        break;
      case 1 :
        size = 0.75;
        break;
      case 2 :
        size = 1;
        break;
    }

    return size;
  }

  fontMaker() {
    // Regular
    this.loader.load(fontPathTwo, (font) => {
      let geometry = new THREE.TextGeometry( 'online expierences', {
        font: font,
        size: 0.5,
        height: 0.04,

      } );

     this.fontbodyReg = this.world.add({
        type:'box', // type of shape : sphere, box, cylinder
        size:[5.5,0.45,0.1], // size of shape
        pos:[0,0,0], // start position in degree
        rot:[0,0,0], // start rotation in degree
        move:false, // dynamic or statique
        density: 1,
        friction: 0.2,
        noSleep:true,
        restitution: 4,
        belongsTo: 1, // The bits of the collision groups to which the shape belongs.
        collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        });

      geometry.computeBoundingBox();

      this.fontBold = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:0x000000}));
      this.fontBold.position.set(-2.65,-0.2,0);
      this.scene.add(this.fontBold);
    });


    // Light
    this.loader.load(fontPathOne, (font) => {
      let geometry = new THREE.TextGeometry( 'tailor-made', {
        font: font,
        size: 0.5,
        height: 0.04,
      });

      this.fontbodyLight =  this.world.add({
        type:'box', // type of shape : sphere, box, cylinder
        size:[3,0.9,0.3], // size of shape
        pos:[0,0.65,0], // start position in degree
        rot:[0,0,0], // start rotation in degree
        move:false, // dynamic or statique
        density: 1,
        friction: 0.2,
        noSleep:true,
        restitution: 4,
        belongsTo: 1, // The bits of the collision groups to which the shape belongs.
        collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        });

      this.fontLight = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:0x14161D}));
      this.fontLight.position.set(-1.5,0.65,0);
      this.scene.add(this.fontLight);
    });

  }

  mouseClick() {
    let that = this;
    window.addEventListener('click', () => {
      let size = that.setSizeForBlock();
      let color = that.setColorForBlock();
      that.createBody(size,color);
    },false);
  }

  onLoad() {
    let that = this ;
    window.addEventListener('load', (e) => {
      const items = 20;
      let i = 0;
      const loop = () => {
        setTimeout(() => {
          i++;
          let size = that.setSizeForBlock();
          let position = that.setPositionForBlock();;
          let color = that.setColorForBlock();
          that.createBody(size,color,position);
          if (i < items ){
            loop();
          }
        }, 250);
      };
     loop();
    });
  }

  mouseMove() {
    let that = this;
    this.testPlane = new THREE.Mesh(new THREE.PlaneGeometry(10,10), new THREE.MeshBasicMaterial());
    // Desktop
    window.addEventListener('mousemove',(event) => {
      that.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      that.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

      that.raycaster.setFromCamera(that.mouse, that.camera);

      let intersects = that.raycaster.intersectObjects([that.testPlane]);

      if (intersects.length > 0) {
        that.point = intersects[0].point;
        console.log(that.point);
      }

    }, false);

    // For mobile
    window.addEventListener('touchmove',(e) => {

      let x = e.touches[0].clientX;
      let y = e.touches[0].clientY;

      that.mouse.x = (x / window.innerWidth) * 2 - 1;
      that.mouse.y = - (y / window.innerHeight) * 2 + 1;

      that.raycaster.setFromCamera(that.mouse, that.camera);

      let intersects = that.raycaster.intersectObjects([that.testPlane]);

      if (intersects.length > 0) {
        that.point = intersects[0].point;
      }

    }, false);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this))
  }

  settings(){
    let that = this;
    this.settings = {
      time: 0,
      createBody: () => {
        that.createBody();
      }
    };

    this.gui = new dat.GUI();
    this.gui.add(this.settings, "time", 0,100,0.01);
    this.gui.add(this.settings, "createBody");

  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    if(this.fontLight === undefined ) {
      setTimeout(() => {
        this.resizeElements(this.width);
      },220);
    }
    else {
      this.resizeElements(this.width);
    }

  }


  resizeElements(width) {
    if (width >= 320 && width <= 420 ) {
      this.fontLight.scale.set(0.5,0.5,0.5);
      this.fontLight.position.set(-0.75,0.35,0);
      this.fontBold.scale.set(0.5,0.5,0.5);
      this.fontBold.position.set(-1.35,0,0);
    }

    if (width >= 420 && width <= 520 ) {
      this.fontLight.scale.set(0.7,0.7,0.7);
      this.fontLight.position.set(-1,0.45,0);
      this.fontBold.scale.set(0.7,0.7,0.7);
      this.fontBold.position.set(-1.8,0,0);
    }

    if (width >= 520 && width <= 768) {
      this.fontLight.scale.set(0.9,0.9,0.9);
      this.fontLight.position.set(-1.35,0.75,0);
      this.fontBold.scale.set(0.9,0.9,0.9);
      this.fontBold.position.set(-2.4,0,0);
    }

    if (width >= 768) {
      this.fontLight.scale.set(1,1,1);
      this.fontLight.position.set(-1.5,0.65,0);
      this.fontBold.scale.set(1,1,1);
      this.fontBold.position.set(-2.65,-0.2,0);
    }

  }

  addMesh() {
    this.geometry = new THREE.PlaneBufferGeometry(1,1);
    this.geometry = new THREE.OctahedronBufferGeometry(1)
    this.material1 = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
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
    });
    this.Object = new THREE.Mesh( this.geometry, this.material1 );
  }

  physics() {
    this.bodies = [];

    this.world = new OIMO.World({
      timestep: 1/60,
      iterations: 8,
      broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
      worldscale: 1, // scale full world
      random: true,  // randomize sample
      info: false,   // calculate statistic or not
      gravity: [0,-8.7,0]
    });

    this.body = this.world.add({
      type:'box', // type of shape : sphere, box, cylinder
      size:[1,1,1], // size of shape
      pos:[0,0,0], // start position in degree
      rot:[0,0,90], // start rotation in degree
      move:true, // dynamic or statique
      density: 1,
      noSleep: true,
      friction: 0.2,
      restitution: 1,
      belongsTo: 1, // The bits of the collision groups to which the shape belongs.
      collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
      });

      //Floors
    this.groundBottom = this.world.add({restitution: 1,size:[40,1,40], pos: [0,-4.5,0]});
    this.groundTop = this.world.add({restitution: 1, size:[40,1,40], pos: [0,8.5,0]});

    this.groundLeft = this.world.add({restitution: 1, size:[1,40,40], pos: [-7,0,0]  });
    this.groundRight = this.world.add({restitution: 1, size:[1,40,40], pos: [7,0,0]});

    this.front = this.world.add({size:[40,40,1], pos: [0,0,1.5]});
    this.back = this.world.add({size:[40,40,1], pos: [0,0,-1.5]});
  }

   createBody(size,color,position) {
    let month = this.date.getMonth();
    let o = {};
    let body = this.world.add({
      type:'cylinder', // type of shape : sphere, box, cylinder
      size:[size,size,size], // size of shape
      pos:[position.x, position.y, position.z], // start position in degree
      rot:[0,0,90], // start rotation in degree
      move:true, // dynamic or statique
      density: 1,
      friction: 0.2,
      noSleep:true,
      restitution: 0.2,
      belongsTo: 1, // The bits of the collision groups to which the shape belongs.
      collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
      });

      this.model = this.setModelForHoliday();
      let mesh;

        setTimeout(() => {


          if (month === 2 || month === 11 ) {
          mesh = this.model.test;
          mesh.scale.set(size/1.5,size/1.5,size/1.5);
        } else {
          mesh = new THREE.Mesh(
            this.dateCheckerForModels(size),
            new THREE.MeshLambertMaterial({color:color})
          );
        }

        mesh.position.set(position.x, position.y, position.z);
        console.log(mesh.position.x)


        o.body = body;
        o.mesh = mesh;

        this.scene.add(mesh);
        this.bodies.push(o)

        }, 10)
  }

  render() {
    this.time++;
    this.world.step();
    this.body.awake();
    this.body.setPosition(this.point);
    this.Object.position.copy( this.body.getPosition());
    this.Object.quaternion.copy( this.body.getQuaternion());

    this.bodies.forEach(b => {
      b.body.awake();
      b.mesh.position.copy( b.body.getPosition());
      b.mesh.quaternion.copy( b.body.getQuaternion());
    });

    this.renderer.render( this.scene, this.camera );
    window.requestAnimationFrame(this.render.bind(this));
  }
}

let date = new Date();
new Sketch(date);
