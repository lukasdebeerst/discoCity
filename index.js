import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';

const main = () => {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas, alpha: true});
    const objects = [];
    renderer.autoClearColor = false;

    const loader = new THREE.TextureLoader();
    const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/bayer.png');
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.REpeatWrapping;

    const fragmentShader = `
    #include <common>
  
    uniform vec3 iResolution;
    uniform float iTime;
    uniform sampler2D iChannel0;
    uniform vec3 COLOR;
  
    // By Daedelus: https://www.shadertoy.com/user/Daedelus
    // license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
    #define TIMESCALE 0.25 
    #define TILES 8

    //#define COLOR 6.6, 24.5, 7.8
  
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = fragCoord.xy / iResolution.xy;
      uv.x *= iResolution.x / iResolution.y;
      
      vec4 noise = texture2D(iChannel0, floor(uv * float(TILES)) / float(TILES));
      float p = 1.0 - mod(noise.r + noise.g + noise.b + iTime * float(TIMESCALE), 1.0);
      p = min(max(p * 3.0 - 1.8, 0.1), 2.0);
      
      vec2 r = mod(uv * float(TILES), 1.0);
      r = vec2(pow(r.x - 0.5, 2.0), pow(r.y - 0.5, 2.0));
      p *= 1.0 - pow(min(1.0, 12.0 * dot(r, r)), 2.0);
      
      fragColor = vec4(COLOR, 1.0) * p;
    }
  
    varying vec2 vUv;
  
    void main() {
      mainImage(gl_FragColor, vUv * iResolution.xy);
    }
    `;

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `; 

    const uniforms =  {
        iTime: { value: 1 },
        iResolution:  { value: new THREE.Vector3(1, 1, 1,) },
        iChannel0: { value: texture},
        COLOR: {value: new THREE.Vector3(16.8, 5.0, 5.6)}
    };

    //creating a camera
    const fov = 40;
    const aspect = 2;
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;
    camera.position.y = 0.5;

    //creating a scene
    const scene = new THREE.Scene();

    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(1, 2, 4);
    scene.add(light);

    const generateColor = () => {
        //credits: https://stackoverflow.com/questions/23095637/how-do-you-get-random-rgb-in-javascript
        let o = Math.round, r = Math.random, s = 255;
        // return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
        return {
            r: o(r()*s)/10,
            g: o(r()*s)/10,
            b: o(r()*s)/10
        }
    }

    //creating a message
    const fontLoader = new THREE.FontLoader();
    fontLoader.load('./helvetiker_bold.typeface.json', (font) => {
        const text = 'scroll to move';  
        const textColor = 0x000000;
        const textGeometry = new THREE.TextBufferGeometry(text, {
            font: font,
            size: 0.1,  
            height: 0.2,  
            curveSegments: 12,  
            bevelEnabled: false,  
            bevelThickness: 0.15,  
            bevelSize: 0.22,  
            bevelSegments: 5,  
        });
        const textMaterial = new THREE.MeshPhongMaterial();
        textMaterial.color.set(0xffffff);
        const message = new THREE.Mesh(textGeometry, textMaterial);
        message.position.x = -0.4;
        message.position.y = 0.5;
        scene.add(message);
    });

    //creating a instance
    const makeInstance = (x, y, z) => {
        const color = generateColor();
        if(color){
            uniforms.COLOR.value = new THREE.Vector3(color.r, color.g, color.b);
        }

        //creating a box
        const boxWidth = 1;
        const boxHeight = Math.floor(Math.random() * (2 - 1 + 1) + 1);
        const boxDepth = 1;
        const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

        //creating a material
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
        });

        const building = new THREE.Mesh(geometry, material);
        scene.add(building);
        building.position.x = x;
        building.position.y = boxHeight/2;
        console.log(building.position.y);
        building.position.z = z;
        objects.push(building);
        return building;
    }

    let housePosition;
    let renderCounter = 0;

    for (let index = 0; index < 15; index = index + 1.5) {
        makeInstance(-1.5, 0, -index);
        makeInstance(1.5, 0, -index);
        housePosition = -index;
    }

    const renderNewHouse = () => {
        renderCounter++
        console.log(renderCounter);
        if(renderCounter === 10){
            makeInstance(-1.5, 0, housePosition - 1.5);
            makeInstance(1.5, 0, housePosition - 1.5);
            housePosition = housePosition - 1.5;
            renderCounter = 0;
        }
    }

    let scrollAction = 0;
    let cameraChangeValue = 0.1;
    canvas.addEventListener("wheel", e => {
        if (checkScrollDirectionIsDown(e)) {
            scrollAction++;
            if(scrollAction > 5){
                scrollAction = 0;
                camera.position.z = camera.position.z - cameraChangeValue;
                renderNewHouse()
            }
            
        } else {
            scrollAction++;
            if(scrollAction > 5){
                scrollAction = 0;
                camera.position.z = camera.position.z + cameraChangeValue;
            }
            
        }
    });

    const checkScrollDirectionIsDown = e  =>{
        if (e.wheelDelta) {
          return e.wheelDelta > 0;
        }
        return e.deltaY < 0;
      }

    const resizeRendererToDisplaySize = (renderer) => {
        const canvas = renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const width = canvas.clientWidth * pixelRatio | 0;
        const height = canvas.clientHeight * pixelRatio | 0;
        const needResize = canvas.width !== width || canvas.height !== height;
        if(needResize){
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

        // //creating street
        // let geometry = new THREE.PlaneGeometry(canvas.clientWidth, 6);
        // let material = new THREE.MeshBasicMaterial( {color: 0xb8b4b4, side: THREE.DoubleSide} );
        // let plane = new THREE.Mesh( geometry, material );
        // plane.rotation.x = -1;
        // plane.position.y = -1;
        // scene.add( plane );

    const render = (time) => {
        time *= 0.0001;

        if (resizeRendererToDisplaySize(renderer)){
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        uniforms.iTime.value = time;

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

}

main();