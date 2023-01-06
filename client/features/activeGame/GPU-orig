import React, { useState, useEffect} from "react";
import * as THREE from "three";

//https://r105.threejsfundamentals.org/threejs/lessons/threejs-align-html-elements-to-3d.html
let cubes = []

//GPU (any high end graphics like canvas or WebGL/Three.js goes here)
const GPU = (props) => {

  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [binsInitialized, setBinsInitialized] = useState(false)
  const [GL, setGL] = useState({})

  const {canvasRef, binRefs} = props

  useEffect(() => {

    if (canvasRef.current && !canvasInitialized) {
      setCanvasInitialized(true);
      console.log("initializing three.js", canvasRef);
      const divStats = canvasRef.current.getBoundingClientRect();
      console.log(divStats);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        80,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor("yellow", .5);  //2nd param is alpha, make it totally transparent
      canvasRef.current.appendChild(renderer.domElement);
      //document.body.appendChild(renderer.domElement)

      const light = new THREE.PointLight(0xffffff, 1, 0, 1)
      light.position.set(2, 10, 10)
      scene.add(light)
      camera.position.z = 3;
      renderer.render(scene, camera);
      setCanvasInitialized(true)
      setGL({renderer,scene,camera})
 
      let animationFrameId
      function animate() {
        animationFrameId = requestAnimationFrame(animate)
        renderer.render(scene,camera)
      }
      //animate()
    }

    //return () => { window.cancelAnimationFrame(animationFrameId)}
    
  },[]);

  useEffect( ()=>{

    const {renderer,scene,camera} = GL
  
    if (typeof binRefs[0].current !== 'undefined' && !binsInitialized) {
      console.log('binRefs is defined')
      setBinsInitialized(true)

      const geometry = new THREE.BoxGeometry(.3, .3, .3);
      const material = new THREE.MeshPhongMaterial({ color: 0x00ffff });

      console.log('binRefs',binRefs )

      for (let i=0; i<binRefs.length; i++) {
        const cube = new THREE.Mesh(geometry, material);
        const divStats = binRefs[i].current.getBoundingClientRect()
        console.log('zzzzzzzzzzz',divStats.top,divStats.left)
        cube.position.x = divStats.left / window.innerWidth * 6 - 2.8
        cube.position.y = divStats.top  / window.innerHeight * 5 - 6.5

        cube.rotation.x = .9
        cube.rotation.z = 1
        scene.add( cube )
        cubes.push(cube)
      }
      renderer.render(scene,camera)

    }

    if ( typeof binRefs[0].current !== 'undefined' && setBinsInitialized) {
      for (let i=0; i<binRefs.length; i++) {
        const divStats = binRefs[i].current.getBoundingClientRect()
        //cubes[i].position.x = divStats.left / window.innerWidth *6.6 - 3.2
        //cubes[i].position.y = divStats.top / window.innerHeight *6.5 - 3.2          
      }
      renderer.render(scene,camera)
    }

  },[binRefs])
  
};

export default GPU