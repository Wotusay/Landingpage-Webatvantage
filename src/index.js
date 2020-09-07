import './style.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import model from './models/raze.glb'
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js';



let modelskel; 
const crossfadeControls = [];


let currentBaseAction = 'idle';

const allActions = []; 
const baseActions = {
    idle: {weight: 1}, 
    walk: {weight: 0}, 
    run: {weight:0}
}

const additiveActions = {
    sneak_pose: { weight: 0 },
    sad_pose: { weight: 0 },
    agree: { weight: 0 },
    headShake: { weight: 0 }
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);
scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);


const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight );



var dirLight = new THREE.DirectionalLight( 0xffffff );
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

    const loadModels = () => {
        loadGltfModel(model);
    }

    const scaling = (raze) => {
        if (raze) {
            const skeletonRaze =  SkeletonUtils.clone(raze);
            if (skeletonRaze) {
                skeletonRaze.scale.set(0.009,0.009,0.009 );
                scene.add(skeletonRaze);
            } 
        }
    }

    const loadGltfModel = (raze) => {   
     const loader = new GLTFLoader(); 
    loader.load(model, gltf => {
        raze = gltf.scene;
        raze.traverse(object => {
            if (object.isMesh) {object.castShadow = true} ;
            
        });
        scaling(raze);
    },  
    
    error => { console.log( error )});
        };



const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );




window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();
})



camera.position.z = 5;

const controls = new OrbitControls(camera, renderer.domElement);

controls.minDistance = 1;
controls.maxDistance = 1000;



const animate = () => {
    requestAnimationFrame(animate);

    controls.update();
    renderer.render( scene, camera );
};
loadModels();
animate();