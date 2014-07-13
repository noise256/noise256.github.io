window.onload = function() {
	main();
}

function main() {
	createScene();
	initSPPModel();
	frame();
}

var canvasWidth = 1000;
var canvasHeight = 800;

var origin = vec3.fromValues(0, 10, 0);

/**
	FPS Meter
*/
var fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
var now;
var dt = 0;
var last = timestamp();
var step = 1/60;

/**
	THREE.js Objects 
*/
var scene;
var renderer;
var camera;
var controls;

var ambientLight;
var mainLight;

/**
	SPP Variables.
*/
var sppParams = {
	repulseStr: 5,
	repulseRange: 10,
	alignStr: 10,
	alignRange: 5,
	attractStr: 5,
	attractRange: 5,
	walkStr: 5,
	acceleration: 0.01,
	maxVelocity: 0.1,
	gravity: false
};

var maxParticles = 400;

var randWalkLUSize = 1000;

var randWalkLU = [];

var particleSystem;

/**
	DAT.GUI Sliders.
*/
var gui = new dat.GUI({height: 8 * 32 - 1});

gui.add(sppParams, 'repulseStr').min(0).max(10).step(0.1);
gui.add(sppParams, 'repulseRange').min(0).max(10).step(0.1);
gui.add(sppParams, 'alignStr').min(0).max(10).step(0.1);
gui.add(sppParams, 'alignRange').min(0).max(10).step(0.1);
gui.add(sppParams, 'attractStr').min(0).max(10).step(0.1);
gui.add(sppParams, 'attractRange').min(0).max(10).step(0.1);
gui.add(sppParams, 'walkStr').min(0).max(50).step(1);
gui.add(sppParams, 'acceleration').min(0).max(1).step(0.01);
gui.add(sppParams, 'maxVelocity').min(0).max(1).step(0.01);
gui.add(sppParams, 'gravity');

/**
	THREE.js Functions
*/

function update() {
	updateSPPModel();
	particleSystem.geometry.dynamic = true;
	particleSystem.geometry.verticesNeedUpdate = true;
}

function render() {
	renderer.render(scene, camera);
}

function frame() {
	fpsMeter.tickStart();
	
	requestAnimationFrame(frame);
	
	//now = timestamp();
	//dt = dt + Math.min(1, (now - last) / 1000);
	
	//while (dt > step) {
		//dt = dt - step;
		update();
	//}

	render();
	
	
	
	//last = now;
	fpsMeter.tick();
}

function timestamp() {
	if (window.performance && window.performance.now) {
		return window.performance.now();
	}
	else {
		return new Date().getTime();
	}
}

function createScene() {
	/**
		Scene.
	*/
	scene = new THREE.Scene();
	
	/**
		Camera.
	*/
	camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 1000);				
	camera.position.x = 24;
	camera.position.y = 10;
	camera.position.z = 24;			
	camera.lookAt(new THREE.Vector3(0, 10, 0));
	
	/**
		Renderer.
	*/
	renderer = new THREE.WebGLRenderer();			
	renderer.setSize(canvasWidth, canvasHeight);
	document.getElementById("WebGLCanvas").appendChild(renderer.domElement);
	
	/**
		Controls.
	*/
	controls = new THREE.OrbitControls(camera, document.getElementById("WebGLCanvas"));
	//controls.noMouse = true;
	controls.target.y = 10;
	
	/**
		Lighting.
	*/
	ambientLight = new THREE.AmbientLight(0x404040);
	scene.add(ambientLight);
	
	mainLight = new THREE.PointLight();
	mainLight.position.set(50, 150, 150);
	scene.add(mainLight);

	/**
		Environment Objects.
	*/
	var groundGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);
	var groundMaterial = new THREE.MeshBasicMaterial({color: 0xF7D480, wireframe: true});
	var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
	groundMesh.rotation.x = -Math.PI/2;					
	scene.add(groundMesh);
}

/**
	SPP Model Functions.
*/
function initSPPModel() {
	/**
	Pregenerate random walk look up table.
	*/
	for (var i = 0; i < randWalkLUSize; i++) {
		var rand = vec3.random(vec3.create(), getGaussianAngle());
		if (Math.random() < 0.5) {vec3.negate(rand, rand)};
		randWalkLU[i] = rand;
	}
	
	/**
	Generate particles.
	*/
	var particles = new THREE.Geometry();
	var pMaterial = new THREE.ParticleBasicMaterial( {size: 1, color: 0xffffff, map: THREE.ImageUtils.loadTexture("images/particle.png"), blending: THREE.AdditiveBlending, transparent: true} );

	for (i = 0; i < maxParticles; i++) {
		var particle = new THREE.Vector3(Math.random()*2, Math.random()*2+10, Math.random()*2);
		particle.velocity = new THREE.Vector3(0,0,0);
		
		particles.vertices.push(particle);//new THREE.Vector3(Math.random()*2, Math.random()*2+10, Math.random()*2));
	}
	
	particleSystem = new THREE.ParticleSystem(particles, pMaterial);
	
	particleSystem.sortParticles = true;
	scene.add(particleSystem);
}

function updateSPPModel() {
	for (var i = 0; i < maxParticles; i++) {
		var cParticle = vec3.fromValues(particleSystem.geometry.vertices[i].x, particleSystem.geometry.vertices[i].y, particleSystem.geometry.vertices[i].z);
		var cVelocity = vec3.fromValues(particleSystem.geometry.vertices[i].velocity.x, particleSystem.geometry.vertices[i].velocity.y, particleSystem.geometry.vertices[i].velocity.z);
		
		if (sppParams.gravity) {
			var gravVector = vec3.create();
			
			vec3.subtract(gravVector, origin, cParticle);
			vec3.normalize(gravVector, gravVector);
			
			vec3.scaleAndAdd(cVelocity, cVelocity, gravVector, sppParams.acceleration);
			vec3.normalize(cVelocity, cVelocity);
			vec3.scale(cVelocity, cVelocity, sppParams.maxVelocity);
			
			vec3.add(cParticle, cParticle, cVelocity);
			
			particleSystem.geometry.vertices[i].velocity.set(cVelocity[0], cVelocity[1], cVelocity[2]);
			particleSystem.geometry.vertices[i].set(cParticle[0], cParticle[1], cParticle[2]);
			
			continue;
		}
		
		var repulseVector = vec3.create();
		var alignVector = vec3.create();
		var attractVector = vec3.create();
		
		for (var j = 0; j < maxParticles; j++) {
			var sParticle = vec3.fromValues(particleSystem.geometry.vertices[j].x, particleSystem.geometry.vertices[j].y, particleSystem.geometry.vertices[j].z);
			var siblingDist = vec3.distance(sParticle, cParticle);
			
			//TODO order of if statements is incorrect if range values get altered by user or are initialised to different values
			if (siblingDist < sppParams.repulseRange) {
				var scVec = vec3.create();
				vec3.subtract(scVec, cParticle, sParticle)
				vec3.add(repulseVector, repulseVector, scVec);
			}
			else if (siblingDist < sppParams.alignRange + sppParams.repulseRange) {
				vec3.add(alignVector, alignVector, vec3.fromValues(particleSystem.geometry.vertices[j].velocity.x, particleSystem.geometry.vertices[j].velocity.y, particleSystem.geometry.vertices[j].velocity.z));
			}
			else if (siblingDist < sppParams.attractRange + sppParams.alignRange + sppParams.repulseRange) {
				var csVec = vec3.create();
				vec3.subtract(csVec, sParticle, cParticle);
				vec3.add(attractVector, attractVector, csVec);
			}
		}
		
		var sppVector = vec3.create();
		
		vec3.scaleAndAdd(sppVector, sppVector, getRandomWalk(), sppParams.walkStr);
		vec3.scaleAndAdd(sppVector, sppVector, repulseVector, sppParams.repulseStr);
		vec3.scaleAndAdd(sppVector, sppVector, attractVector, sppParams.attractStr);
		vec3.scaleAndAdd(sppVector, sppVector, alignVector, sppParams.alignStr);
		
		vec3.normalize(sppVector, sppVector);
		vec3.scaleAndAdd(cVelocity, cVelocity, sppVector, sppParams.acceleration);
		vec3.normalize(cVelocity, cVelocity);
		vec3.scale(cVelocity, cVelocity, sppParams.maxVelocity);
		
		vec3.add(cParticle, cParticle, cVelocity);
		
		particleSystem.geometry.vertices[i].velocity.set(cVelocity[0], cVelocity[1], cVelocity[2]);
		particleSystem.geometry.vertices[i].set(cParticle[0], cParticle[1], cParticle[2]);
	}
}

function getRandomWalk() {
	var rand = vec3.random(vec3.create(), getGaussianAngle());
	if (Math.random() < 0.5) {vec3.negate(rand, rand)};
	return rand;
}

function getGaussianAngle() {
	var y = Math.PI * Math.exp(-(Math.random() * 5.0) / (2.0 * 2*2));
	return Math.random() < 0.5 ? y : -y;
}