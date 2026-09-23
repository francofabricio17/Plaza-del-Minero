var scene;
var camera;
var renderer;
var plaza; 
var casco; 
var controles;
var mixer; 
var reloj = new THREE.Clock(); 
var puntosRocas; 
var arrayMeteoros = []; // Arreglo para los clones 3D de meteoros

function init() {
    scene = new THREE.Scene();
    
    // FONDO DE AMBIENTE
    const canvasFondo = document.createElement('canvas');
    canvasFondo.width = 1;
    canvasFondo.height = 256;
    const ctx = canvasFondo.getContext('2d');
    const degradado = ctx.createLinearGradient(0, 0, 0, 256);
    
    degradado.addColorStop(0, '#0a0b0d');   
    degradado.addColorStop(0.6, '#181d22');  
    degradado.addColorStop(1, '#3b2210');    
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, 1, 256);
    
    const texturaCielo = new THREE.CanvasTexture(canvasFondo);
    if (texturaCielo.colorSpace) texturaCielo.colorSpace = THREE.SRGBColorSpace;
    else if (texturaCielo.encoding) texturaCielo.encoding = THREE.sRGBEncoding;
    scene.background = texturaCielo;

    // EFECTO METEORITOS / ROCAS DE MINA (PUNTOS)
    const verticesRocas = [];
    for (let i = 0; i < 200; i++) {
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 60; 
        const z = (Math.random() - 0.5) * 80 - 10; 
        verticesRocas.push(x, y, z);
    }
    const geomRocas = new THREE.BufferGeometry();
    
    if (geomRocas.setAttribute) {
        geomRocas.setAttribute('position', new THREE.Float32BufferAttribute(verticesRocas, 3));
    } else if (geomRocas.addAttribute) {
        geomRocas.addAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesRocas), 3));
    }
    
    const matRocas = new THREE.PointsMaterial({
        color: 0xc47b3f, 
        size: 0.4, 
        sizeAttenuation: true, 
        transparent: true, 
        opacity: 0.85
    });
    puntosRocas = new THREE.Points(geomRocas, matRocas);
    scene.add(puntosRocas);

    // CÁMARA
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 5, 10);
    
    // RENDERIZADOR
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9; // Ajustado para evitar el brillo excesivo
    
    if (renderer.outputColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if (renderer.outputEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.getElementById('webgl-container').appendChild(renderer.domElement);
    
    // CONTROLES
    controles = new THREE.OrbitControls(camera, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.minDistance = 2;
    controles.maxDistance = 150;
    controles.maxPolarAngle = Math.PI / 2; 
    
    // ILUMINACIÓN (Ajustada)
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);
    
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); 
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; 
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    var directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4); 
    directionalLight2.position.set(-15, 10, -10);
    scene.add(directionalLight2);

    var spotLight = new THREE.SpotLight(0xffffff, 0.8);
    spotLight.position.set(0, 40, 5);
    spotLight.angle = Math.PI / 4;
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    var loaderContainer = document.getElementById('loader-container');
    var progressBar = document.getElementById('progress-bar');
    var progressText = document.getElementById('progress-text');
    
    // CARGADOR DE MODELOS GLTF
    var cargar = new THREE.GLTFLoader();
    
    // 1. CARGA DEL MODELO PRINCIPAL (MINERO)
    cargar.load("assets/Mineromovi.glb",
        function(gltf) {
            plaza = gltf.scene;
            plaza.position.set(0, 0, 0);
            plaza.scale.set(8, 8, 8); 
            
            plaza.traverse(function(obj) {
                if(obj.isMesh) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                    if(obj.material) {
                        obj.material.needsUpdate = true;
                        obj.material.roughness = 0.4; 
                    }
                }
            });
            scene.add(plaza);

            // ANIMACIÓN DE ESQUELETO/PERSONAJE
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(plaza);
                gltf.animations.forEach(function(clip) {
                    mixer.clipAction(clip).play();
                });
            }
            
            var box = new THREE.Box3().setFromObject(plaza);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            
            directionalLight.target = plaza;
            spotLight.target = plaza;
            spotLight.position.set(center.x, center.y + size.y * 1.5, center.z + 1);
            
            // POSICIÓN DE LA CÁMARA
            var moverDerecha = 7.5; 
            var moverAbajo = 4.4; 
            var alejarCamara = 10; 

            controles.target.set(
                center.x - moverDerecha, 
                center.y + moverAbajo, 
                center.z
            );

            camera.position.set(
                center.x - moverDerecha, 
                center.y + 4 + moverAbajo, 
                center.z + alejarCamara
            ); 

            controles.update();
            
            setTimeout(function() {
                if (loaderContainer) loaderContainer.classList.add('loaded');
            }, 250);
        },
        function(xhr) {
            if (xhr.total > 0) {
                var porcentaje = Math.round((xhr.loaded / xhr.total) * 100);
                if (progressBar) progressBar.style.width = porcentaje + '%';
                if (progressText) progressText.innerText = porcentaje + '%';
            }
        },
        function(error) {
            console.error("Error cargando el modelo 3D:", error);
            if (progressText) {
                progressText.innerText = "Error: Modelo no encontrado";
                progressText.style.color = "#ff6b6b"; 
            }
            
            setTimeout(function() {
                if (loaderContainer) loaderContainer.classList.add('loaded');
            }, 1500); 
        }
    );

    // 2. CARGA DEL CASCO
    cargar.load("assets/casco.glb", function(gltf) {
        casco = gltf.scene;

        casco.position.set(-18, -0.3, 2);
        casco.scale.set(3, 3, 3);
        casco.rotation.set(0.5, Math.PI / 4, 0);

        casco.traverse(function(obj) {
            if(obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });

        scene.add(casco);
        console.log("Casco cargado");
    });

    // 3. CARGA Y CLONACIÓN DE LOS METEOROS 3D
    cargar.load("assets/meteoro.glb", function(gltf) {
        var modeloMeteoro = gltf.scene;

        for (let i = 0; i < 40; i++) {
            var clon = modeloMeteoro.clone();
            
            // Posición aleatoria inicial
            clon.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 60 + 10,
                (Math.random() - 0.5) * 100
            );
            
            // Rotación aleatoria inicial
            clon.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Escala aleatoria
            var escala = Math.random() * 1.5 + 0.5;
            clon.scale.set(5, 5, 5);
            
            // Sombras
            clon.traverse(function(obj) {
                if(obj.isMesh) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                }
            });

            // Propiedades de animación independientes
            clon.userData = {
                velocidadCaida: Math.random() * 0.15 + 0.05,
                velRotacionX: (Math.random() - 0.5) * 0.05,
                velRotacionY: (Math.random() - 0.5) * 0.05,
                velRotacionZ: (Math.random() - 0.5) * 0.05
            };
            
            scene.add(clon);
            arrayMeteoros.push(clon);
        }
        console.log("Meteoros clonados cargados");
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    var delta = reloj.getDelta();
    if (mixer) {
        mixer.update(delta);
    }

    // ANIMACIÓN DE ROCAS / PUNTOS DE FONDO
    if (puntosRocas) {
        const posiciones = puntosRocas.geometry.attributes.position.array;
        for (let i = 1; i < posiciones.length; i += 3) {
            posiciones[i] += 0.015;
            if (posiciones[i] > 30) {
                posiciones[i] = -30;
            }
        }
        puntosRocas.geometry.attributes.position.needsUpdate = true;
        puntosRocas.rotation.y += 0.0005;
    }

    // ANIMACIÓN DE LOS METEOROS 3D CLONADOS
    for (let i = 0; i < arrayMeteoros.length; i++) {
        let meteoro = arrayMeteoros[i];
        
        // Caída
        meteoro.position.y -= meteoro.userData.velocidadCaida;
        
        // Rotación
        meteoro.rotation.x += meteoro.userData.velRotacionX;
        meteoro.rotation.y += meteoro.userData.velRotacionY;
        meteoro.rotation.z += meteoro.userData.velRotacionZ;
        
        // Bucle continuo cuando caen al fondo
        if (meteoro.position.y < -15) {
            meteoro.position.y = 60 + Math.random() * 20;
            meteoro.position.x = (Math.random() - 0.5) * 100;
            meteoro.position.z = (Math.random() - 0.5) * 100;
        }
    }

    controles.update();
    renderer.render(scene, camera);
}

window.addEventListener("resize", function() {
    if(camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    if(renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

init();
animate();