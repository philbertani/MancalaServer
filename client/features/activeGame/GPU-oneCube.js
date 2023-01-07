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

  const {canvasRef, gameToDisplay, binRefs} = props

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

    let frameId  //need to save it

    if (canvasRef.current && !canvasInitialized) {
  
      const canvas = canvasRef.current; 

      //console.log('zzzzzzzzzz',canvas)
      const renderer = new THREE.WebGLRenderer({antialias:true});
    
      renderer.setSize(window.innerWidth,window.innerHeight/2)
      renderer.setClearColor("yellow", .5);
      canvas.appendChild(renderer.domElement)

      const fov = 80;
      const aspect = window.innerWidth/window.innerHeight;  // the canvas default
      const near = .1;
      const far = 2000;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.z = 3;
    
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
    
      const boxWidth = .3;
      const boxHeight = .3;
      const boxDepth = .3;
      const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    
      const labelContainerElem = document.createElement('div')
      labelContainerElem.id = "labels"
      canvas.appendChild(labelContainerElem)

      function makeInstance(geometry, color, x, y, z, name, binNum) {
        const material = new THREE.MeshPhongMaterial({color});
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        cube.position.x = x;
        cube.position.y = y;
        cube.position.z = z;
        const elem = document.createElement('div');
        elem.textContent = name;
        elem.binNum = binNum;
        labelContainerElem.appendChild(elem);
    
        return {cube, elem};
      }
    
      if ( gameToDisplay.boardConfig) {
        console.log('boardConfig exists')
      }
      else {
        console.log('no boardConfig')
      }

      /* 
      const cubesx = [
        makeInstance(geometry, 0x44aa88,  0, 'Aqua'),
        makeInstance(geometry, 0x8844aa, -2, 'Purple'),
        makeInstance(geometry, 0xaa8844,  2, 'Gold'),
      ]; 
      */

      const cubes = mancalaCubes( )
      function mancalaCubes() {
        console.log('zzzzzzzzzzz running mancalaCubes')
        let cubes = []

        if ( !gameToDisplay.boardConfig) return cubes

        const stones = gameToDisplay.boardConfig.stones
        const p0bins = gameToDisplay.boardConfig.playerBins[0]
        let pos=0
        for ( let i=p0bins[0]; i<=p0bins[1]; i++ ) {  //i is binNum
          cubes.push(makeInstance(geometry,0xF000F0,pos-3,1,-.5,String(stones[i]),i))
          pos ++
        }

        const p1bins = gameToDisplay.boardConfig.playerBins[1]
        pos = 0
        for ( let i=p1bins[0]; i<=p1bins[1]; i++ ) {  //i is binNum
          cubes.push(makeInstance(geometry,0xF000F0,pos-3,-1,0,String(stones[i]),i))
          pos ++
        }
        return cubes
      }
    
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();

      setGL({renderer,camera,scene,cubes})
      setCanvasInitialized(true)
    }

    if ( canvasInitialized) {

      const {renderer,camera,scene,cubes} = GL

      const tempV = new THREE.Vector3();
      const raycaster = new THREE.Raycaster();
    
      function render(time) {

        //console.log(window.innerWidth)
        time *= 0.001;
        
        cubes.forEach((cubeInfo, ndx) => {

          const stones = gameToDisplay.boardConfig.stones

          const {cube, elem} = cubeInfo;
          const { binNum } = elem

          elem.textContent = String(stones[binNum])  //so we get updates from the game

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

      //console.log('should not be here that often')

    }

    //console.log('running initial',gameToDisplay )
    //return () => { if ( frameId ) window.cancelAnimationFrame(frameId)}

    //console.log('zzzzzz',gameToDisplay.boardConfig.stones)

  },[gameToDisplay]);

}


export default GPU