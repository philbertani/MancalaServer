import React, { useState, useEffect, useRef} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { d12Vertices, d4Vertices } from "./geometry"
import { executeTurn, endGame } from "../players/playersSlice";

//https://r105.threejsfundamentals.org/threejs/lessons/threejs-align-html-elements-to-3d.html
//let cubes = []
//let isRendering = false
let count = 0  //useRef() replaces all this kind of stuff

//GPU (any high end graphics like canvas or WebGL/Three.js goes here)
const GPU = (props) => {

  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [binsInitialized, setBinsInitialized] = useState(false)
  const [GL, setGL] = useState({})
  const [windowSize,setWindowSize] = useState({})
  const [prevStones,setPrevStones] = useState()
  const [initLabelsJSX,setInitLabelsJSX] = useState()

  const { 
    canvasRef, 
    gameToDisplay,
    playerData,
    playerNum,
    myTurn,
    dispatchExecuteTurn,
    labelsRef,
    binRefs
  } = props

  let labelRefs=[]
  for (let i=0; i<14; i++) {
    const labelRef = useRef()
    labelRefs.push(labelRef)
  }

  //to access the LATEST values of variables in functions defined within Components
  //we need to access a reference!!!  - don't fight the system
  const stonesRef = useRef()
  const frameIdRef = useRef()
  const isRendering = useRef(false)
  const playerNumRef = useRef()
  const playerDataRef = useRef()
  const gameToDisplayRef = useRef()
  const myTurnRef = useRef()

  playerNumRef.current = playerNum
  playerDataRef.current = playerData
  gameToDisplayRef.current = gameToDisplay
  myTurnRef.current = myTurn

  function dispatchGPUExecuteTurn(ev) {
 
    console.log('zzzzzzzzzzz GPU PlayerNum',playerNumRef.current,gameToDisplayRef.current)
    const {gameState} = gameToDisplayRef.current
    const myBins = gameToDisplayRef.current.boardConfig.playerBins[playerNumRef.current]
    console.log('yyyyyyyyyyy GPU PlayerNum',playerNumRef.current,gameToDisplayRef.current)
    dispatchExecuteTurn(ev, gameToDisplayRef.current.id, myTurnRef.current, myBins, gameState  )
  }

/*   React.useEffect(() => {
    window.addEventListener("click",(ev)=>{console.log('mouse click',ev)})
  },[]) */

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

    const stones = gameToDisplay.boardConfig.stones

    stonesRef.current = stones

    if (canvasRef.current && !canvasInitialized) {
  
      const canvas = canvasRef.current; 

      //console.log('zzzzzzzzzz',canvas)
      const renderer = new THREE.WebGLRenderer({antialias:true});
    
      renderer.setSize(window.innerWidth,window.innerHeight/2)
      renderer.setClearColor("orange", 1);
      canvas.appendChild(renderer.domElement)

      const fov = 50;
      const aspect = window.innerWidth/window.innerHeight;  // the canvas default
      const near = .1;
      const far = 2000;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.z = 5;
    
      const controls = new OrbitControls(camera, canvas);
      controls.target.set(0, 0, 0);
      controls.update();
    
      const scene = new THREE.Scene();
    
      const color = 0xFFFFFF;
      const intensity = 1;

      //const light = new THREE.DirectionalLight(color, intensity);
      //light.position.set(-1, 2, 4);

      //super cool - light source now emanates from camera!
      const light = new THREE.PointLight(color,intensity)
      scene.add(camera);
      camera.add(light)
    
      const boxWidth = .25;
      const boxHeight = .25;
      const boxDepth = .25;
      //const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
      const geometry = new THREE.TetrahedronGeometry(.3)
    
      let initLabelsJSX = []  //we need JSX components so they register with React!!

      const material = new THREE.MeshPhongMaterial();
      function makeD4Instance(geometry,color,x,y,z,name,binNum) {
        const d4Group = new THREE.Group()
        for (let i=0; i<d4Vertices.length; i++) {
          const cube = new THREE.Mesh(geometry,material)
          cube.material.color.setHex(color)
          const [x2,y2,z2] = d4Vertices[i]
          cube.position.set(x2,y2,z2).multiplyScalar(.2)
          d4Group.add(cube)
        }   

        d4Group.position.set(x,y,z)

        const elem = binNum

        initLabelsJSX.push(
          <div 
            key={"label"+binNum} 
            ref={labelRefs[binNum]}
            id={"GPUbinNum" + binNum }
            onClick={(ev)=>{dispatchGPUExecuteTurn(ev)}  }    
          >{stones[binNum]}</div>)

        scene.add(d4Group)

        return {cube:d4Group, elem }
      }

      if ( gameToDisplay.boardConfig) {
        console.log('boardConfig exists')
      }
      else {
        console.log('no boardConfig')
      }

      const cubes = mancalaCubes( )

      setInitLabelsJSX(initLabelsJSX)

      function mancalaCubes() {

        let cubes = []  //not really cubes anymore - har har

        if ( !gameToDisplay.boardConfig) return cubes   //should not happen

        //const stones = gameToDisplay.boardConfig.stones

        const p0bins = gameToDisplay.boardConfig.playerBins[0]
        let pos=0
        for ( let i=p0bins[0]; i<=p0bins[1]; i++ ) {  //i is binNum
          cubes.push(makeD4Instance(geometry,0xF000F0,2*(pos-3),1,-.5,String(stones[i]),i))
          pos ++
        }

        const p1bins = gameToDisplay.boardConfig.playerBins[1]
        pos = 0
        for ( let i=p1bins[0]; i<=p1bins[1]; i++ ) {  //i is binNum
          cubes.push(makeD4Instance(geometry,0xF000F0,2*(pos-3),-1,0,String(stones[i]),i))
          pos ++
        }
        return cubes
      }
    
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();

      setGL({renderer,camera,scene,cubes})
      setCanvasInitialized(true)
    }

    let newStoneConfig = false;
    if (prevStones) {
      for (let i = 0; i < stones.length; i++) {
        if (stones[i] !== prevStones[i]) {
          newStoneConfig = true;
        }
      }
    }

    if ( canvasInitialized) {

      const {renderer,camera,scene,cubes} = GL
      const tempV = new THREE.Vector3();
      
      //we need to throttle the fps to maintain game speed
      //too much else going on with React and Express
      const fps = 32
      const fpsInterval = 1000/fps
      let prevRenderTime = Date.now()
    
      // https://stackoverflow.com/questions/62653091/cancelling-requestanimationrequest-in-a-react-component-using-hooks-doesnt-work

      function render(time) {

        //there is probably a more explicit way to do this but this works
        try { if (canvas) {} }
        catch (err) {
          cancelAnimationFrame(frameIdRef.current)
          return
        }

        frameIdRef.current = requestAnimationFrame(render);
        //we are rendering way too many times a second

        //if (count%60 == 0) console.log('hhhhhhhh',count)
        const currentRenderTime = Date.now()
        const elapsed = currentRenderTime - prevRenderTime

        if ( elapsed < fpsInterval ) return;

        count ++
        time *= 0.001;
        prevRenderTime = currentRenderTime - (elapsed%fpsInterval)

        cubes.forEach((cubeInfo, idx) => {

          //const stones = gameToDisplay.boardConfig.stones
          const {cube, elem} = cubeInfo;
          const  binNum  = elem

          const speed = 1 + idx * .1;
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
   
          // convert the normalized position to CSS coordinates
          const x = (tempV.x *  .5 + .5) * canvas.clientWidth;
          const y = (tempV.y * -.5 + .5) * canvas.clientHeight;
    
          //the key to getting the updated version of stones is the use
          //stonesRef which is maintained by useRef()!!!
          //can't escape the React life cycle - just accept it
          const labelRef = labelRefs[binNum]
          if (labelRef.current) {
            labelRef.current.textContent = String(stonesRef.current[binNum])
            //numbers are a little choppy put in some smoothing
            labelRef.current.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
            labelRef.current.style.zIndex = (-tempV.z * .5 + .5) * 100000 | 0;
          }

        });

        renderer.render(scene, camera);

      }

      if ( !isRendering.current) {
        console.log('kicking off recursive render')
        isRendering.current = true
        render()
      }

    }

    //console.log('running initial',gameToDisplay )
    //return () => { if ( frameIdRef.current ) window.cancelAnimationFrame(frameIdRef.current)}

    //console.log('zzzzzz',gameToDisplay.boardConfig.stones)
    setPrevStones(stones)

  },[gameToDisplay]);

  //labels has to be SIBLING of canvas in order for it to be clickable
  return ( [
    <div key="GPUContainer" id="GPUContainer">
      <div key="labelsDiv" id="labels">{initLabelsJSX}</div>
      <div key="canvasDiv" id="canvas" ref={canvasRef}></div>
    </div>
  ])

}


export default GPU