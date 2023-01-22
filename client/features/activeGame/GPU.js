import React, { useState, useEffect, useRef} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { d12Vertices, d20Vertices } from "./geometry"

//https://r105.threejsfundamentals.org/threejs/lessons/threejs-align-html-elements-to-3d.html
//let cubes = []
//let isRendering = false
let count = 0  //useRef() replaces all this kind of stuff

function setShadow(light) {
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 1000;

  //have to set the range of the orthographic shadow camera
  //to cover the whole plane we are casting shadows onto
  //defaults are -5 to 5
  light.shadow.camera.left = -20;
  light.shadow.camera.bottom = -20;
  light.shadow.camera.right = 20;
  light.shadow.camera.top = 20;
}

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
    const {gameState} = gameToDisplayRef.current
    const myBins = gameToDisplayRef.current.boardConfig.playerBins[playerNumRef.current]
    dispatchExecuteTurn( ev, gameToDisplayRef.current, myTurnRef.current, myBins )
  }

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

  // the MAIN useEffect - probably need to chop it up/refactor yeah yeah 
  useEffect(() => {

    const stones = gameToDisplay.boardConfig.stones

    stonesRef.current = stones

    if (canvasRef.current && !canvasInitialized) {

      const canvas = canvasRef.current;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha:true });

      renderer.setSize(window.innerWidth, window.innerHeight / heightMult);
      renderer.setClearColor("white", 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap

      //all of the tonemappings just dull the colors - at least in this case
      //renderer.toneMapping = THREE.ACESFilmicToneMapping //THREE.CineonToneMapping //THREE.ReinhardToneMapping //THREE.ACESFilmicToneMapping
      //renderer.toneMappingExposure = 2

      canvas.appendChild(renderer.domElement);

      const fov = 50;
      const aspect = window.innerWidth / window.innerHeight; // the canvas default
      const near = 0.1;
      const far = 1000;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

      //OrbitControls were not playing nicely with how I actually wanted to set the camera positions
      //const controls = new OrbitControls(camera, canvas);
      //controls.target.set(0, 0, 0);
      //controls.update();

      const scene = new THREE.Scene();

      const color = 0xffffff;
      const intensity = 1.4;
      const light2 = new THREE.PointLight(color, intensity);
      setShadow(light2)
      scene.add(camera);
      //super cool - light source now emanates from camera!
      camera.add(light2);

      const light3 = new THREE.DirectionalLight(0xFFFF00, .5)
      setShadow(light3)
      scene.add(light3)

      const light4 = new THREE.DirectionalLight(0xFFFF00, .5)
      setShadow(light4)
      scene.add(light4)

      const light = new THREE.DirectionalLight(0x00FFFF, 1.2);
      light.position.set(0, 0, 1); 
      setShadow(light)
      scene.add(light);

      const planeGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
      const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x003010, shininess:40 });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.set(0, 0, -3);
      plane.receiveShadow = true;
      scene.add(plane);

      const d20 = new THREE.IcosahedronGeometry(.2); 
      const geometry = new THREE.IcosahedronGeometry(.2);    
      //transparent d12 which is our floating "bin"
      const geoBin = new THREE.DodecahedronGeometry(.8)

      //const pyramid = new THREE.ConeGeometry(2, 1, 4, 1);
      //THREE.SphereGeometry(.8,32,16)

      const transparentMaterial = new THREE.MeshPhongMaterial(
        { color: "rgb(60,40,150)", opacity: .5, transparent:true, shininess:800 }
      )

      const geoBase = new THREE.IcosahedronGeometry(1.1)
      const homeBaseMaterial = new THREE.MeshPhongMaterial(
        { color: "rgb(60,40,100)", opacity: .8, transparent:true }
        //{ color: 0xF000FF, wireframe:true }
      )

      const baseGeo = geoBase;

      let initLabelsJSX = []; //we need JSX components so they register with React!!

      const material = new THREE.MeshPhongMaterial({color:0x003000});

      //each material is a new shader instance so use them sparingly
      const materials = [
        new THREE.MeshPhongMaterial({shininess:1000}),
        new THREE.MeshPhongMaterial({shininess:1000}),
      ];
      materials[0].color.setRGB(.55, 0, 0.4);
      materials[1].color.setRGB(0.3, 0, .55);

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
            const cube = new THREE.Mesh(d20, materials[playerNum]);
            //cube.material.color.setHex(color);
            const [x2, y2, z2] = d12Vertices[i];
            cube.position.set(x2, y2, z2).multiplyScalar(0.2);
            cube.visible = false;
            cube.castShadow = true
            cube.receiveShadow = true
            d4Group.add(cube);
          }
          const sphere = new THREE.Mesh(geoBin,transparentMaterial)
          d4Group.add(sphere)

        } else if (geoType == "homeBase") {

          for (let i=0; i<d20Vertices.length; i++) {
            const cube = new THREE.Mesh(d20, materials[playerNum])
            const [x2,y2,z2] = d20Vertices[i]
            cube.position.set(x2,y2,z2).multiplyScalar(.54)
            cube.castShadow=true
            cube.receiveShadow=true
            cube.visible = false
            d4Group.add(cube)
          }
          //this is NOT a mistake, making 2 layers to be displayed
          //going in order from outside to inside
          for  (let i=0; i<d20Vertices.length; i++) {
            const cube2 = new THREE.Mesh(d20, materials[playerNum])
            const [x3,y3,z3] = d20Vertices[i]
            cube2.position.set(x3,y3,z3).multiplyScalar(.2)
            cube2.castShadow=true
            cube2.receiveShadow=true
            cube2.visible = false
            d4Group.add(cube2)
          } 
          const sphere = new THREE.Mesh(geoBase,homeBaseMaterial)
          sphere.castShadow = true
          sphere.receiveShadow = true
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
              1.8,
              0,
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
              -1.8,
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
            0,
            -stones[homeBase[0]],
            homeBase[0],
            0
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
            0,
            -stones[homeBase[1]],
            homeBase[1],
            1
          )
        );

        return cubes;
      }

      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();

      setGL({ renderer, camera, scene, cubes, light2, light3, light4 });
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

      const {renderer,camera,scene,cubes,light2, light3,light4} = GL

      if (playerNumRef.current === 1 ) {
        camera.position.set(0,-3.5,4.5)
        camera.lookAt(0,-1,.5)
      }
      else {
        camera.position.set(0,3.5,4.5)
        camera.lookAt(0,1,.5)
        camera.rotateZ(Math.PI)
      }

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

        //move the lights so the shadows move - why? because that's why
        const [dx,dy] = [7*Math.cos(time/2), 5*Math.sin(time/3)]
        light3.position.set(2+dx,3+dy,5)
        light4.position.set(-2-dx,-3-dy,5)

        light2.intensity = Math.max(1.5,.8 + Math.sin(time))

        prevRenderTime = currentRenderTime - (elapsed%fpsInterval)

        cubes.forEach((cubeInfo, idx) => {
          const { cube, elem } = cubeInfo;
          const binNum = elem;

          if (!(binNum === homeBase[0] || binNum === homeBase[1])) {
            const speed = Math.min(8, stonesRef.current[binNum]) * 0.5;
            const rot = time * speed;
            cube.rotation.x = rot + idx;
            cube.rotation.y =
              stonesRef.current[binNum] === 0 ? 0 : time * idx * 0.1;
            //cube.rotation.z = rot/2;
          } else {
            cube.rotation.y =
              0.1 * time * Math.min(25, stonesRef.current[binNum]);
          }

          //the enclosing cage is the last child - so
          //always keep it visible by ignoring it here
          const maxStones = cube.children.length - 1;

          const cappedActualStones = Math.min(
            maxStones,
            stonesRef.current[binNum]
          );
          for (let i = 0; i < cappedActualStones; i++) {
            cube.children[i].visible = true;
          }
          for (let i = cappedActualStones; i < maxStones; i++) {
            cube.children[i].visible = false;
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
          const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
          const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

          //the key to getting the updated version of stones is to use
          //stonesRef which is maintained by useRef()!!!
          //can't escape the React life cycle - just accept it
          const labelRef = labelRefs[binNum];
          if (labelRef.current) {
            const sign =
              binNum === homeBase[0] || binNum === homeBase[1] ? -1 : 1;
            labelRef.current.textContent = String(
              sign * stonesRef.current[binNum]
            );
            //numbers are a little choppy put in some smoothing
            labelRef.current.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
            labelRef.current.style.zIndex =
              ((-tempV.z * 0.5 + 0.5) * 100000) | 0;
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