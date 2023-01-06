import React, { useState, useEffect} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

//https://r105.threejsfundamentals.org/threejs/lessons/threejs-align-html-elements-to-3d.html
let cubes = []

//GPU (any high end graphics like canvas or WebGL/Three.js goes here)
const GPU = (props) => {

  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [binsInitialized, setBinsInitialized] = useState(false)
  const [GL, setGL] = useState({})
  const [windowSize,setWindowSize] = useState({})

  const {canvasRef, binRefs} = props

  //this will fire every time window size changes
  React.useEffect(() => {
    window.addEventListener("resize", () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    });
  }, []);  

  React.useEffect(()=>{
    console.log('window was resized')
    //GL is just references which control state via three.js so we don't want to use setGL here
    const {renderer,camera} = GL  
    if ( renderer) {
      renderer.setSize(window.innerWidth,window.innerHeight/2)
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
  },[windowSize])

  useEffect(() => {

    if (canvasRef.current && !canvasInitialized) {
  
      const canvas = canvasRef.current; 

      //console.log('zzzzzzzzzz',canvas)
      const renderer = new THREE.WebGLRenderer({antialias:true});
    
      renderer.setSize(window.innerWidth,window.innerHeight/2)
      renderer.setClearColor("yellow", .5);
      canvas.appendChild(renderer.domElement)

      const fov = 75;
      const aspect = window.innerWidth/window.innerHeight;  // the canvas default
      const near = 1.1;
      const far = 20;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.z = 7;
    
      const controls = new OrbitControls(camera, canvas);
      controls.target.set(0, 0, 0);
      controls.update();
    
      const scene = new THREE.Scene();
    
      {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
      }
    
      const boxWidth = 1;
      const boxHeight = 1;
      const boxDepth = 1;
      const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    
      const labelContainerElem = document.createElement('div')
      labelContainerElem.id = "labels"
      //const labelContainerElem = labelsRef.current; //document.querySelector('#labels');
      canvas.appendChild(labelContainerElem)

      function makeInstance(geometry, color, x, name) {
        const material = new THREE.MeshPhongMaterial({color});
    
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
    
        cube.position.x = x;
    
        const elem = document.createElement('div');
        elem.textContent = name;
        labelContainerElem.appendChild(elem);
    
        return {cube, elem};
      }
    
      const cubes = [
        makeInstance(geometry, 0x44aa88,  0, 'Aqua'),
        makeInstance(geometry, 0x8844aa, -2, 'Purple'),
        makeInstance(geometry, 0xaa8844,  2, 'Gold'),
      ];
    
      function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          console.log('resizing renderer')
          renderer.setSize(width, height, false);
        }
        return needResize;
      }
    
      const tempV = new THREE.Vector3();
      const raycaster = new THREE.Raycaster();
    
      setGL({renderer,camera})

      let frameId  //need to save it

      function render(time) {

        //console.log(window.innerWidth)
        time *= 0.001;
    
        if (resizeRendererToDisplaySize(renderer)) {
          const canvas = renderer.domElement;
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
        }
    
        cubes.forEach((cubeInfo, ndx) => {
          const {cube, elem} = cubeInfo;
          const speed = 1 + ndx * .1;
          const rot = time * speed;
          cube.rotation.x = rot;
          cube.rotation.y = rot;
    
          // get the position of the center of the cube
          cube.updateWorldMatrix(true, false);
          cube.getWorldPosition(tempV);
    
          // get the normalized screen coordinate of that position
          // x and y will be in the -1 to +1 range with x = -1 being
          // on the left and y = -1 being on the bottom
          tempV.project(camera);
    
          // ask the raycaster for all the objects that intersect
          // from the eye toward this object's position
          raycaster.setFromCamera(tempV, camera);
          const intersectedObjects = raycaster.intersectObjects(scene.children);
          // We're visible if the first intersection is this object.
          const show = intersectedObjects.length && cube === intersectedObjects[0].object;
    
          if (!show || Math.abs(tempV.z) > 1) {
            // hide the label
            elem.style.display = 'none';
          } else {
            // unhide the label
            elem.style.display = '';
    
            // convert the normalized position to CSS coordinates
            const x = (tempV.x *  .5 + .5) * canvas.clientWidth;
            const y = (tempV.y * -.5 + .5) * canvas.clientHeight;
    
            // move the elem to that position
            elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
    
            // set the zIndex for sorting
            elem.style.zIndex = (-tempV.z * .5 + .5) * 100000 | 0;
          }
        });
    
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(render);

      }

      //requestAnimationFrame(render);
      render()

    }

    return () => { window.cancelAnimationFrame(frameId)}
  },[]);
}

export default GPU