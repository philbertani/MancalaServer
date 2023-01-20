import React, { useState, useEffect, useRef} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { d12Vertices, d4Vertices, Pyramid } from "./geometry"
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

  const heightMult = 1.85

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
    //console.log('yyyyyyyyyyy GPU PlayerNum',playerNumRef.current,gameToDisplayRef.current)
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
      renderer.setSize(window.innerWidth,window.innerHeight/heightMult)
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
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha:true });

      renderer.setSize(window.innerWidth, window.innerHeight / heightMult);
      renderer.setClearColor("white", 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

      canvas.appendChild(renderer.domElement);

      const fov = 50;
      const aspect = window.innerWidth / window.innerHeight; // the canvas default
      const near = 0.1;
      const far = 2000;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.set(0,-3.5,4)

      const controls = new OrbitControls(camera, canvas);
      controls.target.set(0, 0, 0);
      controls.update();

      const scene = new THREE.Scene();

      const color = 0xffffff;
      const intensity = .5;

      //super cool - light source now emanates from camera!
      const light2 = new THREE.PointLight(color, intensity);
      scene.add(camera);
      camera.add(light2);

      const light3 = new THREE.DirectionalLight(0xFFFFA0, 1)
      light3.position.set(1,3,5)
      scene.add(light3)

      //Create a DirectionalLight and turn on shadows for the light
      const light = new THREE.DirectionalLight(0xf0f0ff, 1);
      light.position.set(0, -4, 5); //default; light shining from top
      light.castShadow = true; // default false
      scene.add(light);

      //Set up shadow properties for the light
      light.shadow.mapSize.width = 1024; // default
      light.shadow.mapSize.height = 1024; // default
      light.shadow.camera.near = 0.1; // default
      light.shadow.camera.far = 1000; // default

      //have to set the range of the orthographic shadow camera
      //to cover the whole plane we are casting shadows onto
      //defaults are -5 to 5
      light.shadow.camera.left = -20;
      light.shadow.camera.bottom = -20;
      light.shadow.camera.right = 20;
      light.shadow.camera.top = 20; 

      const planeGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
      const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x103010 });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.set(0, 0, -6);
      plane.receiveShadow = true;
      scene.add(plane);

      const boxWidth = 0.7;
      const boxHeight = 1.5;
      const boxDepth = 0.01;
      const cubeGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
      const geometry = new THREE.IcosahedronGeometry(.2); //new THREE.TetrahedronGeometry(0.2);
      const pyramid = new THREE.ConeGeometry(2, 1, 4, 1);

      //transparent sphere which is our floating "bin"
      const geoBin = new THREE.DodecahedronGeometry(.8)
      //THREE.SphereGeometry(.8,32,16)

      const transparentMaterial = new THREE.MeshPhongMaterial(
        { color: 0xFFA0FF, opacity: .1, transparent:true }
      )

      const geoBase = new THREE.IcosahedronGeometry(1.2)
      const homeBaseMaterial = new THREE.MeshPhongMaterial(
        { color: 0xFF00FF, opacity: .2, transparent:true }
      )

      const baseGeo = cubeGeometry;

      let initLabelsJSX = []; //we need JSX components so they register with React!!

      const material = new THREE.MeshPhongMaterial({color:0x003000});

      //each material is a new shader instance so use them sparingly
      const materials = [
        new THREE.MeshPhongMaterial(),
        new THREE.MeshPhongMaterial(),
      ];
      materials[0].color.setRGB(.5, 0, 0.25);
      materials[1].color.setRGB(0.25, 0, .5);

      function makeD4Instance(
        geoType,
        geometry,
        color,
        x,
        y,
        z,
        name,
        binNum,
        playerNum
      ) {
        const d4Group = new THREE.Group();

        if (geoType == "regularBin") {
          for (let i = 0; i < d12Vertices.length; i++) {
            const cube = new THREE.Mesh(geometry, materials[playerNum]);
            //cube.material.color.setHex(color);
            const [x2, y2, z2] = d12Vertices[i];
            cube.position.set(x2, y2, z2).multiplyScalar(0.2);
            cube.visible = false;
            cube.castShadow = true
            cube.receiveShadow = true
            d4Group.add(cube);
          }
          const sphere = new THREE.Mesh(geoBin,transparentMaterial)
          sphere.receiveShadow = true
          //sphere.castShadow = true
          d4Group.add(sphere)

        } else if (geoType == "homeBase") {
          //const cube = new THREE.Mesh(geometry, material);
          //cube.material.color.setHex(color);
          //cube.position.set(0, 0, 0);
          //cube.rotateZ(1.5)
          const sphere = new THREE.Mesh(geoBase,homeBaseMaterial)
          d4Group.add(sphere);
        }

        d4Group.position.set(x + 1, y, z);

        const elem = binNum;

        initLabelsJSX.push(
          <div
            key={"label" + binNum}
            ref={labelRefs[binNum]}
            id={"GPUbinNum" + binNum}
            onClick={(ev) => {
              dispatchGPUExecuteTurn(ev);
            }}
          >
            {stones[binNum]}
          </div>
        );

        scene.add(d4Group);

        return { cube: d4Group, elem };
      }

      if (gameToDisplay.boardConfig) {
        console.log("boardConfig exists");
      } else {
        console.log("no boardConfig");
      }

      const cubes = mancalaCubes();

      console.log(cubes[0]);
      setInitLabelsJSX(initLabelsJSX);

      function mancalaCubes() {
        let cubes = []; //not really cubes anymore - har har

        if (!gameToDisplay.boardConfig) return cubes; //should not happen

        //const stones = gameToDisplay.boardConfig.stones

        const p0bins = gameToDisplay.boardConfig.playerBins[0];
        let pos = 0;
        for (let i = p0bins[0]; i <= p0bins[1]; i++) {
          //i is binNum
          cubes.push(
            makeD4Instance(
              "regularBin",
              geometry,
              0xf000f0,
              2 * (pos - 3),
              1.4,
              -0.3,
              String(stones[i]),
              i,
              0
            )
          );
          pos++;
        }

        const p1bins = gameToDisplay.boardConfig.playerBins[1];
        pos = 0;
        for (let i = p1bins[0]; i <= p1bins[1]; i++) {
          //i is binNum
          cubes.push(
            makeD4Instance(
              "regularBin",
              geometry,
              0xf000f0,
              2 * (pos - 3),
              -1.4,
              0,
              String(stones[i]),
              i,
              1
            )
          );
          pos++;
        }

        const { homeBase } = gameToDisplayRef.current.boardConfig;
        const numBins = stones.length / 2;
        pos = 2 * -4;
        cubes.push(
          makeD4Instance(
            "homeBase",
            baseGeo,
            0xf000f0,
            pos,
            0,
            -0.15,
            -stones[homeBase[0]],
            homeBase[0]
          )
        );
        pos = 2 * 3;
        cubes.push(
          makeD4Instance(
            "homeBase",
            baseGeo,
            0xf000f0,
            pos,
            0,
            -0.15,
            -stones[homeBase[1]],
            homeBase[1]
          )
        );

        return cubes;
      }

      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();

      setGL({ renderer, camera, scene, cubes });
      setCanvasInitialized(true);
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
      const fps = 20
      const fpsInterval = 1000/fps
      let prevRenderTime = Date.now()
      const {homeBase} = gameToDisplayRef.current.boardConfig

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

          if (  !(binNum === homeBase[0] || binNum === homeBase[1]) ) {
            const speed = Math.min(8,stonesRef.current[binNum])*.5
            const rot = time * speed;
            cube.rotation.x = rot + idx;
            cube.rotation.y = time*idx*.1;
            //cube.rotation.z = rot/2;
                
            //the enclosing  spehere is the last child - so
            //always keep it visible
            const maxStones = cube.children.length-1
            const cappedActualStones = Math.min(maxStones,stonesRef.current[binNum])
            for (let i=0; i<cappedActualStones; i++) {
              cube.children[i].visible = true
            }
            for (let i=cappedActualStones; i<maxStones; i++) {
              cube.children[i].visible = false
            }
          }
          else {
            if (stonesRef.current[binNum] < 5) {
              cube.rotation.x = time * stonesRef.current[binNum]
            }
            else if (stonesRef.current[binNum] < 10) {
              cube.rotation.x = time * 5
              cube.rotation.y = time * (stonesRef.current[binNum]-5)
            }
          }

          // get the position of the center of the cube
          cube.updateWorldMatrix(true, false);
          cube.getWorldPosition(tempV);
    
          // get the normalized screen coordinate of that position
          // x and y will be in the -1 to +1 range with x = -1 being
          // on the left and y = -1 being on the bottom
          tempV.project(camera);
   
          // convert the normalized position to CSS coordinates
          // -1,1 to 0,num pixels
          const x = (tempV.x *  .5 + .5) * canvas.clientWidth;
          const y = (tempV.y * -.5 + .5) * canvas.clientHeight;
    
          //the key to getting the updated version of stones is to use
          //stonesRef which is maintained by useRef()!!!
          //can't escape the React life cycle - just accept it
          const labelRef = labelRefs[binNum]
          if (labelRef.current) {
            const sign = (binNum===homeBase[0]||binNum===homeBase[1])?-1:1
            labelRef.current.textContent = String(sign*stonesRef.current[binNum])
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