window.onload = function() {
	shipSimulation();
}

var gblSimulation = {};

function shipSimulation() {
	gblSimulation.simulationView = new SimulationView();
	gblSimulation.simulationView.init();
	
	gblSimulation.objectManager = new ObjectManager();
	gblSimulation.objectManager.init();
	
	Controllable.prototype.init();
	
	generate();
	skybox();
	
	gblSimulation.simulationView.frame();
}

function generate() {
	var numControllables = 1;
	
	for (var i = 0; i < numControllables; i++) {
		var randVector = vec3.random(vec3.create(), Math.random() * (1000 - 0) + 0);
		var controllablePosition = new THREE.Vector3(0.0, 0.0, 0.0);//new THREE.Vector3(randVector[0], 0.0, randVector[2]);
		
		gblSimulation.objectManager.controllables.push(Controllable.prototype.create(controllablePosition));
	}
}

function skybox() {
	var skyboxGeometry = new THREE.SphereGeometry(3000000, 60, 60);
	var skyboxUniforms = {
		texture1: {type: "t", value: THREE.ImageUtils.loadTexture("images/milkyway_pan_large.jpg")}
	}
	var skyboxMaterial = new THREE.ShaderMaterial({
		uniforms: skyboxUniforms,
		vertexShader: $('#unlit_tex_v_shader').text(),
		fragmentShader: $('#unlit_tex_f_shader').text(),
		side: THREE.BackSide,
		depthWrite: false
	});
	
	gblSimulation.simulationView.scene.add(new THREE.Mesh(skyboxGeometry, skyboxMaterial));
}

function SimulationView() {
	this.scene = null;
	this.camera = null;
	this.renderer = null;
	this.controls = null;
	this.fpsMeter = null;
	
	this.orgCameraPosition = null;
	this.cameraDestination = null;
	this.cameraProgress = null;
	
	this.cameraOffset = 25000.0;
	
	this.frame = function() {
		requestAnimationFrame(this.frame.bind(this));
		
		this.fpsMeter.tickStart();
		
		this.updateCamera();
		
		this.controls.update();
		gblSimulation.objectManager.update();
		
		this.render();
		
		this.fpsMeter.tick();
	}
}

SimulationView.prototype = {
	init: function() {
		this.scene = new THREE.Scene();
		
		this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 10000000);
		this.camera.position.x = 0;
		this.camera.position.y = 3000;
		this.camera.position.z = 3000;
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		
		this.renderer = new THREE.WebGLRenderer({antialias: true});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor(0x000000, 1);
		
		this.controls = new THREE.OrbitControls(this.camera);
		this.controls.maxDistance = 10000000;
		this.controls.xRotateSpeed = 1.0;
		this.controls.yRotateSpeed = 0.025;
		this.controls.panSpeed = 0.05;
		
		this.fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
		
		document.getElementById("canvas").appendChild(this.renderer.domElement);
			
		THREEx.WindowResize(this.renderer, this.camera);
		THREEx.FullScreen.bindKey({charCode: 'f'.charCodeAt(0)});
	},
	
	render: function() {
		this.renderer.render(this.scene, this.camera);
	},
	
	updateCamera: function() {
		if (this.cameraDestination && this.cameraProgress <= 1.0) {
			var cameraStep = this.orgCameraPosition.clone().lerp(this.cameraDestination, this.cameraProgress);
			
			this.camera.position.set(cameraStep.x, cameraStep.y, cameraStep.z);
			this.controls.savePosition();
			this.controls.saveTarget();
			this.controls.reset();
			
			this.cameraProgress += 0.1;
		}
	}
}

function ObjectManager() {
	this.controllables = [];
	
	this.staticObjects = null;
	this.pickingObjects = null;
	
	this.mouseMove = new THREE.Vector3();
	this.lastMouseMove = new THREE.Vector3();
	this.mouseDblClick = null;
	
	this.onMouseMove = function(e) {
		gblSimulation.objectManager.mouseMove = new THREE.Vector3(
			(event.clientX / window.innerWidth) * 2 - 1,
			1 - (event.clientY / window.innerHeight) * 2,
			0.5
		);
	}
	
	this.onDoubleClick = function(e) {
		gblSimulation.objectManager.mouseDblClick = new THREE.Vector3(
			(event.clientX / window.innerWidth) * 2 - 1,
			1 - (event.clientY / window.innerHeight) * 2,
			0.5
		);
	}
}

ObjectManager.prototype = {
	init:function() {
		this.staticObjects = new THREE.Object3D();
		this.pickingObjects = new THREE.Object3D();
		
		gblSimulation.simulationView.scene.add(this.staticObjects);
		gblSimulation.simulationView.scene.add(this.pickingObjects);
	},
	
	update:function() {
		this.handleMouseMove();
		this.handleMouseDoubleClick();
		
		for (var i = 0; i < this.controllables.length; i++) {
			this.controllables[i].update();
		}
	},
	
	addObject:function(object, picking) {
		if (picking) {
			this.pickingObjects.add(object);
		}
		else {
			this.staticObjects.add(object);
		}
	},
	
	handleMouseMove:function() { //TODO combine the raycasting of both this and dbl click methods then perform logic based on input state
		if (gblSimulation.objectManager.mouseMove.distanceTo(gblSimulation.objectManager.lastMouseMove) > 0.0) {
			//reset picking object visibility TODO kind of a convoluted way of accessing the picking mesh
 			for (var i = 0; i < this.pickingObjects.children.length; i++) {
				this.pickingObjects.children[i].worldParent.view.getMeshByName('pickingMesh').value.visible = false;
			} 
			
			var projector = new THREE.Projector();
 			var raycaster = projector.pickingRay(gblSimulation.objectManager.mouseMove.clone(), gblSimulation.simulationView.camera);
		
			//TODO don't bother doing intersects if object is too far away
			var intersects = raycaster.intersectObjects(this.pickingObjects.children);
			
			if (intersects.length > 0) {
				var worldParent = intersects[0].object.worldParent;
			}
			
			gblSimulation.objectManager.lastMouseMove = gblSimulation.objectManager.mouseMove.clone();
		}
	},
	
	handleMouseDoubleClick:function() {
		if (gblSimulation.objectManager.mouseDblClick != null) {
			var projector = new THREE.Projector();
			var raycaster = projector.pickingRay(gblSimulation.objectManager.mouseDblClick.clone(), gblSimulation.simulationView.camera);
		
			//TODO don't bother doing intersects if object is too far away
			var intersects = raycaster.intersectObjects(this.pickingObjects.children);
			
			if (intersects.length > 0) {
				var worldParent = intersects[0].object.worldParent;
				
				//TODO move this to flyToTarget() method in SimulationView
				var destinationVec = new THREE.Vector3().subVectors(gblSimulation.simulationView.camera.position, worldParent.body.position).normalize();
	
 				gblSimulation.simulationView.orgCameraPosition = gblSimulation.simulationView.camera.position.clone();
				gblSimulation.simulationView.cameraDestination = new THREE.Vector3().addVectors(worldParent.body.position, destinationVec.multiplyScalar(gblSimulation.simulationView.cameraOffset));
				gblSimulation.simulationView.cameraProgress = 0.0;
				
				gblSimulation.simulationView.controls.target = worldParent.body.position.clone();
				gblSimulation.simulationView.camera.lookAt(worldParent.body.position.clone());
			}
			
			gblSimulation.objectManager.mouseDblClick = null;
		}
	}
}

function View() {
	this.meshes = [];
}

View.prototype = {
	update:function(position) {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].value.position.set(position.x, position.y, position.z);
		}
	},
	
	setWorldParent:function(worldParent) {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].value.worldParent = worldParent;
		}
	},
	
	getMeshByName:function(name) {
		for (var i = 0; i < this.meshes.length; i++) {
			if (this.meshes[i].name == name) {
				return this.meshes[i];
			}
		}
	}
}

function Body(position, mass, force, maxVelocity) {
	this.position = position;
	this.mass = mass;
	this.force = force;
	this.maxVelocity = maxVelocity;
	this.velocity = new THREE.Vector3();
}

Body.prototype = {
	move:function(direction) {
		this.velocity.add(direction.multiplyScalar(this.force / this.mass));
		
		if (this.velocity.length() > this.maxVelocity) {
			this.velocity.normalize();
			this.velocity.multiplyScalar(this.maxVelocity);
		}
		
		this.position.add(this.velocity);
	}
}

function Controllable(body, view) {
	this.body = body;
	this.view = view;
	
	this.interactionRange = 50;
	
	this.destination = null;
	
	this.view.setWorldParent(this)
}

Controllable.prototype = {
	storedGeometries: [],
	storedMaterials: [],
	
	init:function() {
		var controllableGeometry = new THREE.SphereGeometry(25, 32, 32);
		var controllableMaterial = new THREE.ShaderMaterial({
			uniforms: {
				colour: {type: 'v3', value: new THREE.Vector3(1.0, 1.0, 1.0)}
			},
			vertexShader: $('#unlit_v_shader').text(),
			fragmentShader: $('#unlit_f_shader').text(),
		});
		
		this.storedGeometries.push({name: 'controllableGeometry', value: controllableGeometry});
		this.storedMaterials.push({name: 'controllableMaterial', value: controllableMaterial});
	},
	
	getMaterialByName:function(name) {
		for (var i = 0; i < this.storedMaterials.length; i++) {
			if (this.storedMaterials[i].name == name) {
				return this.storedMaterials[i].value;
			}
		}
	},
	
	getGeometryByName:function(name) {
		for (var i = 0; i < this.storedGeometries.length; i++) {
			if (this.storedGeometries[i].name == name) {
				return this.storedGeometries[i].value;
			}
		}
	},
	
	create:function(controllablePosition) {
		var controllableBody = new Body(controllablePosition, 1, 1, 25.0);
		
		var controllableMesh = new THREE.Mesh(this.getGeometryByName('controllableGeometry'), this.getMaterialByName('controllableMaterial').clone());
		gblSimulation.objectManager.addObject(controllableMesh, true);
			
		var controllableView = new View();
		controllableView.meshes.push({name: 'controllableMesh', value: controllableMesh});
		
		return new Controllable(controllableBody, controllableView);
	},
	
	update:function() {
		if (this.destination == null) {
			this.getNewDestination();
		}
		
		if (this.destination != null) {
			var destinationVec = new THREE.Vector3().subVectors(this.destination, this.body.position);
			
			if (destinationVec.length() <= this.interactionRange) {
				this.destination = null;
			}
			
			this.body.move(destinationVec.normalize());
		}
		
		this.updateView();
	},
	
	getNewDestination:function() {
		this.destination = new THREE.Vector3(Math.random() * 1000, 0.0, Math.random() * 1000);
	},
	
	updateView:function() {
		this.view.update(this.body.position);
	}
}