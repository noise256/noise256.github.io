var gblSimulation = {};

window.onload = function() {
	SPPSimulation();
}

function SPPSimulation() {
	gblSimulation.simulationView = new Renderer(document.getElementById("canvas"));
	gblSimulation.simulationView.init();
	
	gblSimulation.simulationView.camera.position.set(24, 10, 24);
	gblSimulation.simulationView.camera.lookAt(new THREE.Vector3(0, 0, 0));
	
	gblSimulation.objectManager = new ObjectManager();
	gblSimulation.objectManager.init();
	
	//gblSimulation.guiController = new GUIController();
	//gblSimulation.guiController.init();
	
	generate();
	//skybox();
	
	this.frame = function() {
		requestAnimationFrame(this.frame.bind(this));
		
		gblSimulation.objectManager.update();
		gblSimulation.simulationView.update();
	}
	
	this.frame();
}

function generate() {
	var particleSystemList = [];
	
	particleSystemList.push(SPPSwarm.prototype.create());
	
	gblSimulation.objectManager.objectList.particleSystems = particleSystemList;
}

function SPPSwarm(numParticles, particleSystem) {
	this.numParticles = numParticles;
	this.particleSystem = particleSystem;
	
	this.origin = vec3.fromValues(0.0, 0.0, 0.0);
	
	this.sppParams = {
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
	}
}

SPPSwarm.prototype = {
	create:function() {
		var numParticles = 200;
		
		var particles = new THREE.Geometry();
		var pMaterial = new THREE.PointCloudMaterial( {size: 1, color: 0xffffff});//, map: THREE.ImageUtils.loadTexture("images/particle-grey.png"), transparent: true} );
		
		console.warn(numParticles);
		for (var i = 0; i < numParticles; i++) {
			var particle = new THREE.Vector3(Math.random()*2, Math.random()*2+10, Math.random()*2);
			particle.velocity = new THREE.Vector3(0,0,0);
			
			particles.vertices.push(particle);//new THREE.Vector3(Math.random()*2, Math.random()*2+10, Math.random()*2));
		}
		
		particleSystem = new THREE.PointCloud(particles, pMaterial);
		particleSystem.sortParticles = true;
		
		gblSimulation.objectManager.addObject(particleSystem, false);
		
		return new SPPSwarm(numParticles, particleSystem);
	},
	
	update:function() {
		var vertices = this.particleSystem.geometry.vertices;
		var sppParams = this.sppParams;
		
		for (var i = 0; i < this.numParticles; i++) {
			var cParticle = vec3.fromValues(vertices[i].x, vertices[i].y, vertices[i].z);
			var cVelocity = vec3.fromValues(vertices[i].velocity.x, vertices[i].velocity.y, vertices[i].velocity.z);
			
			var gravityVector = vec3.create();
			var repulseVector = vec3.create();
			var alignVector = vec3.create();
			var attractVector = vec3.create();
			
			vec3.subtract(gravityVector, this.origin, cParticle);
			vec3.normalize(gravityVector, gravityVector);
			
			for (var j = 0; j < this.numParticles; j++) {
				var sParticle = vec3.fromValues(vertices[j].x, vertices[j].y, vertices[j].z);
				var siblingDist = vec3.distance(cParticle, sParticle);
				
				//TODO order of if statements may be incorrect if range values get altered by user or are initialised to different values
				if (siblingDist < sppParams.repulseRange) {
					var scVec = vec3.create();
					vec3.subtract(scVec, cParticle, sParticle)
					vec3.add(repulseVector, repulseVector, scVec);
				}
				else if (siblingDist < sppParams.alignRange + sppParams.repulseRange) {
					var sVelocityNorm = vec3.normalize(vec3.create(), vec3.fromValues(vertices[j].velocity.x, vertices[j].velocity.y, vertices[j].velocity.z));
					
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
			vec3.scaleAndAdd(sppVector, sppVector, this.getRandomWalk(), sppParams.walkStr);
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
			
			vertices[i].velocity.set(cVelocity[0], cVelocity[1], cVelocity[2]);
			vertices[i].set(cParticle[0], cParticle[1], cParticle[2]);
		}
		
		this.particleSystem.geometry.verticesNeedUpdate = true;
	},
	
	getRandomWalk:function() {
		var rand = vec3.random(vec3.create()); //TODO the angle parameter here is scaling a random vector, i don't think this is what is needed
		//if (Math.random() < 0.5) {vec3.negate(rand, rand)};
		return rand;
	},

	getGaussianAngle:function() {
		var y = Math.PI * Math.exp(-(Math.random() * 5.0) / (2.0 * 2*2));
		return Math.random() < 0.5 ? y : -y;
	}
}
/* 
function GUIController() {
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
} */