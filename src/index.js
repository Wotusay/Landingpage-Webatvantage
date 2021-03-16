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
import cannonDebugger from 'cannon-es-debugger'


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
    this.time = 0;
    this.onLoad();
    this.resize();
    this.render();
  }

  clickMaker() {
    // The pivot point of the geometery
    // The item where the object hangs on
    const markerGeometry = new THREE.SphereBufferGeometry(0.2, 8, 8)
    const markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
    this.clickMarker = new THREE.Mesh(markerGeometry, markerMaterial)
    this.clickMarker.visible = false // Hide it..
    this.movementPlane = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshBasicMaterial());
  }
  // Deze functies dienen voor de model of cube te laten randomizen
  getHitPoint(clientX, clientY, mesh, camera) {
    // Here we get the hitpoint of the object
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
    // To move the pivot object
    this.clickMarker.position.copy(position);
  }

  moveMovementPlane(point, camera) {
    // To move the plane
    this.movementPlane.position.copy(point);
    this.movementPlane.quaternion.copy(camera.quaternion);
  }

  addJointConstraint(position, constrainedBody) {
    // To add the pivot point on the clicked object
    // And here we add the constraint between the object and point
    const vector = new CANNON.Vec3().copy(position).vsub(constrainedBody.position);

    const antiRotation = constrainedBody.quaternion.inverse()
    const pivot = antiRotation.vmult(vector)

    this.jointBody.position.copy(position)

    this.jointConstraint = new CANNON.PointToPointConstraint(constrainedBody, pivot, this.jointBody, new CANNON.Vec3(0, 0, 0))

    this.world.addConstraint(this.jointConstraint)
  }

  moveJoint(position) {
    // Here we move the point
    this.jointBody.position.copy(position);
    if (this.jointConstraint !== undefined) {
      this.jointConstraint.update()
    }
  }

  removeJointConstraint() {
    // Here we remove all the points so they can freely fall
    this.world.removeConstraint(this.jointConstraint)
    this.jointConstraint = undefined;


    this.world.constraints.forEach( c => {
      this.world.removeConstraint(c);
    });
  }

  isDraggingSetter() {
    // To set the dragging state
    this.isDragging = true
  }

  hideClickMarker() {
    this.clickMarker.visible = false
  }

  onDrag() {
    this.clickMaker();

    //Mobile

    window.addEventListener('touchstart', (e) => {
      this.bodies.forEach(b => {
        b.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh){
            const hitPoint = this.getHitPoint(e.touches[0].clientX, e.touches[0].clientY, child, this.camera);
            if (!hitPoint) {
              return;
            }
            this.showClickMarker()
            this.moveClickMarker(hitPoint);

            this.moveMovementPlane(hitPoint, this.camera)
            this.addJointConstraint(hitPoint, b.body)
          }
        })
      })

      requestAnimationFrame(() => this.isDraggingSetter());
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging) {
        return
      }
      // Project the mouse onto the movement plane
      const hitPoint = this.getHitPoint(e.touches[0].clientX, e.touches[0].clientY, this.movementPlane, this.camera)

      if (hitPoint) {
        this.moveClickMarker(hitPoint)
        this.moveJoint(hitPoint)
      }
    });

    window.addEventListener('touchend', (e) => {
      this.isDragging = false
      // Hide the marker mesh
      this.hideClickMarker()
      // Remove the mouse constraint from the world
      this.removeJointConstraint();

      this.world.constraints.forEach( c => {
        this.world.removeConstraint(c);
      });
    });

    // Desktop

    window.addEventListener('pointerdown', (e) => {
      this.bodies.forEach(b => {
        b.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh){
            const hitPoint = this.getHitPoint(e.clientX, e.clientY, child, this.camera);
            if (!hitPoint) {
              return;
            }
            this.showClickMarker()
            this.moveClickMarker(hitPoint);

            this.moveMovementPlane(hitPoint, this.camera)
            this.addJointConstraint(hitPoint, b.body)
          }
        })
      });

      requestAnimationFrame(() => this.isDraggingSetter());
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) {
        return
      }
      // Project the mouse onto the movement plane
      const hitPoint = this.getHitPoint(e.clientX, e.clientY, this.movementPlane, this.camera)

      if (hitPoint) {
        this.moveClickMarker(hitPoint)
        this.moveJoint(hitPoint)
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false
      // Hide the marker mesh
      this.hideClickMarker()
      // Remove the mouse constraint from the world
      this.removeJointConstraint();

      this.world.constraints.forEach( c => {
        this.world.removeConstraint(c);
      });
    })
  }

  floorMaker(sizes) {
    const floorShape = new CANNON.Box(sizes);
    const floorBody = new CANNON.Body({ mass: 0});
    return floorBody.addShape(floorShape);
  }

  collisionDecider(object,size) {
    // Here we make and decide the body of the object
    // The bodies are compound bodies
    let body;

    const eggBodyBig = new CANNON.Body({mass:1, material: this.groundMaterial});
    const eggBodyMed = new CANNON.Body({mass:1, material: this.groundMaterial});

    const bunnyBodyMed = new CANNON.Body({mass:1, material: this.groundMaterial});
    const bunnyBodyBig = new CANNON.Body({mass:1, material: this.groundMaterial});

    const chickenBodyBig = new CANNON.Body({mass:1, material: this.groundMaterial});
    const chickenBodyMed = new CANNON.Body({mass:1, material: this.groundMaterial});

    // Chicken
    // Big
    chickenBodyBig.addShape(new CANNON.Box(new CANNON.Vec3(0.25, 0.32, 0.25)), new CANNON.Vec3(-0.02, 0, 0)); // body
    chickenBodyBig.addShape(new CANNON.Sphere(.05), new CANNON.Vec3(-0.13, 0.2, 0)); //head
    chickenBodyBig.addShape(new CANNON.Sphere(.09), new CANNON.Vec3(0.36, 0.25, 0)); //tail
    // Med
    chickenBodyMed.addShape(new CANNON.Box(new CANNON.Vec3(0.1, 0.2, 0.14)), new CANNON.Vec3(-0.02, 0, 0)); // body
    chickenBodyMed.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(-0.05, 0.25, 0));  //head
    chickenBodyMed.addShape(new CANNON.Sphere(.09), new CANNON.Vec3(0.16, 0.12, 0)); //tail
    // Bunny
    // Big
    bunnyBodyBig.addShape(new CANNON.Box(new CANNON.Vec3(0.2, 0.35, 0.15)), new CANNON.Vec3(-0.02, 0.06, 0)); // body
    bunnyBodyBig.addShape(new CANNON.Sphere(.04), new CANNON.Vec3(0, 0.50, 0)); // ears
    bunnyBodyBig.addShape(new CANNON.Sphere(.04), new CANNON.Vec3(-0.35, -0.12, 0)); //tail
    // Med
    bunnyBodyMed.addShape(new CANNON.Box(new CANNON.Vec3(0.08, 0.12, 0.10)), new CANNON.Vec3(-0.02, 0, 0)); // Body
    bunnyBodyMed.addShape(new CANNON.Sphere(.04), new CANNON.Vec3(0.04, 0.21, 0)); // ears
    bunnyBodyMed.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(-0.13, 0, 0)); // tail

    // Egg
    // Big
    eggBodyBig.addShape(new CANNON.Sphere(.35), new CANNON.Vec3(0, 0, 0));      //body big
    eggBodyBig.addShape(new CANNON.Sphere(.27), new CANNON.Vec3(0, 0.2, 0));      //body top small
    eggBodyBig.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(0.02, 0.45, 0));   //top end
    eggBodyBig.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(-0.30, 0, 0));  //left side
    eggBodyBig.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(0.30, 0, 0));   // right side
    eggBodyBig.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(0.05, -0.2, 0));  //botttom end
    //Med
    eggBodyMed.addShape(new CANNON.Sphere(.18), new CANNON.Vec3(0, 0, 0)); //body big
    eggBodyMed.addShape(new CANNON.Sphere(0.09), new CANNON.Vec3(0, 0.17, 0));  // Body top small
    eggBodyMed.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(0.02, 0.255, 0));   // Top end
    eggBodyMed.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(-0.13, 0, 0));  // Left side
    eggBodyMed.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(0.13, 0, 0));   // Right side
    eggBodyMed.addShape(new CANNON.Sphere(.02), new CANNON.Vec3(0.05, -0.18, 0));  // bottom end
    //eggBodyBig.position.set(0, 1, 0);

    switch(true){
      case (object === 'egg' && size === 0.5):
        body = eggBodyBig;
        break;

        case (object === 'egg' && size === 0.25):
        body = eggBodyMed;
        break;

        case (object === 'bunny' && size === 0.5):
        body = bunnyBodyBig;
        break;

        case (object === 'bunny' && size === 0.25):
        body = bunnyBodyMed;
        break;

        case (object === 'chicken' && size === 0.5):
        body = chickenBodyBig;
        break;

        case (object === 'chicken' && size === 0.25):
        body = chickenBodyMed;
        break;

    }

    return body;

  }

   convexHullMaker(size,position) {
     // Here we make an decide the object
     // And we add the objects to world
    // Same with the meshes
    let o = {};
    let itemPicker =  this.setModelForHoliday();
    this.model = new Model(itemPicker.model, this.sceneloader);

    setTimeout(()=> {
      // This time out is needed
      // Because it  needs some time to load  the object
      const mesh = this.model.object;
      if (mesh !== undefined ) {
        let body =  this.collisionDecider(itemPicker.collisionBox,size)
        mesh.scale.set(size/1.5,size/1.5,size/1.5);
        if (body !== undefined) {
          body.position.set(position.x, position.y, position.z);
          o.mesh = mesh;
          o.body = body;
          this.scene.add(mesh);

          this.world.addBody(body);
          this.bodies.push(o);
        }
      }
    },100)

  }

  fontBodyAdder() {
        // This the whole font body
        this.fontBody = new CANNON.Body({mass: 0, });
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(2.54,0.15, 1.5)), new CANNON.Vec3(0, -0.02, 0)); // Regular font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(1.6,0.18,1.2)), new CANNON.Vec3(0, 0.795, 0)); // light font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.19,0.1,1.5)), new CANNON.Vec3(-0.85, 0.935, 0));
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.03,0.09,1.5)), new CANNON.Vec3(0.88, 0.935, 0)); // Top tiny part of light font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.27,0.1,1.5)), new CANNON.Vec3(-1.8, 0.18, 0)); // Top tiny part of regular font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.17,0.06,1.5)), new CANNON.Vec3(0.8, 0.15, 0)); // Top tiny part of regular font
        this.fontBody.position.set(0,0,0);
        this.world.addBody(this.fontBody);
  };

  floors() {
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
    this.front.position.set(0,0,1.5);
    this.back.position.set(0,0,-1.45);

    let allFloors = [this.groundBottom, this.groundTop,this.groundLeft, this.groundRight, this.front,this.back];

    allFloors.forEach(floor => {
      this.world.addBody(floor);
    });
  };

  constraintMaker() {
    const jointShape = new CANNON.Sphere(0.1);
    this.jointBody = new CANNON.Body({ mass: 0 });
    this.jointBody.addShape(jointShape);
    this.jointBody.collisionFilterGroup = 0;
    this.jointBody.collisionFilterMask = 0;
    this.world.addBody(this.jointBody);
  }

  cannonJsPhysics(){
    // Here we set all the physcis
    // The walls / floors are also set here
    this.boxes = [];
    this.bodies = [];
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.7, 0);

    // Materials are needed to set a friction an restitution on a body
    this.groundMaterial = new CANNON.Material("groundMaterial");
    const ground_ground_cm = new CANNON.ContactMaterial(this.groundMaterial, this.groundMaterial, {
        friction: 0.3,
        restitution: 0.5,
    });
    this.world.addContactMaterial(ground_ground_cm);

    this.fontBodyAdder();
    // The whole floor are made here
    this.floors();
    // The pivot point between elemenets
    this.constraintMaker();
    // This a cannon debugger when u want to see alle the shapes of the collisions
    //cannonDebugger(this.scene, this.world.bodies);
  }

  setModelForHoliday() {
    // Hier komen dan alle models in te recht
    // Als je meer dan 5 wilt moet je altijd het getaltje +1 maken.
    // In dit geval is dit nu 6  dus wil ik 5 models
    const number = 6;
    let numberGen = Math.floor(Math.random() * number);

    let o = {};
    switch (numberGen) {
      case 0 :
        o.model = Chikken;
        o.collisionBox = 'chicken';
        o.collidesWidth = {x: 0.014, y:0 ,z:0.28};
        break;
      case 1 :
        o.model = Bunny ;
        o.collisionBox = 'bunny';
        o.collidesWidth = {x:0.103, y:0.56 ,z:0};
        break;
      case 2 :
        o.model = Egg;
        o.collisionBox = 'egg';
        break;
      case 3 :
        o.model = RedEgg;
        o.collisionBox = 'egg';
        break;
      case 4 :
        o.model = BlueEgg;
        o.collisionBox = 'egg';
        break;
      case 5 :
        o.model = GreenEgg;
        o.collisionBox = 'egg';
        break;
    };

    return o;
  };

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
    };

    return position;
  };

  setSizeForBlock() {
    // Hier komen dan alle sizes voor de elementen
    const number = 3;
    const sizes = { s:0.15, m:0.25, b:0.5};
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
    };

    return size;
  };

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

      this.fontLight = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:0x000000}));
      this.fontLight.position.set(-1.55,0.65,0);
      this.scene.add(this.fontLight);
    });

  };

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
          that.convexHullMaker(size,position);
          if (i < items ){
            loop();
          }
        }, 100);
      };
     loop();
    });
  };

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this))
  };

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
      },150);
    }
    else {
      this.resizeElements(this.width);
    };
  };


  resizeElements(width) {
    // Resize chekker
    switch (true) {
      case(width >= 375 && width <= 767):
        // Scale of the font
        this.fontLight.scale.set(0.65,0.65,0.65);
        this.fontLight.position.set(-1,0.65,0);
        this.fontBold.scale.set(0.65,0.65,0.65);
        this.fontBold.position.set(-1.75,0.15,0);
        // Body of the font
        this.world.removeBody(this.fontBody);
        this.fontBody = new CANNON.Body({mass: 0, });
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(1.4,0.18, 1.5)), new CANNON.Vec3(0, 0.2, 0)); // Regular font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(1,0.15,1.2)), new CANNON.Vec3(0, 0.66, 0)); // light font
        this.fontBody.position.set(0,0,0);
        this.world.addBody(this.fontBody);
        // The left and right wall
        this.groundLeft.position.set(-3.4,0,0);
        this.groundRight.position.set(3.4,0,0);
        break;
      case(width >= 768 && width <= 1023):
        // The scale of the font
        this.fontLight.scale.set(0.83,0.83,0.83);
        this.fontLight.position.set(-1.2,0.675,0);
        this.fontBold.scale.set(0.83,0.83,0.83);
        this.fontBold.position.set(-2.2,0,0);
        // Body of the font
        this.world.removeBody(this.fontBody);
        this.fontBody = new CANNON.Body({mass: 0});
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(1.9,0.18, 1.5)), new CANNON.Vec3(0, 0.1, 0)); // Regular font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(1.2,0.15,1.2)), new CANNON.Vec3(0, 0.86, 0)); // light font
        this.fontBody.position.set(0,0,0);
        this.world.addBody(this.fontBody);
        // The left and right wall
        this.groundLeft.position.set(-5,0,0);
        this.groundRight.position.set(5,0,0);
        break;
      case(width >= 1024):
        // The scale of the font
        this.fontLight.scale.set(1,1,1);
        this.fontLight.position.set(-1.55,0.65,0);
        this.fontBold.scale.set(1,1,1);
        this.fontBold.position.set(-2.7,-0.2,0);
        // Body of the font
        this.world.removeBody(this.fontBody);
        this.fontBody = new CANNON.Body({mass: 0, });
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(2.54,0.15, 1.5)), new CANNON.Vec3(0, -0.02, 0)); // Regular font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(1.6,0.18,1.2)), new CANNON.Vec3(0, 0.795, 0)); // light font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.19,0.1,1.5)), new CANNON.Vec3(-0.85, 0.935, 0));// Top tiny part of light font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.03,0.09,1.5)), new CANNON.Vec3(0.88, 0.935, 0)); // Top tiny part of light font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.27,0.1,1.5)), new CANNON.Vec3(-1.8, 0.18, 0)); // Top tiny part of regular font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.17,0.06,1.5)), new CANNON.Vec3(0.8, 0.15, 0)); // Top tiny part of regular font
        this.fontBody.position.set(0,0,0);
        this.world.addBody(this.fontBody);
        // The left and right wall
        this.groundLeft.position.set(-8,0,0);
        this.groundRight.position.set(8,0,0);
      };

  };

  render() {
    // Hier wordt dan alles gerenderd en opniew gespeeld
    this.time++;
    this.world.step(this.dt);
    // To link all the bodies to the right mesh
    this.bodies.forEach(b => {
      b.mesh.position.copy( b.body.position);
      b.mesh.quaternion.copy( b.body.quaternion);
    });

    this.renderer.render( this.scene, this.camera );
    window.requestAnimationFrame(() => this.render());
  };
}

let date = new Date();
new Sketch(date);
