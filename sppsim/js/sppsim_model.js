var canvasWidth = 1000;
var canvasHeight = 800;

var fpsMeter;
var rendererStats;

var scene;
var camera;
var renderer;

var particleSystem;

var origin = vec3.fromValues(0, 10, 0);
var maxParticles = 400;

var sppParams = {
	repulseStr: 10,
	repulseRange: 3,
	alignStr: 1,
	alignRange: 3,
	attractStr: 1,
	attractRange: 3,
	walkStr: 0.1,
	gravityStr: 1,
	acceleration: 0.03,
	maxVelocity: 0.5,
};

window.onload = function() {
	initGUI();
	initRenderer();
	initModel();
	frame();
}

function initGUI() {
	fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });

	var paramGui = new dat.GUI({height: 8 * 32 - 1});

	paramGui.add(sppParams, 'repulseStr').min(0).max(10).step(0.1).name('Repulsion Strength');
	paramGui.add(sppParams, 'repulseRange').min(0).max(10).step(0.1).name('Repulsion Range');
	paramGui.add(sppParams, 'alignStr').min(0).max(10).step(0.1).name('Alignment Strength');
	paramGui.add(sppParams, 'alignRange').min(0).max(10).step(0.1).name('Alignment Range');
	paramGui.add(sppParams, 'attractStr').min(0).max(10).step(0.1).name('Attraction Strength');
	paramGui.add(sppParams, 'attractRange').min(0).max(10).step(0.1).name('Attraction Range');
	paramGui.add(sppParams, 'walkStr').min(0).max(10).step(0.1).name('Random Walk Strength');
	paramGui.add(sppParams, 'gravityStr').min(0).max(10).step(0.1).name('Gravity Strength');
	paramGui.add(sppParams, 'acceleration').min(0).max(1).step(0.01).name('Acceleration');
	paramGui.add(sppParams, 'maxVelocity').min(0).max(1).step(0.01).name('Max Velocity');
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
	var particles = new THREE.Geometry();
	var pMaterial = new THREE.ParticleBasicMaterial( {size: 1, color: 0xffffff, map: THREE.ImageUtils.loadTexture("images/particle-grey.png"), transparent: true} );

	for (i = 0; i < maxParticles; i++) {
		var particle = new THREE.Vector3(Math.random()*2, Math.random()*2+10, Math.random()*2);
		particle.velocity = new THREE.Vector3(0,0,0);
		
		particles.vertices.push(particle);//new THREE.Vector3(Math.random()*2, Math.random()*2+10, Math.random()*2));
	}
	
	particleSystem = new THREE.ParticleSystem(particles, pMaterial);
	particleSystem.sortParticles = true;
	scene.add(particleSystem);
	
	particles.dispose();
	pMaterial.dispose();
}

function frame() {
	fpsMeter.tickStart();

	update();
	render();
	
	fpsMeter.tick();
	
	requestAnimationFrame(frame);
}

function update() {
	for (var i = 0; i < maxParticles; i++) {
		var cParticle = vec3.fromValues(particleSystem.geometry.vertices[i].x, particleSystem.geometry.vertices[i].y, particleSystem.geometry.vertices[i].z);
		var cVelocity = vec3.fromValues(particleSystem.geometry.vertices[i].velocity.x, particleSystem.geometry.vertices[i].velocity.y, particleSystem.geometry.vertices[i].velocity.z);
		
		var gravityVector = vec3.create();
		var repulseVector = vec3.create();
		var alignVector = vec3.create();
		var attractVector = vec3.create();
		
		vec3.subtract(gravityVector, origin, cParticle);
		vec3.normalize(gravityVector, gravityVector);
		
		for (var j = 0; j < maxParticles; j++) {
			var sParticle = vec3.fromValues(particleSystem.geometry.vertices[j].x, particleSystem.geometry.vertices[j].y, particleSystem.geometry.vertices[j].z);
			var siblingDist = vec3.distance(cParticle, sParticle);
			
			//TODO order of if statements may be incorrect if range values get altered by user or are initialised to different values
			if (siblingDist < sppParams.repulseRange) {
				var scVec = vec3.create();
				vec3.subtract(scVec, cParticle, sParticle)
				vec3.add(repulseVector, repulseVector, scVec);
			}
			else if (siblingDist < sppParams.alignRange + sppParams.repulseRange) {
				var sVelocityNorm = vec3.normalize(vec3.create(), vec3.fromValues(particleSystem.geometry.vertices[j].velocity.x, particleSystem.geometry.vertices[j].velocity.y, particleSystem.geometry.vertices[j].velocity.z));
				
				vec3.add(alignVector, alignVector, sVelocityNorm);
			}
			else if (siblingDist < sppParams.attractRange + sppParams.alignRange + sppParams.repulseRange) {
				var csVec = vec3.create();
				vec3.subtract(csVec, sParticle, cParticle);
				vec3.add(attractVector, attractVector, csVec);
			}
		}
		
		vec3.normalize(repulseVector, repulseVector);
		vec3.normalize(alignVector, alignVector);
		vec3.normalize(attractVector, attractVector);
		
		var sppVector = vec3.create();
		
		vec3.scaleAndAdd(sppVector, sppVector, gravityVector, sppParams.gravityStr);
		vec3.scaleAndAdd(sppVector, sppVector, getRandomWalk(), sppParams.walkStr);
		vec3.scaleAndAdd(sppVector, sppVector, repulseVector, sppParams.repulseStr);
		vec3.scaleAndAdd(sppVector, sppVector, attractVector, sppParams.attractStr);
		vec3.scaleAndAdd(sppVector, sppVector, alignVector, sppParams.alignStr);
		
		vec3.normalize(sppVector, sppVector);
		
		vec3.scaleAndAdd(cVelocity, cVelocity, sppVector, sppParams.acceleration);
		
		if (vec3.length(cVelocity) > sppParams.maxVelocity) {
			vec3.normalize(cVelocity, cVelocity);
			vec3.scale(cVelocity, cVelocity, sppParams.maxVelocity);
		}
		
		vec3.add(cParticle, cParticle, cVelocity);
		
		particleSystem.geometry.vertices[i].velocity.set(cVelocity[0], cVelocity[1], cVelocity[2]);
		particleSystem.geometry.vertices[i].set(cParticle[0], cParticle[1], cParticle[2]);
	}
	
	particleSystem.geometry.verticesNeedUpdate = true;
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

function getRandomWalk() {
	var rand = vec3.random(vec3.create()); //TODO the angle parameter here is scaling a random vector, i don't think this is what is needed
	if (Math.random() < 0.5) {vec3.negate(rand, rand)};
	return rand;
}

function getGaussianAngle() {
	var y = Math.PI * Math.exp(-(Math.random() * 5.0) / (2.0 * 2*2));
	return Math.random() < 0.5 ? y : -y;
}