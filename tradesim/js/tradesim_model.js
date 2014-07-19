var canvasWidth = 1000;
var canvasHeight = 800;

var fpsMeter;
var rendererStats;

var scene;
var camera;
var renderer;

window.onload = function() {
	initGUI();
	initRenderer();
	initModel();
	frame();
}

function initGUI() {
	fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
}

/**
	THREE.js Functions
*/
function initRenderer() {
	scene = new THREE.Scene();
	
	camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 1000);				
	camera.position.x = 24;
	camera.position.y = 10;
	camera.position.z = 24;			
	camera.lookAt(new THREE.Vector3(0, 10, 0));
	
	var controls = new THREE.OrbitControls(camera, document.getElementById("canvas"));
	controls.target.y = 10;
	
	var ambientLight = new THREE.AmbientLight(0x404040);
	scene.add(ambientLight);
	
	var mainLight = new THREE.PointLight();
	mainLight.position.set(50, 150, 150);
	scene.add(mainLight);
	
	renderer = new THREE.WebGLRenderer();			
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor(0xffffff, 1);
	document.getElementById("canvas").appendChild(renderer.domElement);
}

function initModel() {
}

function frame() {
	fpsMeter.tickStart();

	update();
	render();
	
	fpsMeter.tick();
	
	requestAnimationFrame(frame);
}

function update() {
}

function render() {
	renderer.render(scene, camera);
}

function timestamp() {
	if (window.performance && window.performance.now) {
		return window.performance.now();
	}
	else {
		return new Date().getTime();
	}
}