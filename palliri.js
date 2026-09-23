var scene;
var camera;
var renderer;
var plaza; // Guarda el modelo de la estatua
var controles;
var arrayMeteoros = []; // Arreglo para los clones 3D de meteoros

function init()
{
    scene = new THREE.Scene();
    
    // 1. FONDO DE AMBIENTE MINERO
    const canvasFondo = document.createElement('canvas');
    canvasFondo.width = 1;
    canvasFondo.height = 256;
    const ctx = canvasFondo.getContext('2d');
    const degradado = ctx.createLinearGradient(0, 0, 0, 256);
    
    degradado.addColorStop(0, '#0d0f12');   // Gris muy oscuro / casi negro
    degradado.addColorStop(0.6, '#1e252b');  // Gris acero / azulado
    degradado.addColorStop(1, '#4a2f13');    // Tono terracota / óxido
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, 1, 256);
    
    const texturaCielo = new THREE.CanvasTexture(canvasFondo);
    if (texturaCielo.colorSpace) {
        texturaCielo.colorSpace = THREE.SRGBColorSpace;
    } else if (texturaCielo.encoding) {
        texturaCielo.encoding = THREE.sRGBEncoding;
    }
    scene.background = texturaCielo;

    // 2. PARTÍCULAS TIPO CHISPAS O POLVO MINERAL
    const verticesChispas = [];
    for (let i = 0; i < 600; i++) {
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 50 + 10; 
        const z = (Math.random() - 0.5) * 60 - 20; 
        verticesChispas.push(x, y, z);
    }
    const geomChispas = new THREE.BufferGeometry();
    
    if (geomChispas.setAttribute) {
        geomChispas.setAttribute('position', new THREE.Float32BufferAttribute(verticesChispas, 3));
    } else if (geomChispas.addAttribute) {
        geomChispas.addAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesChispas), 3));
    }
    
    const matChispas = new THREE.PointsMaterial({
        color: 0xe0a96d,
        size: 0.15, 
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6
    });
    
    const puntosChispas = new THREE.Points(geomChispas, matChispas);
    scene.add(puntosChispas);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 5, 10);
    
    // 3. Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    
    if (renderer.outputColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (renderer.outputEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // 4. Controles interactivos
    controles = new THREE.OrbitControls(camera, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enableZoom = true;
    controles.enableRotate = true;
    controles.enablePan = true;
    controles.minDistance = 2;
    controles.maxDistance = 150;
    controles.maxPolarAngle = Math.PI / 2;
    
    // 5. Iluminación
    var ambientLight = new THREE.AmbientLight(0x4a433c, 1.5); 
    scene.add(ambientLight);
    
    var hemisphereLight = new THREE.HemisphereLight(0x3a4b5c, 0x241910, 1.0);
    hemisphereLight.position.set(0, 30, 0);
    scene.add(hemisphereLight);
    
    var directionalLight = new THREE.DirectionalLight(0xffcc80, 4.5); 
    directionalLight.position.set(20, 25, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; 
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);
    
    var directionalLight2 = new THREE.DirectionalLight(0x739cb3, 2.5); 
    directionalLight2.position.set(-25, 15, -20);
    scene.add(directionalLight2);

    var spotLight = new THREE.SpotLight(0xffe0b2, 5.0);
    spotLight.position.set(0, 40, 5);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.8;
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    // Captura de elementos del Loader HTML
    var loaderContainer = document.getElementById('loader-container');
    var progressBar = document.getElementById('progress-bar');
    var progressText = document.getElementById('progress-text');
    
    var cargar = new THREE.GLTFLoader();
    
    // 6. Carga del Modelo .GLB de la Palliri
    cargar.load("assets/Palliri.glb", 
        function(gltf)
        {
            plaza = gltf.scene;
            plaza.position.set(0, 0, 0);
            plaza.scale.set(4, 4, 4);
            
            plaza.traverse(function(obj)
            {
                if(obj.isMesh)
                {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                    if(obj.material)
                    {
                        obj.material.needsUpdate = true;
                        if(obj.material.roughness !== undefined) {
                            obj.material.roughness = Math.min(obj.material.roughness, 0.55);
                        }
                        if(obj.material.map)
                        {
                            obj.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        }
                    }
                }
            });
            scene.add(plaza);
            
            var box = new THREE.Box3().setFromObject(plaza);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            
            directionalLight.target = plaza;
            spotLight.target = plaza;
            spotLight.position.set(center.x, center.y + size.y * 1.6, center.z + 1);
            
            controles.target.set(center.x, center.y, center.z);
            camera.position.set(center.x, center.y + size.y * 0.4, center.z + size.z * 2.5);
            controles.update();
            
            setTimeout(function() {
                if (loaderContainer) loaderContainer.classList.add('loaded');
            }, 250);
        },
        function(xhr)
        {
            if (xhr.total > 0) {
                var porcentaje = Math.round((xhr.loaded / xhr.total) * 100);
                if (progressBar) progressBar.style.width = porcentaje + '%';
                if (progressText) progressText.innerText = porcentaje + '%';
            } else {
                if (progressText) progressText.innerText = "Cargando...";
            }
        },
        function(error)
        {
            console.log("Error cargando modelo:", error);
            if (progressText) progressText.innerText = "Error de carga";
        }
    );

    // 7. CARGA Y CLONACIÓN DE LOS METEOROS 3D
    cargar.load("assets/meteoro.glb", function(gltf) {
        var modeloMeteoro = gltf.scene;

        for (let i = 0; i < 40; i++) {
            var clon = modeloMeteoro.clone();
            
            // Posición aleatoria
            clon.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 60 + 10,
                (Math.random() - 0.5) * 100
            );
            
            // Rotación inicial aleatoria
            clon.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Tamaño/Escala aleatoria (puedes ajustar entre 0.3 y 1.5)
            var escala = Math.random() * 0.8 + 0.3;
            clon.scale.set(4.5, 4.5, 4.5);
            
            // Sombras
            clon.traverse(function(obj) {
                if(obj.isMesh) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                }
            });

            // Parámetros individuales de caída y rotación
            clon.userData = {
                velocidadCaida: Math.random() * 0.15 + 0.05,
                velRotacionX: (Math.random() - 0.5) * 0.05,
                velRotacionY: (Math.random() - 0.5) * 0.05,
                velRotacionZ: (Math.random() - 0.5) * 0.05
            };
            
            scene.add(clon);
            arrayMeteoros.push(clon);
        }
        console.log("Meteoros agregados correctamente a la Palliri");
    });
}

function animate()
{
    requestAnimationFrame(animate);
    
    // Rotación del modelo principal
    if(plaza) {
        plaza.rotation.y += 0.01;
    }

    // ANIMACIÓN DE LOS METEOROS 3D
    for (let i = 0; i < arrayMeteoros.length; i++) {
        let meteoro = arrayMeteoros[i];
        
        // Movimiento de caída
        meteoro.position.y -= meteoro.userData.velocidadCaida;
        
        // Rotaciones en los 3 ejes
        meteoro.rotation.x += meteoro.userData.velRotacionX;
        meteoro.rotation.y += meteoro.userData.velRotacionY;
        meteoro.rotation.z += meteoro.userData.velRotacionZ;
        
        // Reaparición en la parte superior cuando caen al fondo
        if (meteoro.position.y < -15) {
            meteoro.position.y = 60 + Math.random() * 20;
            meteoro.position.x = (Math.random() - 0.5) * 100;
            meteoro.position.z = (Math.random() - 0.5) * 100;
        }
    }

    controles.update();
    renderer.render(scene, camera);
}

window.addEventListener("resize", function()
    {
        if(camera) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        if(renderer) {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
);

init();
animate();

// --- ESTILOS DE BOTONES ACERO/MINA ---
const estilosBotones = document.createElement('style');
estilosBotones.innerHTML = `
    button, .interfaz-controles button {
        background: linear-gradient(135deg, #3a444d 0%, #222930 100%); 
        color: #e0dacf; 
        border: 2px solid #222930; 
        border-radius: 8px; 
        padding: 10px 20px;
        font-family: 'Montserrat', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        box-shadow: 0 4px 6px rgba(0,0,0,0.4); 
        position: relative;
        overflow: hidden;
    }

    button:hover {
        background: linear-gradient(135deg, #505c66 0%, #3a444d 100%);
        color: #f4eee1;
        box-shadow: 0 6px 12px rgba(0,0,0,0.6); 
        transform: translateY(-2px); 
    }

    button:active {
        background: linear-gradient(135deg, #191e23 0%, #0f1316 100%);
        transform: translateY(1px); 
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    }

    button:disabled {
        background: #5c636a;
        color: #b0b5b8;
        border: 1px solid #494f54;
        cursor: not-allowed;
        box-shadow: none;
    }
`;
document.head.appendChild(estilosBotones);