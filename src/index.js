import * as THREE from 'three';
import { fragmentShader } from './shaders/fragment.js';
import { vertexShader } from './shaders/vertex.js';
import * as dat from 'dat.gui';
import './style.css';

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
    this.light = new THREE.AmbientLight( 0xe8e8e8 );

    this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 0.001, 300 );
    this.camera.position.set(0, 0, 6);
    this.scene = new THREE.Scene();
    this.raycaster =  new THREE.Raycaster();
    this.loader = new THREE.FontLoader();

    this.scene.add(this.light);


    this.setupResize();
    this.fontMaker();
    this.physics();
    this.addMesh();
    this.time = 0;
    this.mouseMove();
    this.resize();
    this.mouseClick();
    this.render();
    //this.settings();

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


  setSizeForBlock() {
    let numberGen = Math.floor(Math.random() * 3);
    let size;
    switch (numberGen) {
      case 0 :
        size = 0.5;
        break;
      case 1 :
        size = 1;
        break;
      case 2 :
        size = 1.5;
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

     this.world.add({
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
      this.fontBold.position.set(-2.6,-0.2,0);
      this.scene.add(this.fontBold);


    });
    // Light
    this.loader.load(fontPathOne, (font) => {
      let geometry = new THREE.TextGeometry( 'tailor-made', {
        font: font,
        size: 0.5,
        height: 0.04,
      });

      this.world.add({
        type:'box', // type of shape : sphere, box, cylinder
        size:[3,0.9,0.3], // size of shape
        pos:[0,0.5,0], // start position in degree
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
      this.fontLight.position.set(-1.5,0.5,0);
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

  mouseMove() {
    let that = this;
    this.testPlane = new THREE.Mesh(new THREE.PlaneGeometry(10,10), new THREE.MeshBasicMaterial());
    window.addEventListener('mousemove',(event) => {
      that.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      that.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

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

    //let pos = this.geometry.attributes.position;
    //let count = pos.length / 3;

    //let bary = [];

    //for (let i = 0; i < count; i++) {
    //  bary.push(0,0,1, 0,1,0, 1,0,0);
    //}

    //bary =  new Float32Array(bary);
    //this.geometry.setAttribute('barycentric', new THREE.BufferAttribute(bary,3));
    this.Object = new THREE.Mesh( this.geometry, this.material1 );
    //this.scene.add( this.Object );
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
      gravity: [0,0,0]
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


    this.groundBottom = this.world.add({restitution: 1,size:[40,1,40], pos: [0,-4.5,0]});
    this.groundTop = this.world.add({restitution: 1, size:[40,1,40], pos: [0,4.5,0]});

    this.groundLeft = this.world.add({restitution: 1, size:[1,40,40], pos: [-7,0,0]  });
    this.groundRight = this.world.add({restitution: 1, size:[1,40,40], pos: [7,0,0]});


    this.front = this.world.add({size:[40,40,1], pos: [0,0,1.5]});
    this.back = this.world.add({size:[40,40,1], pos: [0,0,-1.5]});

    //this.back = this.world.add({size:[5,1.4,1], pos: [0,0.5,0]});
  }


  createBody(size,color) {
    let o = {};
    let body = this.world.add({
      type:'box', // type of shape : sphere, box, cylinder
      size:[size,size,size], // size of shape
      pos:[this.point.x, this.point.y, this.point.z], // start position in degree
      rot:[0,0,90], // start rotation in degree
      move:true, // dynamic or statique
      density: 1,
      friction: 0.2,
      noSleep:true,
      restitution: 0.2,
      belongsTo: 1, // The bits of the collision groups to which the shape belongs.
      collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
      });

      let mesh = new THREE.Mesh(
        this.dateCheckerForModels(size),
        new THREE.MeshLambertMaterial({color:color,})
      );

      mesh.position.set(this.point.x, this.point.y, this.point.z)


      o.body = body;
      o.mesh = mesh;

      this.scene.add(mesh);
      this.bodies.push(o)
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

