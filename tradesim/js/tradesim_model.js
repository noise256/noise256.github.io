window.onload = function() {
	tradeSimulation();
}

var gblSimulation = {};

function tradeSimulation() {
	gblSimulation.simulationView = new SimulationView();
	gblSimulation.simulationView.init();
	
	gblSimulation.objectManager = new ObjectManager();
	gblSimulation.objectManager.init();
	
	gblSimulation.guiController = new GUIController();
	gblSimulation.guiController.init();
	
	Planet.prototype.init();
	Star.prototype.init();
	
	generate();
	skybox();
	
	window.addEventListener('dblclick', gblSimulation.objectManager.onDoubleClick, false); //move
	window.addEventListener('mousemove', gblSimulation.objectManager.onMouseMove, false); //move
		
	gblSimulation.simulationView.frame();
}

function generate() {
	var numStars = 10;
	var numPlanets = Math.random() * (SolarSystemSpec.system1.maxPlanets - SolarSystemSpec.system1.minPlanets) + SolarSystemSpec.system1.minPlanets;
	var numColonies = numPlanets;
	var numTraders = 2000;
	
	//create stars
	var solarStepMin = 300000.0;
	var solarStepMax = 500000.0;
	var distanceToCentre = 0.0;
	for (var i = 0; i < numStars; i++) {
		var randVector = vec3.random(vec3.create(), distanceToCentre);
		var starPosition = new THREE.Vector3(randVector[0], 0.0, randVector[2]);
		gblSimulation.objectManager.stars.push(Star.prototype.create(starPosition));
		distanceToCentre += Math.random() * (solarStepMax - solarStepMin) + solarStepMin;
	}
	
	//create planets
	var colonyCount = 0;
	for (var i = 0; i < numStars; i++) {
		var distanceToStar = SolarSystemSpec.system1.maxStarSize + Math.random() * (SolarSystemSpec.system1.maxPlanetDistance - SolarSystemSpec.system1.minPlanetDistance) + SolarSystemSpec.system1.minPlanetDistance;
		for (var j = 0; j < numPlanets; j++) {
			var randVector = vec3.random(vec3.create(), distanceToStar);
			var planetOffset = new THREE.Vector3(randVector[0], 0.0, randVector[2]);
			
			var planet = Planet.prototype.create(gblSimulation.objectManager.stars[i], new THREE.Vector3().addVectors(gblSimulation.objectManager.stars[i].body.position, planetOffset), planetOffset.length());
			gblSimulation.objectManager.planets.push(planet);
			
			if (colonyCount < numColonies) {
				var colony = Colony.prototype.create(planet);
				
				planet.colonies.push(colony);
				gblSimulation.objectManager.colonies.push(colony);
				colonyCount++;
			}
			
			distanceToStar += Math.random() * (SolarSystemSpec.system1.maxPlanetDistance - SolarSystemSpec.system1.minPlanetDistance) + SolarSystemSpec.system1.minPlanetDistance;
		}
	}
	
	//create traders
	var traderGeometry = new THREE.SphereGeometry(30, 32, 32);
	
	var traderMaterial = new THREE.ShaderMaterial({
		uniforms: {
			colour: {type: 'v3', value: new THREE.Vector3(1.0, 0.0, 0.0)}
		},
		vertexShader: $('#unlit_v_shader').text(),
		fragmentShader: $('#unlit_f_shader').text(),
	});
		
	for (var i = 0; i < numTraders; i++) {
		var randVector = vec3.random(vec3.create(), Math.random() * (SolarSystemSpec.system1.maxPlanetDistance + SolarSystemSpec.system1.minPlanetDistance) / 2 * numPlanets); //TODO implement max trader spread
		var traderPosition = new THREE.Vector3(randVector[0], 0.0, randVector[2]);
		var traderBody = new Body(traderPosition, 1, 1, 25.0);
		
		var traderMesh = new THREE.Mesh(traderGeometry, traderMaterial.clone());
		gblSimulation.objectManager.addObject(traderMesh, false);
		
		var traderView = new View();
		traderView.meshes.push({name: 'traderMesh', value: traderMesh});
		
		var traderEconomy = new Economy();
		
		gblSimulation.objectManager.traders.push(new Trader(traderBody, traderView, traderEconomy));
	} 
}

/**
	Milky Way skybox source: https://code.google.com/p/osghimmel/downloads/detail?name=resources_milkyway_equatorial_1024.zip&can=1&q= 29.07.2014
**/
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
		gblSimulation.guiController.update();
		
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
		this.camera.position.z = 25000;
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
	this.stars = [];
	this.planets = [];
	this.colonies = [];
	this.traders = [];
	
	this.staticObjects = null;
	this.pickingObjects = null;
	
	this.mouseMove = null;
	this.lastMouseMove = new THREE.Vector3(0.0, 0.0, 0.0);
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
		
		for (var i = 0; i < this.stars.length; i++) {
			this.stars[i].update();
		}
		for (var i = 0; i < this.planets.length; i++) {
			this.planets[i].update();
		}
		for (var i = 0; i < this.traders.length; i++) {
			this.traders[i].update();
		}
		for (var i = 0; i < this.colonies.length; i++) {
			this.colonies[i].update();
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
				
				if (worldParent instanceof Planet) {
					gblSimulation.guiController.resourceGUITarget = worldParent.colonies[0];
					worldParent.view.getMeshByName('pickingMesh').value.visible = true;
				}
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

function GUIController() {
	this.resourceGUITarget = null;
	
	this.resourceGUIParams = {
		foodQuantity:0,
		foodPrice:0,
		waterQuantity:0,
		waterPrice:0,
		fuelQuantity:0,
		fuelPrice:0,
		metalQuantity:0,
		metalPrice:0,
	};
}

GUIController.prototype = {
	init:function() {
		this.resourceGUI = new dat.GUI({height: 4 * 32 - 1});
		this.resourceGUI.add(this.resourceGUIParams, 'foodQuantity').name('Food Quantity').listen();
		this.resourceGUI.add(this.resourceGUIParams, 'foodPrice').name('Food Price').listen();
		this.resourceGUI.add(this.resourceGUIParams, 'waterQuantity').name('Water Quantity').listen();
		this.resourceGUI.add(this.resourceGUIParams, 'waterPrice').name('Water Price').listen();
		this.resourceGUI.add(this.resourceGUIParams, 'fuelQuantity').name('Fuel Quantity').listen();
		this.resourceGUI.add(this.resourceGUIParams, 'fuelPrice').name('Fuel Price').listen();
		this.resourceGUI.add(this.resourceGUIParams, 'metalQuantity').name('Metal Quantity').listen();
		this.resourceGUI.add(this.resourceGUIParams, 'metalPrice').name('Metal Price').listen();
	},
	
	update:function() {
		if (this.resourceGUITarget) {
			this.resourceGUIParams.foodQuantity = this.resourceGUITarget.economy.getResourceByName('food').quantity;
			this.resourceGUIParams.waterQuantity = this.resourceGUITarget.economy.getResourceByName('water').quantity
			this.resourceGUIParams.fuelQuantity = this.resourceGUITarget.economy.getResourceByName('fuel').quantity
			this.resourceGUIParams.metalQuantity = this.resourceGUITarget.economy.getResourceByName('metal').quantity
			this.resourceGUIParams.foodPrice = this.resourceGUITarget.economy.getResourceByName('food').price;
			this.resourceGUIParams.waterPrice = this.resourceGUITarget.economy.getResourceByName('water').price
			this.resourceGUIParams.fuelPrice = this.resourceGUITarget.economy.getResourceByName('fuel').price
			this.resourceGUIParams.metalPrice = this.resourceGUITarget.economy.getResourceByName('metal').price
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

function Economy() {
	this.resources = [
		{name: 'food', quantity: 0, price: 1500},
		{name: 'water', quantity: 0, price: 1500},
		{name: 'fuel', quantity: 0, price: 1500},
		{name: 'metal', quantity: 0, price: 1500}
	];
}

Economy.prototype = {
	getResourceByName:function(name) {
		for (var i = 0; i < this.resources.length; i++) {
			if (this.resources[i].name == name) {	
				return this.resources[i];
			}
		}
	},
	
	setResourceQuantity:function(name, quantity) {
		for (var i = 0; i < this.resources.length; i++) {
			if (this.resources[i].name == name) {
				this.resources[i].quantity = Math.max(0, quantity);
			}
		}
	},
	
	changeResourceQuantity:function(name, change) {
		for (var i = 0; i < this.resources.length; i++) {
			if (this.resources[i].name == name) {
				this.resources[i].quantity += change;
				this.resources[i].quantity = Math.max(0, this.resources[i].quantity);
			}
		}
	},
	
	setResourcePrice:function(name, price) {
		for (var i = 0; i < this.resources.length; i++) {
			if (this.resources[i].name == name) {
				this.resources[i].price = price;
			}
		}
	},
	
	changeResourcePrice:function(name, change) {
		for (var i = 0; i < this.resources.length; i++) {
			if (this.resources[i].name == name) {
				this.resources[i].price += change;
				this.resources[i].price = Math.max(0, this.resources[i].price);
			}
		}
	},
	
	hasResources:function() {
		for (var i = 0; i < this.resources.length; i++) {
			if (this.resources[i].quantity > 0) {
				return true;
			}
		}
		return false;
	}
}

function Star(body, view) {
	this.body = body;
	this.view = view;
	
	this.view.setWorldParent(this);
}

Star.prototype = {
	storedGeometries: [],
	storedMaterials: [],
	
	init:function() {
		var surfaceMaterial = new THREE.ShaderMaterial({
			uniforms: null,
			vertexShader: $('#star_v_shader').text(),
			fragmentShader: $('#star_f_shader').text(),
			transparent: true,
			blending: THREE.AdditiveBlending
		}); 
		
		var pickingMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.2
		});
		
		this.storedMaterials.push({name: 'surfaceMaterial', value: surfaceMaterial});
		this.storedMaterials.push({name: 'pickingMaterial', value: pickingMaterial});
		
		var surfaceGeometry = new THREE.SphereGeometry(12500, 128, 128);
		
		this.storedGeometries.push({name: 'surfaceGeometry', value: surfaceGeometry});
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
	
	create:function(starPosition) {
		//var innerRadius = Math.random() * (SolarSystemSpec.system1.maxStarSize - 3000) + 3000;
		var colour = [Math.random() * (1.0 - 0.8) + 0.8, Math.random() * (1.0 - 0.8) + 0.8, Math.random() * (1.0 - 0.8) + 0.8];

		var surfaceUniforms = {
			cameraDir:{type:'v3', value:new THREE.Vector3()},
			colour:{type:'v3', value:new THREE.Vector3(colour[0], colour[1], colour[2])},
		};
		
		var surfaceGeometry = this.getGeometryByName('surfaceGeometry');
		var surfaceMaterial = this.getMaterialByName('surfaceMaterial').clone();
		surfaceMaterial.uniforms = surfaceUniforms;
		var surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
		
		var pickingGeometry = new THREE.SphereGeometry(12500 + 50, 8, 8);
		var pickingMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.2
		});
		var pickingMesh = new THREE.Mesh(pickingGeometry, pickingMaterial);
		pickingMesh.visible = false;
		
		var starView = new View();
		
		starView.meshes.push({name: 'surfaceMesh', value: surfaceMesh});
		starView.meshes.push({name: 'pickingMesh', value: pickingMesh});
		
		gblSimulation.objectManager.addObject(surfaceMesh, false);
		gblSimulation.objectManager.addObject(pickingMesh, true);
		
		var starBody = new Body(starPosition, 0, 0, 0);
		
		return new Star(starBody, starView);
	},
	
	update:function() {
		this.view.update(this.body.position);
		
		this.updateUniforms();
	},
	
	updateUniforms:function() {
		this.view.getMeshByName('surfaceMesh').value.material.uniforms.cameraDir.value = new THREE.Vector3().subVectors(gblSimulation.simulationView.camera.position, this.body.position);
	}
}

function Planet(body, view, economy, star) {
	this.body = body;
	this.view = view;
	this.economy = economy;
	this.star = star;
	
	this.colonies = [];
	
	this.view.setWorldParent(this);
}

Planet.prototype = {
	storedTextures: [],
	storedMaterials: [],
	
	init:function() {
		Planet.prototype.storedTextures.push(THREE.ImageUtils.loadTexture('images/mercurymap.jpg'));
		Planet.prototype.storedTextures.push(THREE.ImageUtils.loadTexture('images/venusmap.jpg'));
		Planet.prototype.storedTextures.push(THREE.ImageUtils.loadTexture('images/marsmap.jpg'));
		Planet.prototype.storedTextures.push(THREE.ImageUtils.loadTexture('images/plutomap.jpg'));
		Planet.prototype.storedTextures.push(THREE.ImageUtils.loadTexture('images/sednamap.jpg'));
		
 		var skyMaterial = new THREE.ShaderMaterial({
			uniforms: null,
			vertexShader: $('#atmosphere_v_shader').text(),
			fragmentShader: $('#atmosphere_f_shader').text(),
			side: THREE.BackSide,
			transparent: true,
			blending: THREE.AdditiveBlending
		}); 
 		var groundMaterial = new THREE.ShaderMaterial({
			uniforms: null,
			vertexShader: $('#ground_v_shader').text(),
			fragmentShader: $('#ground_f_shader').text(),
		}); 
		
		var pickingMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.2
		});
		
		var orbitRingMaterial = new THREE.MeshBasicMaterial({color: 0x97EBC2});
		
		Planet.prototype.storedMaterials.push({name: 'skyMaterial', value: skyMaterial});
		Planet.prototype.storedMaterials.push({name: 'groundMaterial', value: groundMaterial});
		Planet.prototype.storedMaterials.push({name: 'pickingMaterial', value: pickingMaterial});
		Planet.prototype.storedMaterials.push({name: 'orbitRingMaterial', value: orbitRingMaterial});
	},
	
	getMaterialByName:function(name) {
		for (var i = 0; i < Planet.prototype.storedMaterials.length; i++) {
			if (Planet.prototype.storedMaterials[i].name == name) {
				return Planet.prototype.storedMaterials[i].value;
			}
		}
	},
	
	create:function(star, planetPosition, distanceToStar) {
		//create definition
		var innerRadius = Math.random() * (SolarSystemSpec.system1.maxPlanetSize - SolarSystemSpec.system1.minPlanetSize) + SolarSystemSpec.system1.minPlanetSize;
		
		var planetSpec = {
			waveLength: [Math.random() * (1.0 - 0.1) + 0.1, Math.random() * (1.0 - 0.1) + 0.1, Math.random() * (1.0 - 0.1) + 0.1],
			innerRadius: innerRadius,
			outerRadius: innerRadius * 1.025,
			eSun: Math.random() * (100 - 40) + 40,
			kr: 0.0025,
			km: 0.0010,
			scaleDepth: 0.25//Math.random() * (2.5 - 0.25) + 0.25
		};
		
		//create body
		var planetBody = new Body(planetPosition, 0, 0, 5.0 / distanceToStar);
		
		//create view
		var planetTexture = Math.floor(Math.random() * Planet.prototype.storedTextures.length);
		var atmosphereUniforms = {
			dayTexture: {type: "t", value: Planet.prototype.storedTextures[planetTexture]},
			nightTexture: {type: "t", value: Planet.prototype.storedTextures[planetTexture]},
			cameraPos: {type:'v3', value: new THREE.Vector3()},
			cameraHeight2: {type:'f', value: 0},
			lightDir: {type:'v3', value: new THREE.Vector3(star.body.position.x - planetPosition.x, star.body.position.y - planetPosition.y, star.body.position.z - planetPosition.z).normalize()},
			invWaveLength: {type:'v3', value: new THREE.Vector3(1.0/Math.pow(planetSpec.waveLength[0],4), 1.0/Math.pow(planetSpec.waveLength[1],4), 1.0/Math.pow(planetSpec.waveLength[2],4))},
			outerRadius: {type:'f', value:planetSpec.outerRadius},
			outerRadius2: {type:'f', value:planetSpec.outerRadius * planetSpec.outerRadius},
			innerRadius: {type:'f', value:planetSpec.innerRadius},
			innerRadius2: {type:'f', value:planetSpec.innerRadius * planetSpec.innerRadius},
			krESun: {type:'f', value:planetSpec.kr * planetSpec.eSun},
			kmESun: {type:'f', value:planetSpec.km * planetSpec.eSun},
			kr4Pi: {type:'f', value:planetSpec.kr * 4 * Math.PI},
			km4Pi: {type:'f', value:planetSpec.km * 4 * Math.PI},
			scale: {type:'f', value:1 / (planetSpec.outerRadius - planetSpec.innerRadius)},
			scaleDepth: {type:'f', value:planetSpec.scaleDepth},
			scaleOverScaleDepth: {type:'f', value:1 / (planetSpec.outerRadius - planetSpec.innerRadius) / planetSpec.scaleDepth},
		};
		
		var skyGeometry = new THREE.SphereGeometry(planetSpec.outerRadius, 24, 24);
		var skyMaterial = Planet.prototype.getMaterialByName('skyMaterial').clone();
		skyMaterial.uniforms = atmosphereUniforms;
		
		var groundGeometry = new THREE.SphereGeometry(planetSpec.innerRadius, 24, 24);
		var groundMaterial = Planet.prototype.getMaterialByName('groundMaterial').clone();
		groundMaterial.uniforms = atmosphereUniforms;
		
		var pickingGeometry = new THREE.SphereGeometry(planetSpec.outerRadius + 50, 24, 24);
		var pickingMaterial = Planet.prototype.getMaterialByName('pickingMaterial');
		
		var orbitRingGeometry = new THREE.TorusGeometry(distanceToStar, 25, 8, 64);
		var orbitRingMaterial = Planet.prototype.getMaterialByName('orbitRingMaterial');
		
		var skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
		var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
		var pickingMesh = new THREE.Mesh(pickingGeometry, pickingMaterial);
		pickingMesh.visible = false;
		var orbitRingMesh = new THREE.Mesh(orbitRingGeometry, orbitRingMaterial);
		orbitRingMesh.position.set(star.body.position.x, star.body.position.y, star.body.position.z);
		orbitRingMesh.rotation.x = Math.PI/2.0;
		
		var planetView = new View();
		planetView.meshes.push({name: 'skyMesh', value: skyMesh});
		planetView.meshes.push({name: 'groundMesh', value: groundMesh});
		planetView.meshes.push({name: 'pickingMesh', value: pickingMesh});
		planetView.meshes.push({name: 'orbitRingMesh', value: orbitRingMesh});
		
		gblSimulation.objectManager.addObject(skyMesh, false);
		gblSimulation.objectManager.addObject(groundMesh, false);
		gblSimulation.objectManager.addObject(orbitRingMesh, false);
		gblSimulation.objectManager.addObject(pickingMesh, true);
			
		//create economy
		var planetEconomy = new Economy();
		
		if (Math.random() > 0.5) {
			planetEconomy.setResourceQuantity('food', 1);
		}
		if (Math.random() > 0.5) {
			planetEconomy.setResourceQuantity('water', 1);
		}
		if (Math.random() > 0.5) {
			planetEconomy.setResourceQuantity('fuel', 1);
		}
		if (Math.random() > 0.5) {
			planetEconomy.setResourceQuantity('metal', 1);
		}
		
		return new Planet(planetBody, planetView, planetEconomy, star);
	},
	
	update:function() {
		this.body.position.sub(this.star.body.position);
		this.body.position.applyAxisAngle(new THREE.Vector3(0.0, 1.0, 0.0), this.body.maxVelocity);
		this.body.position.add(this.star.body.position);
		
		this.view.getMeshByName('skyMesh').value.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
		this.view.getMeshByName('groundMesh').value.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
		this.view.getMeshByName('pickingMesh').value.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
		
		var lightDir = new THREE.Vector3(this.star.body.position.x - this.body.position.x, this.star.body.position.y - this.body.position.y, this.star.body.position.z - this.body.position.z).normalize();
		var relativeCameraPos = new THREE.Vector3().subVectors(gblSimulation.simulationView.camera.position, this.body.position);
		var cameraHeight2 = relativeCameraPos.length() * relativeCameraPos.length();
		
		this.view.getMeshByName('skyMesh').value.material.uniforms.cameraPos.value = relativeCameraPos;
		this.view.getMeshByName('skyMesh').value.material.uniforms.cameraHeight2.value = cameraHeight2;
		this.view.getMeshByName('skyMesh').value.material.uniforms.lightDir.value = lightDir;
		
		this.view.getMeshByName('groundMesh').value.material.uniforms.cameraPos.value = relativeCameraPos;
		this.view.getMeshByName('groundMesh').value.material.uniforms.cameraHeight2.value = cameraHeight2;
		this.view.getMeshByName('groundMesh').value.material.uniforms.lightDir.value = lightDir;
	},
}

var SolarSystemSpec = {
	system1: {
		minPlanets:2,
		maxPlanets:7,
		minPlanetDistance:10000,
		maxPlanetDistance:15000,
		maxStarSize:15000, //should be ~7500
		minStarSize:10000, //should be 5500 but transparency of current star is an issue ~109 * earth size (sol)
		maxPlanetSize:550, //11 * earth size (jupiter)
		minPlanetSize:100 //earth size
	}
}

function Trader(body, view, economy) {
	this.body = body;
	this.view = view;
	this.economy = economy;
	
	this.interactionRange = 600;
	
	this.targetResource = null;
	this.buyDestination = null;
	this.sellDestination = null;
	
	this.view.setWorldParent(this)
}
	
Trader.prototype = {
	update:function() {
		if (this.buyDestination == null && this.sellDestination == null) {
			this.getNewDestination();
		}
		
		if (this.buyDestination != null && this.sellDestination != null) {
			var destinationVec = null;
			if (this.economy.hasResources()) {
				destinationVec = new THREE.Vector3().subVectors(this.sellDestination.planet.body.position, this.body.position);
			}
			else {
				destinationVec = new THREE.Vector3().subVectors(this.buyDestination.planet.body.position, this.body.position);
			}
			
			if (destinationVec.length() <= this.interactionRange) {
				if (this.economy.hasResources()) {
					this.sellResources(this.sellDestination);
					this.buyDestination = null;
					this.sellDestination = null;
				}
				else {
					this.buyResources(this.buyDestination);
				}
			}
			
			this.body.move(destinationVec.normalize());
		}
		
		
		this.updateView();
	},
	
	getNewDestination:function() {
		var colonies = gblSimulation.objectManager.colonies;
		
		var buyColony;
		var sellColony;
		var targetResource;
		
		var netProfit = 0;
		for (var i = 0; i < colonies.length; i++) {
			var distanceToStart = colonies[i].planet.body.position.distanceTo(this.body.position);
			
			for (var j = 0; j < colonies.length; j++) {
				if (i == j) {
					continue;
				}
				
				var distanceToEnd = colonies[i].planet.body.position.distanceTo(colonies[j].planet.body.position);
				var totalDistance = distanceToStart + distanceToEnd;
				
				for (var k = 0; k < colonies[i].economy.resources.length; k++) {
					var cNetProfit = (colonies[j].economy.resources[k].price - colonies[i].economy.resources[k].price) / totalDistance;
					if (cNetProfit > netProfit) {
						buyColony = colonies[i];
						sellColony = colonies[j];
						targetResource = colonies[i].economy.resources[k].name;
						netProfit = cNetProfit;
					}
				}
			}
		}
		
		this.buyDestination = buyColony;
		this.sellDestination = sellColony;
		this.targetResource = targetResource;
	},
	
	sellResources:function(colony) {
		//TODO currently just dumps resources
		for (var i = 0; i < this.economy.resources.length; i++) {
			colony.economy.changeResourceQuantity(this.economy.resources[i].name, this.economy.resources[i].quantity);
			this.economy.setResourceQuantity(this.economy.resources[i].name, 0); //TODO replace setResourceQuantity() with clearResource().
		}
	},
	
	buyResources:function(colony) {
		//TODO currently just adds resource to trader without removing it from colony, need to add trade interaction with colony
		this.economy.changeResourceQuantity(this.targetResource, 1);
		colony.economy.changeResourceQuantity(this.targetResource, -1);
	},
	
	updateView:function() {
		this.view.update(this.body.position);
		
		if (this.economy.hasResources()) {
			this.view.getMeshByName('traderMesh').value.material.uniforms.colour.value.set(0.0, 1.0, 0.0);
		}
		else {
			this.view.getMeshByName('traderMesh').value.material.uniforms.colour.value.set(1.0, 0.0, 0.0);
		}
	}
}

function Colony(planet, economy) {
	this.planet = planet;
	this.economy = economy;
}

Colony.prototype = {
	create:function(planet) {
		var colonyEconomy = new Economy();
		
		return new Colony(planet, colonyEconomy);
	},
	
	update:function() {
		//harvest resources
		for (var i = 0; i < this.planet.economy.resources.length; i++) {
			if (this.planet.economy.resources[i].quantity > 0) {
				this.economy.changeResourceQuantity(this.planet.economy.resources[i].name, 1);
				//colony.planet.economy.changeResourceQuantity(colony.planet.economy.resources[i].name, -1);
			}
		}
		
		//set prices
		for (var i = 0; i < this.economy.resources.length; i++) {
			if (this.economy.resources[i].quantity <= 0) {
				this.economy.changeResourcePrice(this.economy.resources[i].name, 1);
			}
			else if (this.economy.resources[i].quantity > 0) {
				this.economy.changeResourcePrice(this.economy.resources[i].name, -1);
			}
		}
	}
}