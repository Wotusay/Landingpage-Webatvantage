import * as THREE from 'three';
import { fragmentShader } from './shaders/fragment.js';
import { vertexShader } from './shaders/vertex.js';
import * as dat from 'dat.gui';
import './style.css';

import * as OIMO from 'oimo';

export default class Sketch {
  constructor(date) {
    this.renderer = new THREE.WebGLRenderer( { alpha: true , powerPreference: "high-performance", antialias:true } );
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.container = document.getElementById('container');
    this.container.appendChild( this.renderer.domElement );
    this.width =  this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.mouse = new THREE.Vector2();
    this.point = new THREE.Vector3(0,0,0)


    this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 0.001, 1000 );
    this.camera.position.set(0, 0, 6);
    this.scene = new THREE.Scene();
    this.raycaster =  new THREE.Raycaster();
    this.loader = new THREE.FontLoader();

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

  fontMaker() {
    this.loader.load('../src/assets/fonts/HalyardDisplay-Regular.json', (font) => {
      let geometry = new THREE.TextGeometry( 'online expierences', {
        font: font,
        size: 0.5,
        height: 0.1,

      } );

      geometry.computeBoundingBox();

      this.fontBold = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:0x000000}));
      this.fontBold.position.set(-2.5,0,0)

      this.scene.add(this.fontBold);

    });
    this.loader.load('../src/assets/fonts/HalyardDisplay-ExtraLight.json', (font) => {
      let geometry = new THREE.TextGeometry( 'tailor-made', {
        font: font,
        size: 0.5,
        height: 0.1,
      });

      geometry.computeBoundingBox();

      this.fontLight = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:0x000000}));
      this.fontLight.position.set(-1.5,0.5,0)

      this.scene.add(this.fontLight);
    });

  }

  mouseClick() {
    let that = this;
    window.addEventListener('click', (event) => {
      that.createBody();
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
        console.log(that.point);
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
    this.geometry = new THREE.BoxBufferGeometry(1,1,1,1)
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
    })
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
      restitution: 0.9,
      belongsTo: 1, // The bits of the collision groups to which the shape belongs.
      collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
      });


    this.groundBottom = this.world.add({size:[40,1,40], pos: [0,-4.5,0]});
    this.groundTop = this.world.add({size:[40,1,40], pos: [0,4.5,0]});

    this.groundLeft = this.world.add({size:[1,40,40], pos: [-6,0,0]});
    this.groundLeft = this.world.add({size:[1,40,40], pos: [6,0,0]});


    this.front = this.world.add({size:[40,40,1], pos: [0,0,1.5]});
    this.back = this.world.add({size:[40,40,1], pos: [0,0,-1.5]});

    //this.back = this.world.add({size:[5,1.4,1], pos: [0,0.5,0]});
  }


  createBody() {
    let o = {};
    let body = this.world.add({
      type:'box', // type of shape : sphere, box, cylinder
      size:[1,1,1], // size of shape
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
        new THREE.BoxBufferGeometry(1),
        new THREE.MeshBasicMaterial({color:0xff0000})
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

    })
    this.renderer.render( this.scene, this.camera );
    window.requestAnimationFrame(this.render.bind(this));
  }
}

let date =  Date();

console.log(date);

new Sketch();

