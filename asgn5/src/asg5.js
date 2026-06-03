import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from'three/addons/controls/OrbitControls.js';

function main(){
    
    let cupcake = null;
    let lightsOn = true;

    const LIGHT_BRIGHT = {
        directional: 0.7,
        ambient: 0.1,
        point: 8
    };

    const LIGHT_DIM = {
        directional: 0.1,
        ambient: 0.02,
        point: 1
    };
    
    const canvas =
    document.querySelector('#c');
    
    const renderer =
    new THREE.WebGLRenderer({
        antialias:true,
        canvas
    });
    
    
    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
    
    
    const fov=75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = .1;
    const far=100;
    
    const camera=
    new THREE.PerspectiveCamera(
        fov,
        aspect,
        near,
        far
    );
    const scene = new THREE.Scene();
    
    const bgLoader = new THREE.TextureLoader();
    const bgTexture = bgLoader.load('../imgs/fnaf_background.webp');
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgTexture;
    
    camera.position.z=6;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0,1,0);
    controls.update();
    
    const buttonGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1);
    
    const buttonMat = new THREE.MeshPhongMaterial({
        color: 0x222222,
        emissive: 0xff0000,
        emissiveIntensity: 3
    });
    
    const lightButton3D = new THREE.Mesh(buttonGeo, buttonMat);
    
    lightButton3D.position.set(-5.85, 3.0, 0);
    lightButton3D.rotation.y = Math.PI / 2;
    scene.add(lightButton3D);
    
    
    // light
    const color=0xffffff;
    const intensity=0.7;
    
    const light=
    new THREE.DirectionalLight(
        color,
        intensity
    );
    
    light.position.set(-1,2,4);
    
    scene.add(light);
    
    //ambient light
    const ambientLight = new THREE.AmbientLight(
        0xffffff,
        0.1
    );
    scene.add(ambientLight);          

    //point light
    
    const pointLight = new THREE.PointLight(
        0xff3300,
        8,
        8
    );
    pointLight.position.set(
        0,
        0,
        -3
    );
    
    scene.add(pointLight);
    
    const sceneLights = [light, ambientLight, pointLight];
    
    // cube geometry
    const geometry=
    new THREE.BoxGeometry(
        1,1,1
    );
    
    const loader=
    new THREE.TextureLoader();
    
    const checkerTexture = 
    loader.load(
        '../imgs/check_fnaf.png'
    );
    
    checkerTexture.colorSpace = 
    THREE.SRGBColorSpace;
    
    const floorTexture = 
    loader.load(
        '../imgs/check_fnaf.png'
    );
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;

    floorTexture.repeat.set(6,6);

    //poster code
    const posterTexture = 
    loader.load(
        '../imgs/fnaf_poster.jpg'
    );

    posterTexture.colorSpace = 
    THREE.SRGBColorSpace;
    const posterMaterial = new THREE.MeshPhongMaterial({
        map: posterTexture
    });

    const posterGeo = new THREE.PlaneGeometry(2, 3);

    const posterMesh = new THREE.Mesh(posterGeo, posterMaterial);

    // position it on a wall
    posterMesh.position.set(-2, 6, -5.8);
    posterMesh.scale.set(1.5, 1.5, 1);
    

    scene.add(posterMesh);

    const artworks = [
        { file: 'art1.webp', pos: [0.4, 5.4, -5.8]},
        { file: 'art2.jpg', pos: [2.8, 5, -5.8]},
        { file: 'art3.jpg', pos: [2.5, 6.7, -5.8]},
        { file: 'art4.jpg', pos: [3.9, 6, -5.8]},
        { file: 'art5.jpg', pos: [1.45, 6.3, -5.8]},
        { file: 'art6.jpg', pos: [2, 4.4, -5.8]},
    ];

    artworks.forEach((art) => {
        const tex = loader.load(`../imgs/${art.file}`);
        tex.colorSpace = THREE.SRGBColorSpace;

        const mat = new THREE.MeshPhongMaterial({ map: tex });

        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 3),
            mat
        );

        mesh.scale.set(0.5, 0.5, 1);
        mesh.position.set(...art.pos);
        scene.add(mesh);
    });

    function makeInstance(
        geometry,
        color,
        x,
        texture = null
    ){

        const material=
        new THREE.MeshPhongMaterial({
            color,
            map: texture
        });

        const cube=
        new THREE.Mesh(
            geometry,
            material
        );

        scene.add(cube);

        cube.position.x=x;

        return cube;
    }

   
    const gltfLoader =  
    new GLTFLoader();
    //freddy model
    gltfLoader.load(
        '../models/source/spinofan_freddy_plush (1).glb',
        function(gltf){
            const freddy = 
            gltf.scene;

            freddy.scale.set(
                0.2,
                0.2,
                0.2
            );
            freddy.position.set(
                0,
                2,
                -3
            );
            scene.add(freddy);
        },
        undefined,
        
        function(error){
            console.error(error);
        }
        
    );

    //desk
    gltfLoader.load(
        '../models/source/fnaf_1_office_-_desk.glb',
        function(gltf){
            const deskModel = gltf.scene;

            deskModel.scale.set(
                1,
                1,
                1
            );

            deskModel.position.set(
                0,
                2,
                -4
            );
            scene.add(deskModel);
        },
        undefined,

        function(error){
            console.error(error);
        }
    );

    //monitors
    gltfLoader.load(
        '../models/source/monitors_fnaf_1.glb',
        function(gltf){
            const monitorModel = gltf.scene;

            monitorModel.scale.set(
                .0055,
                .0055,
                .0055
            );

            monitorModel.position.set(
                -2.5,
                3.3,
                -5
            );
            scene.add(monitorModel);
        },
        undefined,

        function(error){
            console.error(error);
        }
    );

    //cupcake
    gltfLoader.load(
        '../models/source/mr._cupcake.glb',
        function(gltf){
            cupcake = gltf.scene;

            cupcake.scale.set(
                .35,
                .35,
                .35
            );

            cupcake.position.set(
                3.7,
                4.2,
                -5
            );
            scene.add(cupcake);
        },
        undefined,

        function(error){
            console.error(error);
        }
    );


    //--floor -------------------------
    const floorGeo = new THREE.BoxGeometry(
        12,
        0.2,
        12
    );
    const floorMat = new THREE.MeshPhongMaterial({
        map: floorTexture
    });
    const floor = new THREE.Mesh(
        floorGeo,
        floorMat
    );
    floor.position.y = -1.5;
    scene.add(floor);

    //--wall--------------------------
    
    const wallMat = new THREE.MeshPhongMaterial({
        color: 0x2b2b2b
    });
    const backWall = new THREE.Mesh( 
        new THREE.BoxGeometry(12, 10, 0.2),
        wallMat
    );

    backWall.position.set(0, 3.5, -6);
    scene.add(backWall);

    const leftWall = new THREE.Mesh( 
        new THREE.BoxGeometry(0.2, 10, 12),
        wallMat
    );
    leftWall.position.set(-6, 3.5, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh( 
        new THREE.BoxGeometry(0.2, 10, 12),
        wallMat
    );
    rightWall.position.set(6, 3.6, 0);
    scene.add(rightWall);

    //wall checker
    const wallStripeTexture =
    loader.load('../imgs/check_fnaf.png');

    wallStripeTexture.colorSpace =
    THREE.SRGBColorSpace;

    wallStripeTexture.wrapS =
    THREE.RepeatWrapping;

    wallStripeTexture.wrapT =
    THREE.RepeatWrapping;

    wallStripeTexture.repeat.set(8, 1);

    const stripeMat =
    new THREE.MeshPhongMaterial({
        map: wallStripeTexture
    });

    // back wall stripe
    const backStripe =
    new THREE.Mesh(
        new THREE.BoxGeometry(12, 1, 0.05),
        stripeMat
    );

    backStripe.position.set(0, 3, -5.85);
    scene.add(backStripe);

    // left wall stripe
    const leftStripe =
    new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1, 12),
        stripeMat
    );

    leftStripe.position.set(-5.85, 3, 0);
    scene.add(leftStripe);

    // right wall stripe
    const rightStripe =
    new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1, 12),
        stripeMat
    );

    rightStripe.position.set(5.85, 3, 0);
    scene.add(rightStripe);
    
    //--red stripes on left wall------------------------

    const topRedLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.15, 12),
    new THREE.MeshPhongMaterial({
        color: 0x6b2d1a
        })
    );

    topRedLeft.position.set(
        -5.9,
        3.6,
        0
    );

    scene.add(topRedLeft);


    const bottomRedLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.15, 12),
    new THREE.MeshPhongMaterial({
        color: 0x6b2d1a
        })
    );

    bottomRedLeft.position.set(
        -5.9,
        2.41,
        0
    );
    scene.add(bottomRedLeft);

 //--red stripes on right wall------------------------
    const topRedRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.15, 12),
    new THREE.MeshPhongMaterial({
        color: 0x6b2d1a
        })
    );

    topRedRight.position.set(
        5.9,
        3.6,
        0
    );
    scene.add(topRedRight);

    const bottomRedRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.15, 12),
        new THREE.MeshPhongMaterial({
            color: 0x6b2d1a
        })
    );

    bottomRedRight.position.set(
        5.9,
        2.41,
        0
    );
    scene.add(bottomRedRight);

     //--red stripes on back wall------------------------
    const topRedBack = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.15, 0.05),
    new THREE.MeshPhongMaterial({
        color: 0x6b2d1a
        })
    );

    topRedBack.position.set(
        0,
        3.6,
        -5.9
    );
    scene.add(topRedBack);

    const bottomRedBack = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.15, 0.05),
    new THREE.MeshPhongMaterial({
        color: 0x6b2d1a
        })
    );

    bottomRedBack.position.set(
        0,
        2.41,
        -5.9
    );

    scene.add(bottomRedBack);

    //chair

    const chair = new THREE.Group();
    //seat
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.19, 1.5),
        new THREE.MeshPhongMaterial({
            color: 0x111111
        })
    );

    seat.position.set(0, 0.78, 0);
    chair.add(seat);

    //back
    const backrest = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.35, 0.2),
        new THREE.MeshPhongMaterial({
                color: 0x111111
            })
        
    );

    backrest.position.set(0, 1.7, -0.65);
    chair.add(backrest);
    
    //back pole
    const backPole = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.9, 0.15),
        new THREE.MeshPhongMaterial({
            color: 0x222222
        })


    );

    backPole.position.set(0, 1.2, -0.7);
    chair.add(backPole);
                
    //main pole
    const centerPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.085, 1),
        new THREE.MeshPhongMaterial({
            color: 0x222222
        })
        
    );

    centerPole.position.set(0, 0.3, 0);
    chair.add(centerPole);

    //chair base
    const base = new THREE.Group();

    const spokeGeometry = new THREE.BoxGeometry(1.3, 0.08, 0.17);
    const spokeMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

    // 4 spokes = cross
    for (let i = 0; i < 2; i++) {
        const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);

        spoke.position.set(0, -0.15, 0);
        spoke.rotation.y = i * (Math.PI / 2); 

        base.add(spoke);
    }

    chair.add(base);

    

    //wheels
    for (let i = 0; i < 4; i++) {

        const angle = i * (Math.PI * 2 / 4); 

        const wheel = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 16, 16),
            new THREE.MeshPhongMaterial({
                color: 0x444444
            })
            
        );

        wheel.position.set(
            Math.cos(angle) * 0.6,
            -0.25,
            Math.sin(angle) * 0.6
        );

        chair.add(wheel);
        wheel.scale.set(1, 0.5, 1);
    }

    backrest.scale.set(1.1, 1.3, 1);

    backrest.position.set(
        0,
        2.0,
        -0.65
    );
    chair.rotation.y = Math.PI * 0.75;

    chair.position.set(
        1.5,
        -0.9,
        -1.4
    );
    
    scene.add(chair);
    chair.scale.set(1.5, 1.5, 1.5);
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    
    let target = {
        directional: 0.7,
        ambient: 0.1,
        point: 8
    };

    function toggleLights() {
        lightsOn = !lightsOn;

        target = lightsOn ? LIGHT_BRIGHT : LIGHT_DIM;

        renderer.toneMappingExposure = lightsOn ? 1 : 0.4;

        // button feedback
        if (lightsOn) {
            lightButton3D.material.emissive.setHex(0x222222);
            lightButton3D.material.emissiveIntensity = 0.3;
            lightButton3D.material.color.set(0xdddddd);
        } else {
            lightButton3D.material.emissive.setHex(0xff0000);
            lightButton3D.material.emissiveIntensity = 2;
            lightButton3D.material.color.set(0x111111);
        }
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();


    window.addEventListener("click", (event) => {

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        if (raycaster.intersectObject(lightButton3D).length > 0) {
            toggleLights();
        }
    });


    
    function render(time){
        
        time*=0.001;
        pointLight.intensity = lerp(pointLight.intensity, target.point, 0.05);
        
        controls.update();
        
        raycaster.setFromCamera(mouse, camera);
        const hover = raycaster.intersectObject(lightButton3D);
    
        if (hover.length > 0) {
            lightButton3D.material.emissiveIntensity = lightsOn ? 3 : 4;
        } else {
            lightButton3D.material.emissiveIntensity = lightsOn ? 0.5 : 2;
        }

        light.intensity = lerp(light.intensity, target.directional, 0.05);
        ambientLight.intensity = lerp(ambientLight.intensity, target.ambient, 0.05);
        

        renderer.render(
            scene,
            camera
        );
        
                
        if (cupcake) {
            cupcake.rotation.y += 0.01;
        }
        requestAnimationFrame(
            render
        );
    }

    requestAnimationFrame(
        render
    );

    
}

main();