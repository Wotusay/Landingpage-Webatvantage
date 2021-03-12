import * as THREE from 'three';
import './style.css';
import GLTFLoader from 'three-gltf-loader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
// Load in modelx
import Model from './js/Models/model';
// Models
import Chikken from './assets/chikken.gltf';
import BlueEgg from './assets/blueegg.gltf';
import Bunny from './assets/bunny.gltf';
import Egg from './assets/egg.gltf';
import RedEgg from './assets/redegg.gltf';
import GreenEgg from './assets/greenegg.gltf';
// Fonts
import fontPathOne from './assets/fonts/HalyardDisplay-ExtraLight.json';
import fontPathTwo from './assets/fonts/HalyardDisplay-Regular.json';
// Physics
import * as CANNON from 'cannon-es'
//import * as OIMO from 'oimo';

export default class Sketch {
  constructor(date) {
    this.date = date;
    this.isDragging = false;

    this.renderer = new THREE.WebGLRenderer( { alpha: true , powerPreference: "high-performance", antialias:true } );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.container = document.getElementById('container');
    this.container.appendChild( this.renderer.domElement );
    this.width =  this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.mouse = new THREE.Vector2();
    this.point = new THREE.Vector3(0,0,0)
    this.hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820,0.6);
    this.spotLight = new THREE.SpotLight(0xffa95c,1.3);
    this.spotLightTwo = new THREE.SpotLight(0xffa95c,0.8);
    this.spotLight.position.set(10,0,10);
    this.spotLightTwo.position.set(-10,0,10)
    this.hemiLight.position.set(5,0,5);
    this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 0.001, 300 );
    this.camera.position.set(0, 0, 6);
    this.scene = new THREE.Scene();
    this.raycaster =  new THREE.Raycaster();
    this.loader = new THREE.FontLoader();
    this.fontLight;
    this.hdrCubeMap;
    this.jointBody;
    this.world;
    this.dt = 1 /60;
    this.cubeBody = [];
    this.meshes = [];
    this.jointConstraint;


    // Dit de loader die wordt gebruikt om alle glttf inteladen en deze te compressen
    // De links is de decoder zelf om deze dan te gebruiken ook in production
    this.sceneloader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderConfig({type: 'js'})
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.sceneloader.setDRACOLoader(this.dracoLoader)

    this.scene.add(this.hemiLight);
    this.scene.add(this.spotLight);
    this.scene.add(this.spotLightTwo);

    this.setupResize();
    this.fontMaker();
    this.cannonJsPhysics();
    this.onDrag();
    //this.physics();
    //this.addMesh();
    this.time = 0;
    //this.mouseMove();
    this.onLoad();
    this.render();
    this.resize();
  }

  clickMaker() {
    const markerGeometry = new THREE.SphereBufferGeometry(0.2, 8, 8)
    const markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
    this.clickMarker = new THREE.Mesh(markerGeometry, markerMaterial)
    this.clickMarker.visible = false // Hide it..
    this.scene.add(this.clickMarker)


    this.movementPlane = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshBasicMaterial());
  }
  // Deze functies dienen voor de model of cube te laten randomizen
  getHitPoint(clientX, clientY, mesh, camera) {
    let that = this;
    that.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    that.mouse.y = - (clientY / window.innerHeight) * 2 + 1;
    that.raycaster.setFromCamera(that.mouse, camera);
    const hits = that.raycaster.intersectObject(mesh);
    return hits.length > 0 ? hits[0].point : undefined;

  }

  showClickMarker() {
    this.clickMarker.visible = true;
  }

  moveClickMarker(position) {
    this.clickMarker.position.copy(position);
  }

  moveMovementPlane(point, camera) {
    this.movementPlane.position.copy(point);
    this.movementPlane.quaternion.copy(camera.quaternion);
  }

  addJointConstraint(position, constrainedBody) {
    const vector = new CANNON.Vec3().copy(position).vsub(constrainedBody.position)

    const antiRotation = constrainedBody.quaternion.inverse()
    const pivot = antiRotation.vmult(vector)

    this.jointBody.position.copy(position)

    this.jointConstraint = new CANNON.PointToPointConstraint(constrainedBody, pivot, this.jointBody, new CANNON.Vec3(0, 0, 0))

    this.world.addConstraint(this.jointConstraint)
  }

  moveJoint(position) {
    this.jointBody.position.copy(position)
    this.jointConstraint.update()
  }

  removeJointConstraint() {
    this.world.removeConstraint(this.jointConstraint)
    this.jointConstraint = undefined
  }

  isDraggingSetter() {
    this.isDragging = true
  }

  hideClickMarker() {
    this.clickMarker.visible = false
  }

  onDrag() {
    this.clickMaker();
    window.addEventListener('pointerdown', (e) => {
      const hitPoint = this.getHitPoint(e.clientX, e.clientY, this.cubeMesh, this.camera);
      if (!hitPoint) {
        return;
      }

      this.showClickMarker()
      this.moveClickMarker(hitPoint);

      this.moveMovementPlane(hitPoint, this.camera)
      this.addJointConstraint(hitPoint, this.cubeBody)

      requestAnimationFrame(() => this.isDraggingSetter());
    });


    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) {
        return
      }
      console.log(this.isDragging)


      // Project the mouse onto the movement plane
      const hitPoint = this.getHitPoint(e.clientX, e.clientY, this.movementPlane, this.camera)

      if (hitPoint) {
        this.moveClickMarker(hitPoint)
        this.moveJoint(hitPoint)
      }
    })


    window.addEventListener('pointerup', () => {
      this.isDragging = false

      // Hide the marker mesh
      this.hideClickMarker()

      // Remove the mouse constraint from the world
      this.removeJointConstraint()
    })



  }


  addCube() {
    const cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1, 10, 10);
    const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
    this.cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.cubeMesh.castShadow = true;
    this.meshes.push(this.cubeMesh);
    this.scene.add(this.cubeMesh);
  }

  floorMaker(sizes) {
    const floorShape = new CANNON.Box(sizes);
    const floorBody = new CANNON.Body({ mass: 0 });
    return floorBody.addShape(floorShape);
  }


  cannonJsPhysics(){
    this.bodies = [];

    this.addCube();
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.7, 0);

    this.groundBottom = this.floorMaker(new CANNON.Vec3(40,1,40));
    this.groundTop = this.floorMaker(new CANNON.Vec3(40,1,40));

    this.groundLeft = this.floorMaker(new CANNON.Vec3(1,40,40));
    this.groundRight = this.floorMaker(new CANNON.Vec3(1,40,40));

    this.front = this.floorMaker(new CANNON.Vec3(40,40,1));
    this.back = this.floorMaker(new CANNON.Vec3(40,40,1));

    this.groundBottom.position.set(0,-4.5,0);
    this.groundTop.position.set(0,9.5,0);
    this.groundLeft.position.set(-7,0,0);
    this.groundRight.position.set(7,0,0);
    this.front.position.set(0,0,2.5);
    this.back.position.set(0,0,-2.5);


    let allFloors = [this.groundBottom, this.groundTop,this.groundLeft, this.groundRight, this.front,this.back];

    allFloors.forEach(floor => {
      this.world.addBody(floor);
    })

    const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
    this.cubeBody = new CANNON.Body({ mass: 5 })
    this.cubeBody.addShape(cubeShape);
    this.cubeBody.position.set(0, 5, 0);
    this.bodies.push(this.cubeBody);
    this.world.addBody(this.cubeBody);


    const jointShape = new CANNON.Sphere(0.1)
    this.jointBody = new CANNON.Body({ mass: 0 })
    this.jointBody.addShape(jointShape)
    this.jointBody.collisionFilterGroup = 0
    this.jointBody.collisionFilterMask = 0
    this.world.addBody(this.jointBody)
  }




  setModelForHoliday() {
    // Hier komen dan alle models in te recht
    // Als je meer dan 5 wilt moet je altijd het getaltje +1 maken.
    // In dit geval is dit nu 6  dus wil ik 5 models
    const number = 6;
    let numberGen = Math.floor(Math.random() * number);

    let o = {}
    switch (numberGen) {
      case 0 :
        o.model = Chikken;
        o.collisionBox = 'cylinder';
        o.collidesWidth = {x: 0.014, y:0 ,z:0.28};
        break;
      case 1 :
        o.model = Bunny ;
        o.collisionBox = 'cylinder';
        o.collidesWidth = {x:0.103, y:0.56 ,z:0};
        break;
      case 2 :
        o.model = Egg;
        o.collisionBox = 'sphere';
        o.collidesWidth = {x:0, y:0 ,z:0.354};
        break;
      case 3 :
        o.model = RedEgg;
        o.collisionBox = 'sphere';
        o.collidesWidth = {x:0, y:0 ,z:0.354};
        break;
      case 4 :
        o.model = BlueEgg;
        o.collisionBox = 'sphere';
        o.collidesWidth = {x:0, y:0 ,z:0.354};
        break;
      case 5 :
        o.model = GreenEgg;
        o.collisionBox = 'sphere';
        o.collidesWidth = {x:0, y:0 ,z:0.354};
        break;
    }

    return o;
  }

  setColorForBlock() {
    // Dit is er voor als er geen models zijn of geen feest is in deze maand
    const number = 3
    let numberGen = Math.floor(Math.random() * number);
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
        // Hier komen dan alle posities van de objecten terechtn
    const number = 7;
    let numberGen = Math.floor(Math.random() * number);
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
    // Hier komen dan alle sizes voor de elementen
    const number = 3;
    const sizes = { s:0.15, m:0.25, b:0.5}
    let numberGen = Math.floor(Math.random() * number);
    let size;
    switch (numberGen) {
      case 0 :
        size = sizes.s;
        break;
      case 1 :
        size = sizes.m;
        break;
      case 2 :
        size = sizes.b;
        break;
    }

    return size;
  }

  fontMaker() {
    // Hier worden de fonts ingeladen
    // Alle fonts werken niett met pixels maar met meter
    // Dus pas op als je iets aan past
    // Regular
    this.loader.load(fontPathTwo, (font) => {
      let geometry = new THREE.TextGeometry( 'online experiences', {
        font: font,
        size: 0.5,
        height: 0.01,

      } );

     /* this.fontbodyReg = this.world.add({
        type:'box', // type of shape : sphere, box, cylinder
        size:[5.5,0.6,3], // size of shape
        pos:[0,0,0], // start position in degree
        rot:[0,0,0], // start rotation in degree
        move:false, // dynamic or statique
        density: 1,
        friction: 0.2,
        noSleep:true,
        restitution: 0.2,
        belongsTo: 1, // The bits of the collision groups to which the shape belongs.
        collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        }); */

      geometry.computeBoundingBox();

      this.fontBold = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:0x000000}));
      this.fontBold.position.set(-2.7,-0.2,0);
      this.scene.add(this.fontBold);
    });


    // Light
    this.loader.load(fontPathOne, (font) => {
      let geometry = new THREE.TextGeometry( 'tailor-made', {
        font: font,
        size: 0.5,
        height: 0.01,
      });

     /* this.fontbodyLight =  this.world.add({
        type:'box', // type of shape : sphere, box, cylinder
        size:[3,1,3], // size of shape
        pos:[0,0.65,0], // start position in degree
        rot:[0,0,0], // start rotation in degree
        move:false, // dynamic or statique
        density: 1,
        friction: 0.2,
        noSleep:true,
        restitution: 0.2,
        belongsTo: 1, // The bits of the collision groups to which the shape belongs.
        collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
        });
        */

      this.fontLight = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:0x000000}));
      this.fontLight.position.set(-1.55,0.65,0);
      this.scene.add(this.fontLight);
    });

  }

  onLoad() {
    // Hier worden dan alle 3d elmenen op geroept.
    // Hier worden ze ingespawnt
    let that = this ;
    window.addEventListener('load', (e) => {
      const items = 100;
      let i = 0;
      const loop = () => {
        setTimeout(() => {
          i++;
          let size = that.setSizeForBlock();
          let position = that.setPositionForBlock();;
          let color = that.setColorForBlock();
          //that.createBody(size,color,position);
          if (i < items ){
            loop();
          }
        }, 100);
      };
     loop();
    });
  }

  mouseMove() {
    // Hier wordt er gechecked voor een eem mouse  / touch bewegging
    // Dit werkt met een 3D plane
    // Alles die op die 3d plane valt zal een bewegiing krijgen

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

  resize() {
    // Hier kijken we voor het element te kunnen resizen
    // Alles wordt dan ook hier geresized
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
    // Resize chekker
    switch (true) {
      case(width >= 375 && width <= 767):
        this.fontLight.scale.set(0.65,0.65,0.65);
        this.fontLight.position.set(-1,0.65,0);
        this.fontBold.scale.set(0.65,0.65,0.65);
        this.fontBold.position.set(-1.75,0.15,0);
        break;
      case(width >= 768 && width <= 1023):
        this.fontLight.scale.set(0.83,0.83,0.83);
        this.fontLight.position.set(-1.2,0.675,0);
        this.fontBold.scale.set(0.83,0.83,0.83);
        this.fontBold.position.set(-2.2,0,0);
        break;
      case(width >= 1024):
        this.fontLight.scale.set(1,1,1);
        this.fontLight.position.set(-1.55,0.65,0);
        this.fontBold.scale.set(1,1,1);
        this.fontBold.position.set(-2.7,-0.2,0);
    }

  }

  addMesh() {
    // Dit is de mouse object
    // Hier mee kan je de elementen mee bewgenen
    // Dit volgt de volgt constant je muis maar is niet gerenderd
    this.geometry = new THREE.BoxBufferGeometry(1);
    this.geometry = new THREE.OctahedronBufferGeometry(1)
    this.material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
    this.Object = new THREE.Mesh( this.geometry, this.material );
  }

  physics() {
    // Hier worden alle physcics ingesteld
    // Alles komt dan ook hierr terecht bv de walls / de wereld en de gravity
    //this.bodies = [];

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
      size:[1,1,1.8], // size of shape
      pos:[0,0,0], // start position in degree
      rot:[0,0,90], // start rotation in degree
      move:true, // dynamic or statique
      density: 0.5,
      noSleep: true,
      friction: 0.2,
      restitution: 0.5,
      belongsTo: 1, // The bits of the collision groups to which the shape belongs.
      collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
      });

      //Floors
    this.groundBottom = this.world.add({restitution: 0.2,size:[40,1,40], pos: [0,-4.5,0]});
    this.groundTop = this.world.add({restitution: 0.2, size:[40,1,40], pos: [0,8.5,0]});

    this.groundLeft = this.world.add({restitution: 0.2, size:[1,40,40], pos: [-7,0,0]  });
    this.groundRight = this.world.add({restitution: 0.2, size:[1,40,40], pos: [7,0,0]});

    this.front = this.world.add({size:[40,40,1], pos: [0,0,1.5]});
    this.back = this.world.add({size:[40,40,1], pos: [0,0,-1.5]});
  }

   createBody(size,color,position) {

     // Hier maken we een oobject aan die ingespawnt wordt waneer de pagina in laad
    let month = this.date.getMonth();
    let o = {};
    const itemPicker = this.setModelForHoliday();
    this.model = new Model(itemPicker.model, this.sceneloader);
    let mesh;

    console.log(itemPicker.collidesWidth.x)
    if (month === 2 || month === 11) {
      // Dit deel is voor de costum models
      setTimeout(() => {
        let body = this.world.add({
          type: itemPicker.collisionBox, // type of shape : sphere, box, cylinder
          size:[size / 1.2,
            size / 1.2,
            size / 1.2], // size of shape
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

        mesh = this.model.object;
        if (this.model.object.scale !== undefined) {
          mesh.scale.set(size/1.5,size/1.5,size/1.5);
          mesh.position.set(position.x, position.y, position.z);

          o.body = body;
          o.mesh = mesh;

          this.scene.add(mesh);
          this.bodies.push(o)
        }
        else {
          return;
        }

      }, 600)
    } else {
      // dit is de default value
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

      mesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(size,size,size),
        new THREE.MeshLambertMaterial({color:color})
      );

      mesh.position.set(position.x, position.y, position.z);

      o.body = body;
      o.mesh = mesh;

      this.scene.add(mesh);
      this.bodies.push(o);
    }
  }



  render() {
    // Hier wordt dan alles gerenderd en opniew gespeeld
    this.time++;
    this.world.step(this.dt);

    for (let i = 0; i !== this.meshes.length; i++) {
      this.meshes[i].position.copy(this.bodies[i].position)
      this.meshes[i].quaternion.copy(this.bodies[i].quaternion)
    }
   // this.body.awake();
   // this.body.setPosition(this.point);
   // this.Object.position.copy( this.body.getPosition());
   // this.Object.quaternion.copy( this.body.getQuaternion());

   /* this.bodies.forEach(b => {
      b.body.awake();
      b.mesh.position.copy( b.body.getPosition());
      b.mesh.quaternion.copy( b.body.getQuaternion());
    });
    */

    this.renderer.render( this.scene, this.camera );

    window.requestAnimationFrame(() => this.render());
  }
}

let date = new Date();
new Sketch(date);
