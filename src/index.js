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
import * as CANNON from 'cannon-es';


export default class Sketch {
  constructor() {
    this.renderer = new THREE.WebGLRenderer( { alpha: true , powerPreference: "high-performance", antialias:true } );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;

    this.container = document.getElementById('container');
    this.container.appendChild( this.renderer.domElement );
    this.width =  this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    let aspect = this.width  / this.height;

    this.mouse = new THREE.Vector2();
    this.point = new THREE.Vector3(0,0,0)

    this.hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820,0.6);
    this.spotLight = new THREE.SpotLight(0xffa95c,1.3);
    this.spotLightTwo = new THREE.SpotLight(0xffa95c,0.8);
    this.spotLight.position.set(10,0,10);
    this.spotLightTwo.position.set(-10,0,10)
    this.hemiLight.position.set(5,0,5);
    //this.cameraFov = 70;
    this.spectrum = 8;
    this.camera = new THREE.OrthographicCamera( this.spectrum * aspect  /-2 ,  this.spectrum * aspect / 2 ,this.spectrum/ 2 ,this.spectrum / -2 , -5, 1000 );

    this.scene = new THREE.Scene();
    this.raycaster =  new THREE.Raycaster();
    this.loader = new THREE.FontLoader();

    this.fontBold;
    this.fontLight;

    this.jointBody;
    this.world;
    this.dt = 1 /60;
    this.cubeBody = [];
    this.meshes = [];
    this.jointConstraint;
    this.isDragging = false;

    // Dit de loader die wordt gebruikt om alle glttf inteladen en deze te compressen
    // De links is de decoder zelf om deze dan te gebruiken ook in production
    this.sceneloader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderConfig({type: 'js'});
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.sceneloader.setDRACOLoader(this.dracoLoader);

    this.chikken =  new Model(Chikken, this.sceneloader);
    this.bunny =  new Model(Bunny, this.sceneloader);
    this.egg =  new Model(Egg, this.sceneloader);
    this.eggRed =  new Model(RedEgg, this.sceneloader);
    this.eggBlue =  new Model(BlueEgg, this.sceneloader);
    this.eggGreen =  new Model(GreenEgg, this.sceneloader);

    this.scene.add(this.hemiLight);
    this.scene.add(this.spotLight);
    this.scene.add(this.spotLightTwo);

    this.fontMaker();
    this.setupResize();
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
    this.movementPlane = new THREE.Mesh(new THREE.PlaneGeometry(50,50), new THREE.MeshBasicMaterial());
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
    const floorBody = new CANNON.Body({ mass: 0, allowSleep: true});
    return floorBody.addShape(floorShape);
  }

  collisionDecider(object,size) {
    // Here we make and decide the body of the object
    // The bodies are compound bodies
    let body;

    const eggBodyMed = new CANNON.Body({mass:1, allowSleep: true ,material: this.groundMaterial});

    const bunnyBodyMed = new CANNON.Body({mass:1, allowSleep: true ,material: this.groundMaterial});

    const chickenBodyMed = new CANNON.Body({mass:1, allowSleep: true ,material: this.groundMaterial});

    // Chicken
    // Med
    chickenBodyMed.addShape(new CANNON.Box(new CANNON.Vec3(0.1, 0.2, 0.14)), new CANNON.Vec3(-0.02, 0, 0)); // body
    chickenBodyMed.addShape(new CANNON.Sphere(.1), new CANNON.Vec3(0.16, 0.12, 0)); //tail

    // Bunny
    // Med
    bunnyBodyMed.addShape(new CANNON.Box(new CANNON.Vec3(0.08, 0.12, 0.10)), new CANNON.Vec3(-0.02, 0, 0)); // Body
    bunnyBodyMed.addShape(new CANNON.Box(new CANNON.Vec3(0.04, 0.08, 0.05)), new CANNON.Vec3(0.04, 0.14, 0)); // ears

    // Egg
    //Med
    eggBodyMed.addShape(new CANNON.Sphere(.18), new CANNON.Vec3(0, 0, 0)); //body big
    eggBodyMed.addShape(new CANNON.Sphere(0.09), new CANNON.Vec3(0, 0.13, 0));  // Body top small


    switch(true){
        case (object === 'egg' && size === 0.25):
        body = eggBodyMed;
        break;
        case (object === 'bunny' && size === 0.25):
        body = bunnyBodyMed;
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
    this.model =  itemPicker.model;

    setTimeout(()=> {
      // This time out is needed
      // Because it  needs some time to load  the object
      if (this.model !== undefined) {
        const mesh = this.model.clone();
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
      }
    },190)

  }

  fontBodyAdder() {
        // This the whole font body
        this.fontBody = new CANNON.Body({mass: 0, });
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(2.54,0.15, 1.5)), new CANNON.Vec3(0, -0.02, 0)); // Regular font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(1.6,0.18,1.2)), new CANNON.Vec3(0, 0.795, 0)); // light font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.19,0.1,1.5)), new CANNON.Vec3(-0.85, 0.935, 0));// Top tiny part of light font
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

    this.groundBottom.position.set(0,-4.99,0);
    this.groundTop.position.set(0,9.5,0);
    this.groundLeft.position.set((this.camera.left - 1) ,0,0);
    this.groundRight.position.set((this.camera.right + 1),0,0);
    this.front.position.set(0,0,1);
    this.back.position.set(0,0,-2);

    let allFloors = [this.groundBottom, this.groundTop,this.groundLeft, this.groundRight, this.front,this.back];

    allFloors.forEach(floor => {
      this.world.addBody(floor);
    });
  };

  constraintMaker() {
    const jointShape = new CANNON.Sphere(0.5);
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
        o.model = this.chikken.object;
        o.collisionBox = 'chicken';
        o.collidesWidth = {x: 0.014, y:0 ,z:0.28};
        break;
      case 1 :
        o.model = this.bunny.object ;
        o.collisionBox = 'bunny';
        o.collidesWidth = {x:0.103, y:0.56 ,z:0};
        break;
      case 2 :
        o.model = this.egg.object;
        o.collisionBox = 'egg';
        break;
      case 3 :
        o.model = this.eggRed.object;
        o.collisionBox = 'egg';
        break;
      case 4 :
        o.model = this.eggBlue.object;
        o.collisionBox = 'egg';
        break;
      case 5 :
        o.model = this.eggGreen.object;
        o.collisionBox = 'egg';
        break;
    };

    return o;
  };

  setPositionForBlock() {
        // Hier komen dan alle posities van de objecten terechtn
    const leftBoundry = -3.5;
    const rightBoundry = 3.5;

    const x = (Math.random() * (rightBoundry - leftBoundry + 1) + leftBoundry);
    let position = {x:x ,y:5 ,z:0};
    return position;
  };

  setSizeForBlock() {
    // Hier komen dan alle sizes voor de elementen
    const sizes = { s:0.15, m:0.25, b:0.3};
    let size = sizes.m;
    return size;
  };

  fontMaker() {
    // Hier worden de fonts ingeladen
    // Alle fonts werken niett met pixels maar met meter
    // Dus pas op als je iets aan past
    // Regular

    this.loader.load(fontPathTwo, (font) => {
      let geometryBold = new THREE.TextGeometry( 'online experiences', {
        font: font,
        size: 0.5,
        height: 0.01,

      } );

      geometryBold.computeBoundingBox();

      this.fontBold = new THREE.Mesh(geometryBold, new THREE.MeshBasicMaterial({color:0x000000}));
      this.fontBold.scale.set(1,1,1);
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
      this.fontLight.scale.set(1,1,1);
      this.fontLight.position.set(-1.55,0.65,0);
      this.scene.add(this.fontLight);
    });

  };

  onLoad() {
    // Hier worden dan alle 3d elmenen op geroept.
    // Hier worden ze ingespawnt
    let that = this ;
    window.addEventListener('load', (e) => {
      const items = 90;

      that.resize();
      let i = 0;
      const loop = () => {
        setTimeout( () => {
          i++;
          let size = that.setSizeForBlock();
          let position = that.setPositionForBlock();;
          that.convexHullMaker(size,position);
          if (i < items ){
            loop();
          }
        }, 190);
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
    let aspect = this.width / this.height;
    this.camera.left = this.spectrum * aspect / -2;
    this.camera.right = this.spectrum * aspect / 2;
    this.camera.updateProjectionMatrix();
    this.groundResizer();
    this.resizeElementsBody(this.width);


    if(this.fontLight === undefined ) {
      setTimeout(() => {
        this.resizeElementsSizes(this.width);

      },150);
    }
    else {
      this.resizeElementsSizes(this.width);

    };
  };

  fontScaler(scale,posLight,posBold) {
    this.fontLight.scale.set(scale,scale,scale);
    this.fontLight.position.set(posLight.x,posLight.y,posLight.z);
    this.fontBold.scale.set(scale,scale,scale);
    this.fontBold.position.set(posBold.x,posBold.y,posBold.z);
  }

  cannonWorldResizer(fontBodyLight,posBodyLight, fontBodyBold, posBodyBold) {
    this.world.removeBody(this.fontBody);
    this.fontBody = new CANNON.Body({mass: 0, STATIC:1 });
    this.fontBody.addShape(new CANNON.Box(fontBodyLight),posBodyLight ); // Regular font
    this.fontBody.addShape(new CANNON.Box(fontBodyBold), posBodyBold); // light font
    this.fontBody.position.set(0,0,0);
    this.world.addBody(this.fontBody);
  }

  groundResizer() {
    this.groundLeft.position.set((this.camera.left - 1) ,0,0);
    this.groundRight.position.set((this.camera.right + 1) ,0,0);
  }

  resizeElementsSizes(width) {

    let scale;
    let posLight;
    let posBold;
    // Resize chekker
    switch (true) {
      case(width >= 375 && width <= 767):
        scale = 0.65;
        posLight = {x:-1,y:0.65,z:0};
        posBold = {x:-1.75, y:0.15, z:0};
        this.fontScaler(scale,posLight,posBold);
        break;
      case(width >= 768 && width <= 1023):
        scale = 0.83;
        posLight = {x:-1.2,y:0.675,z:0};
        posBold = {x:-2.2, y:0, z:0};
        this.fontScaler(scale,posLight,posBold);
        break;
      case(width >= 1024):
        // The scale of the font
        scale = 1;
        posLight = {x:-1.55,y:0.65,z:0};
        posBold = {x:-2.7, y:-0.2, z:0};
        this.fontScaler(scale,posLight,posBold);
      };

  };

  resizeElementsBody(width) {
    let fontBodyLight;
    let fontBodyBold;
    let posBodyBold;
    let posBodyLight;


    // Resize chekker

      if (width >= 375 && width <= 767){
        fontBodyLight = new CANNON.Vec3(1.4,0.18, 1.5);
        fontBodyBold = new CANNON.Vec3(1,0.15,1.2);
        posBodyBold = new CANNON.Vec3(0, 0.2, 0);
        posBodyLight = new CANNON.Vec3(0, 0.66, 0)
        this.cannonWorldResizer(fontBodyLight,posBodyLight, fontBodyBold, posBodyBold);
      }
      if(width >= 768 && width <= 1023){
        fontBodyLight = new CANNON.Vec3(1.9,0.18, 1.5);
        fontBodyBold = new CANNON.Vec3(1.2,0.15,1.2);
        posBodyBold = new CANNON.Vec3(0, 0.1, 0);
        posBodyLight = new CANNON.Vec3(0, 0.86, 0);
        this.cannonWorldResizer(fontBodyLight,posBodyLight, fontBodyBold, posBodyBold);
      }
      if (width >= 1024){
        this.world.removeBody(this.fontBody);
        this.fontBody = new CANNON.Body({mass: 0, STATIC:1 });
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(2.54,0.15, 1.5)), new CANNON.Vec3(0, -0.02, 0)); // Regular font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(1.6,0.18,1.2)), new CANNON.Vec3(0, 0.795, 0)); // light font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.19,0.1,1.5)), new CANNON.Vec3(-0.85, 0.935, 0));// Top tiny part of light font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.03,0.09,1.5)), new CANNON.Vec3(0.88, 0.935, 0)); // Top tiny part of light font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.27,0.1,1.5)), new CANNON.Vec3(-1.8, 0.18, 0)); // Top tiny part of regular font
        this.fontBody.addShape(new CANNON.Box(new CANNON.Vec3(0.17,0.06,1.5)), new CANNON.Vec3(0.8, 0.15, 0)); // Top tiny part of regular font
        this.fontBody.position.set(0,0,0);
        this.world.addBody(this.fontBody);
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

new Sketch();
