// ====================================================
// MODELO 3D Y ESCENA THREE.JS - MONUMENTO CÉSAR, GUILLERMO E ISAAC
// ====================================================

var scene;
var camera;
var renderer;
var plaza; // Guarda el modelo de César, Guillermo e Isaac
var controles;
var arrayMeteoros = []; // Arreglo para los meteoros 3D

// Reloj para controlar el parpadeo suave del outline
var clock = new THREE.Clock();

// Variables para Postprocessing (Outline)
var composer, renderPass, outlinePass;
var objetosSeleccionadosOutline = [];

function init()
{
    scene = new THREE.Scene();
    
    // 1. FONDO DE AMBIENTE MINERO COMPLEJO
    const canvasFondo = document.createElement('canvas');
    canvasFondo.width = 1;
    canvasFondo.height = 256;
    const ctx = canvasFondo.getContext('2d');
    const degradado = ctx.createLinearGradient(0, 0, 0, 256);
    
    degradado.addColorStop(0, '#0d0f12');   
    degradado.addColorStop(0.6, '#1e252b');  
    degradado.addColorStop(1, '#4a2f13');    
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, 1, 256);
    
    const texturaCielo = new THREE.CanvasTexture(canvasFondo);
    if (texturaCielo.colorSpace) {
        texturaCielo.colorSpace = THREE.SRGBColorSpace;
    } else if (texturaCielo.encoding) {
        texturaCielo.encoding = THREE.sRGBEncoding;
    }
    scene.background = texturaCielo;

    // 2. PARTÍCULAS EN SUSPENSIÓN
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

    // 3. Perspectiva de cámara
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 5, 10);
    
    // 4. Renderizador optimizado de Alta Exposición
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3; 
    
    if (renderer.outputColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (renderer.outputEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // --- Configuración de EffectComposer y OutlinePass ---
    composer = new THREE.EffectComposer(renderer);
    renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // OutlinePass con tono Bronce / Cobre apagado y parpadeante
    outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    outlinePass.visibleEdgeColor.set(0xd48837); // Tono Bronce / Cobre apagado
    outlinePass.hiddenEdgeColor.set(0x8c5319);  // Sombra Bronce oscuro
    outlinePass.edgeStrength = 3.5;              
    outlinePass.edgeGlow = 0.5;                  
    outlinePass.edgeThickness = 2.0;             
    composer.addPass(outlinePass);

    // 5. Controles de Órbita
    controles = new THREE.OrbitControls(camera, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enableZoom = true;
    controles.enableRotate = true;
    controles.enablePan = true;
    controles.minDistance = 2;
    controles.maxDistance = 150;
    controles.maxPolarAngle = Math.PI / 2; 
    
    // 6. Iluminación
    var ambientLight = new THREE.AmbientLight(0x3a3530, 0.8); 
    scene.add(ambientLight);
    
    var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x1a110a, 0.6);
    scene.add(hemisphereLight);
    
    var directionalLight = new THREE.DirectionalLight(0xffeebb, 2.0); 
    directionalLight.position.set(10, 25, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; 
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    var directionalLight2 = new THREE.DirectionalLight(0x567085, 1.2); 
    directionalLight2.position.set(-15, 15, -10);
    scene.add(directionalLight2);

    var spotLight = new THREE.SpotLight(0xffd180, 2.0);
    spotLight.position.set(0, 35, 10);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    var loaderContainer = document.getElementById('loader-container');
    var progressBar = document.getElementById('progress-bar');
    var progressText = document.getElementById('progress-text');
    
    var cargar = new THREE.GLTFLoader();
    
    // 7. Carga del Modelo .GLB de César
    cargar.load("assets/Cesar.glb", 
        function(gltf)
        {
            plaza = gltf.scene;
            plaza.position.set(0, 0, 0);
            plaza.scale.set(4.5, 4.5, 4.5); 
            
            plaza.traverse(function(obj)
            {
                if(obj.isMesh)
                {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                    if(obj.material)
                    {
                        obj.material.needsUpdate = true;
                        obj.material.roughness = 0.4; 
                        if(obj.material.map)
                        {
                            obj.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        }
                    }
                }
            });
            scene.add(plaza);
            
            // Añadir mallas del modelo de César al efecto Outline
            var meshesOutline = [];
            plaza.traverse(function(child) {
                if (child.isMesh) {
                    meshesOutline.push(child);
                }
            });
            outlinePass.selectedObjects = meshesOutline;
            
            var box = new THREE.Box3().setFromObject(plaza);
            var center = box.getCenter(new THREE.Vector3());
            
            var alturaBajar = center.y;
            controles.target.set(center.x, alturaBajar, center.z);
            
            // Posición de cámara cenital / vista desde arriba en picada
            camera.position.set(center.x, alturaBajar + 10, center.z + 8);
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

    // 8. CARGA Y CLONACIÓN DE LOS METEOROS 3D
    cargar.load("assets/meteoro.glb", function(gltf) {
        var modeloMeteoro = gltf.scene;

        for (let i = 0; i < 40; i++) {
            var clon = modeloMeteoro.clone();
            
            clon.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 60 + 10,
                (Math.random() - 0.5) * 100
            );
            
            clon.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            clon.scale.set(4.5, 4.5, 4.5);
            
            clon.traverse(function(obj) {
                if(obj.isMesh) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                }
            });

            clon.userData = {
                velocidadCaida: Math.random() * 0.15 + 0.05,
                velRotacionX: (Math.random() - 0.5) * 0.05,
                velRotacionY: (Math.random() - 0.5) * 0.05,
                velRotacionZ: (Math.random() - 0.5) * 0.05
            };
            
            scene.add(clon);
            arrayMeteoros.push(clon);
        }
    });
}

// 9. Ciclo de animación
function animate()
{
    requestAnimationFrame(animate);
    
    if(plaza) {
        plaza.rotation.y += 0.005; // Rotación suave continua
    }

    // Parpadeo y titileo suave del contorno tipo bronce mineral
    if (outlinePass) {
        var elapsedTime = clock.getElapsedTime();
        outlinePass.edgeStrength = 2.0 + Math.sin(elapsedTime * 4.0) * 1.8;
        outlinePass.edgeGlow = 0.4 + Math.sin(elapsedTime * 4.0) * 0.35;
    }

    // ANIMACIÓN DE LOS METEOROS 3D
    for (let i = 0; i < arrayMeteoros.length; i++) {
        let meteoro = arrayMeteoros[i];
        
        meteoro.position.y -= meteoro.userData.velocidadCaida;
        
        meteoro.rotation.x += meteoro.userData.velRotacionX;
        meteoro.rotation.y += meteoro.userData.velRotacionY;
        meteoro.rotation.z += meteoro.userData.velRotacionZ;
        
        if (meteoro.position.y < -15) {
            meteoro.position.y = 60 + Math.random() * 20;
            meteoro.position.x = (Math.random() - 0.5) * 100;
            meteoro.position.z = (Math.random() - 0.5) * 100;
        }
    }

    controles.update();
    
    // Renderizado a través del composer
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

// Responsividad del viewport
window.addEventListener("resize", function()
    {
        if(camera) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        if(renderer) {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        if(composer) {
            composer.setSize(window.innerWidth, window.innerHeight);
        }
    }
);

// Inicializar ejecución
init();
animate();

// --- INYECCIÓN DINÁMICA: ESTILOS DE BOTONES ACERO/MINA ---
const estilosBotones = document.createElement('style');
estilosBotones.innerHTML = `
    button, .interfaz-controles button {
        background: linear-gradient(135deg, #3a444d 0%, #222930 100%); 
        color: #e0dacf; 
        border: 2px solid #222930; 
        border-radius: 8px; 
        padding: 10px 20px;
        font-family: 'Montserrat', sans-serif;
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
`;
document.head.appendChild(estilosBotones);