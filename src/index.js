import './style.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import model from './models/amongus.glb'
import { Clock } from 'three';

let mixer;

const scene = new THREE.Scene();
scene.background = new THREE.Color('skyblue');
scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
hemiLight.position.set( 0, 5, 0 );
scene.add( hemiLight );

var dirLight = new THREE.DirectionalLight( 0xffffff);
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

    const clock = new THREE.Clock();
  


     const loader = new GLTFLoader(); 
        loader.load(model, gltf => {
        let person = gltf.scene;
        let animates = gltf.animations;

        person.traverse(object => {
            if (object.isMesh) {object.castShadow = true} ;
          
        });
        
        mixer = new THREE.AnimationMixer(person);
        animates.forEach((clip) => {
            mixer.clipAction(clip).play();
        })

        person.scale.set(0.007,0.007,0.007 );
        scene.add(person);

        return mixer;
    },  
    
    error => { console.log( error )});



const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100 );

const renderer = new THREE.WebGLRenderer({antialias: true});
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

//window.addEventListener('pointermove', () => {
//    console.log(camera.position);
//})

const controls = new OrbitControls(camera, renderer.domElement);

controls.minDistance = 1;
controls.maxDistance = 1000;




const animate = () => {
    requestAnimationFrame( animate );
    let delta = clock.getDelta();
    if ( mixer ) mixer.update( delta );

    renderer.render( scene, camera );    

};
animate();