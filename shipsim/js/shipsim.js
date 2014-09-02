window.onload = function() {
	ShipSimulation();
}

var gblSimulation = {};

function ShipSimulation() {
	gblSimulation.simulationView = new Renderer(document.getElementById("canvas"));
	gblSimulation.simulationView.init();
	
	gblSimulation.objectManager = new ObjectManager();
	gblSimulation.objectManager.init();
	
	Controllable.prototype.init();
	
	generate();
	skybox();
	
	this.frame = function() {
		requestAnimationFrame(this.frame.bind(this));
		
		gblSimulation.objectManager.update();
		gblSimulation.simulationView.update();
	}
	
	this.frame();
}

function generate() {
	var numControllables = 5;
	
	var controllableList = [];
	for (var i = 0; i < numControllables; i++) {
		var randVector = vec3.random(vec3.create(), Math.random() * (1000 - 0) + 0);
		var controllablePosition = new THREE.Vector3(randVector[0], 0.0, randVector[2]);
		
		controllableList.push(Controllable.prototype.create(controllablePosition));
	}
	
	gblSimulation.objectManager.objectList.controllables = controllableList;
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
	this.highlight = true;
	
	this.body = body;
	this.view = view;
	
	this.interactionRange = 50;
	
	this.inputCoordinates = null;
	this.destination = null;
	
	this.view.setWorldParent(this)
}

Controllable.prototype = {
	storedTextures: [],
	storedGeometries: [],
	storedMaterials: [],
	
	init:function() {
		Controllable.prototype.storedTextures.push(THREE.ImageUtils.loadTexture('images/controllable.png'));
		
		var controllableGeometry = new THREE.SphereGeometry(250, 32, 32);
		var controllableMaterial = new THREE.ShaderMaterial({
			uniforms: null,
			vertexShader: $('#unlit_tex_v_shader').text(),
			fragmentShader: $('#unlit_tex_f_shader').text(),
			transparent: true,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending
		});
	
		this.storedGeometries.push({name: 'controllableGeometry', value: controllableGeometry});
		this.storedMaterials.push({name: 'controllableMaterial', value: controllableMaterial});
		
		var pickingGeometry = new THREE.SphereGeometry(300, 32, 32);
		var pickingMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.2
		});
		
		this.storedGeometries.push({name: 'pickingGeometry', value: pickingGeometry});
		this.storedMaterials.push({name: 'pickingMaterial', value: pickingMaterial});
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
		
		var controllableMaterial = this.getMaterialByName('controllableMaterial').clone();
		controllableMaterial.uniforms = {
			texture1: {type: "t", value: this.storedTextures[0]}
		};
		
		var controllableMesh = new THREE.Mesh(this.getGeometryByName('controllableGeometry'), controllableMaterial);
		controllableMesh.rotation.x -= Math.PI/2;
		gblSimulation.objectManager.addObject(controllableMesh, true);
		
		var pickingMesh = new THREE.Mesh(this.getGeometryByName('pickingGeometry'), this.getMaterialByName('pickingMaterial'));
		pickingMesh.visible = false;
		
		gblSimulation.objectManager.addObject(pickingMesh, true);
		
		var controllableView = new View();
		controllableView.meshes.push({name: 'controllableMesh', value: controllableMesh});
		controllableView.meshes.push({name: 'pickingMesh', value: pickingMesh});
		
		return new Controllable(controllableBody, controllableView);
	},
	
	update:function() {
		if (this.inputCoordinates != null) {
			this.destination = this.inputCoordinates;
			this.inputCoordinates = null;
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
	
	updateView:function() {
		this.view.update(this.body.position);
	}
}