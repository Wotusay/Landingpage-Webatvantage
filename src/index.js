import './style.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import model from './models/amongus.glb'


let mixer;

let renderer;
let playerDirection = 0;
let angularSpeed = 0.01;
let playerSpeed = 0.075;
let playerBackwardsSpeed = playerSpeed * 0.4;
let person; 
let animates;
let camera;
let scene;



let  playerIsMovingForward = 0;
let  playerIsMovingBackwards = 0;
let  playerIsRotatingLeft = 0;
let  playerIsRotatingRight = 0;
let  playerGoesUp = 0;
let  playerGoesDown = 0;

const clock = new THREE.Clock();
const init = () => {
    let pos;
    scene = new THREE.Scene();
    scene.background = new THREE.Color('skyblue');
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);
    
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    hemiLight.position.set( 0, 5, 0 );
    scene.add( hemiLight );
    
    let dirLight = new THREE.DirectionalLight( 0xffffff);
        dirLight.position.set( 3, 10, 10 );
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 2;
        dirLight.shadow.camera.bottom = - 2;
        dirLight.shadow.camera.left = - 2;
        dirLight.shadow.camera.right = 2;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 40;
        scene.add( dirLight );
        
        const mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
        mesh.rotation.x = - Math.PI / 2;
        mesh.receiveShadow = true;
        scene.add( mesh );

         const loader = new GLTFLoader(); 
           loader.load(model, gltf => {
            person = gltf.scene;
            animates = gltf.animations;
            pos = person.position;
                
            person.traverse(object => {
                if (object.isMesh) {object.castShadow = true} ;
              
            });
            
            mixer = new THREE.AnimationMixer(person);
            animates.forEach((clip) => {
                mixer.clipAction(clip).play();
            })
    
            person.scale.set(0.007,0.007,0.007 );
            scene.add(person);
            
            camera.lookAt(pos)

             window.addEventListener('keydown', () => {
                playerIsMovingForward = 0;
                playerIsMovingBackwards = 0;
                playerIsRotatingLeft = 0;
                playerIsRotatingRight = 0;
                playerGoesUp = 0;
                playerGoesDown = 0;
            
            })
            
            
            const updatePlayer = () => {
                if(playerIsRotatingLeft){ // rotate left
                    playerDirection -= angularSpeed;
                }
                if(playerIsRotatingRight){ // rotate right
                    playerDirection += angularSpeed;
                }
                if(playerIsRotatingRight || playerIsRotatingLeft){
                    setPlayerDirection();
            
                }
                if(playerIsMovingForward){ // go forward
                    moveForward(playerSpeed);
                    let delta = clock.getDelta();
                    if ( mixer ) mixer.update( delta );
            
                }
                if(playerIsMovingBackwards){ // go backwards
                    moveForward(-playerBackwardsSpeed);
            
                }
            }
            
            window.addEventListener('keydown', (e) => {
                const Z = 90;
                const S = 83;
                const Q = 81;
                const D = 68;
                const minus = 189;
                const plus = 187;
            
                const k = e.keyCode;
                console.log(k);
                if(k == Q){ // rotate left
                    playerIsRotatingLeft = 1;
                }
                if(k == D){ // rotate right
                    playerIsRotatingRight = 1;
                }
                if(k == Z){ // go forward
                    playerIsMovingForward = 1;
                }
                if(k == S){ // go back 
                    playerIsMovingBackwards = 1;
                }
            
            });
            
            const animate = () => {
                requestAnimationFrame( animate );
                updatePlayer();
            
                renderer.render( scene, camera );    
            
            };
            
            const moveForward = speed => {
                const delta_x = speed * Math.cos(playerDirection);
                const delta_z = speed * Math.sin(playerDirection);
                const new_x = camera.position.x + delta_x;
                const new_z = camera.position.z + delta_z;
                camera.position.x = new_x;
                camera.position.z = new_z;
            
                const new_dx = pos.x + delta_x;
                const new_dz = pos.z + delta_z;
                pos.x = new_dx;
                pos.z = new_dz;
               camera.lookAt(pos); 
            }
            
            
            const setPlayerDirection = () => {
                //direction changed.
                const delta_x = playerSpeed * Math.cos(playerDirection);
                const delta_z = playerSpeed * Math.sin(playerDirection);
            
                const new_dx = camera.position.x + delta_x;
                const new_dz = camera.position.z + delta_z;
                pos.x = new_dx;
                pos.z = new_dz;
                console.log(pos);
               camera.lookAt(pos); 
            };
            
            animate();
        },  
        
        error => { console.log( error )});
    
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100 );
    
    renderer = new THREE.WebGLRenderer({antialias: true});    
    const controls = new OrbitControls(camera, renderer.domElement);

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    
    
    
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
    
        camera.updateProjectionMatrix();
    })
    camera.position.set( -2, 2.5 , 2.5)
    
   
    controls.minDistance = 1;
    controls.maxDistance = 1000;
    
    

}





init();
