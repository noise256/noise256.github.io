window.onload = function() {
	SimulationView.init();
	SkyBox.init();
	GUIController.init();
	
	SimulationController.init();

	SimulationView.frame();
}

var SimulationView = {
	canvasWidth: null,
	canvasHeight: null,
	
	scene: null,
	camera: null, 
	renderer: null,
	controls: null,
	
	planetLight: null,
	
	projector: null,
	mouseVector: null,
	
	fpsMeter: null,
	
	worldObjects: null,
	
	init: function() {
		var canvas = document.getElementById("canvas");
		
		SimulationView.canvasWidth = canvas.clientWidth;
		SimulationView.canvasHeight = canvas.clientHeight;
		
		SimulationView.scene = new THREE.Scene();
		
		SimulationView.camera = new THREE.PerspectiveCamera(60, SimulationView.canvasWidth / SimulationView.canvasHeight, 1, 25000);
		SimulationView.camera.position.x = 7500;
		SimulationView.camera.position.y = 2500;
		SimulationView.camera.position.z = 7500;
		SimulationView.camera.lookAt(new THREE.Vector3(0, 0, 0));
		
		var ambientLight = new THREE.AmbientLight(0x404040);
		SimulationView.planetLight = new THREE.PointLight();
		SimulationView.planetLight.position.set(0, 0, 0);
		
		SimulationView.scene.add(ambientLight);
		SimulationView.scene.add(SimulationView.planetLight);
		
		SimulationView.renderer = new THREE.WebGLRenderer();
		SimulationView.renderer.setSize(SimulationView.canvasWidth, SimulationView.canvasHeight);
		SimulationView.renderer.setClearColor(0x000000, 1);
		
		SimulationView.controls = new THREE.TrackballControls(SimulationView.camera);
		SimulationView.controls.target.y = 10;
		SimulationView.controls.maxDistance = 10000;
		
		SimulationView.fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
		
		document.getElementById("canvas").appendChild(SimulationView.renderer.domElement);
		
		SimulationView.domElement = SimulationView.renderer.domElement;
		SimulationView.boundingRect = SimulationView.domElement.getBoundingClientRect();
		
		SimulationView.projector = new THREE.Projector();
		SimulationView.mouseVector = new THREE.Vector3();
		
		window.addEventListener(
			"keydown", 
			function(e) {
				if (e.keyCode == 70) {
					THREEx.FullScreen.request(SimulationView.domElement);
				}
			}, 
			false
		);
		
		window.addEventListener('mousemove', SimulationView.onMouseMove, false);
		window.addEventListener('resize', SimulationView.onWindowResize, false);
		
		SimulationView.worldObjects = new THREE.Object3D();
		SimulationView.scene.add(SimulationView.worldObjects);
	},
	
	//TODO there is a lot of game logic here that should not be in the view logic
	onMouseMove:function(e) {
		var x = (event.clientX - SimulationView.boundingRect.left) * (SimulationView.domElement.width / SimulationView.boundingRect.width);
		var y = (event.clientY - SimulationView.boundingRect.top) * (SimulationView.domElement.height / SimulationView.boundingRect.height);
		
		SimulationView.mouseVector.x = (x / SimulationView.canvasWidth) * 2 - 1;
		SimulationView.mouseVector.y = 1 - (y / SimulationView.canvasHeight) * 2;
		SimulationView.mouseVector.z = 0.5;
		
		var raycaster = SimulationView.projector.pickingRay(SimulationView.mouseVector.clone(), SimulationView.camera);
		var intersects = raycaster.intersectObjects(SimulationView.worldObjects.children);
		
		if (intersects.length > 0) {
			var worldParent = intersects[0].object.worldParent;
			
			if (worldParent instanceof Planet) {
				GUIController.resourceGUITarget = worldParent.colonies[0];
			}
			else {
				GUIController.resourceGUITarget = worldParent;
			}
		}
	},
	
	onWindowResize:function(e) {
		var canvas = document.getElementById("canvas");
		SimulationView.canvasWidth = canvas.clientWidth;
		SimulationView.canvasHeight = canvas.clientHeight;
		
		SimulationView.renderer.setSize(SimulationView.canvasWidth, SimulationView.canvasHeight);
		SimulationView.camera.aspect = SimulationView.canvasWidth / SimulationView.canvasHeight;
		SimulationView.camera.updateProjectionMatrix();
	},
	
	update: function() {
		SimulationController.update();
	},
	
	render: function() {
		if (SimulationView.renderer) {
			SimulationView.renderer.render(SimulationView.scene, SimulationView.camera);
		}
	},
	
	frame: function() {
		SimulationView.fpsMeter.tickStart();
		
		SimulationView.controls.update();
		
		GUIController.update();
		SimulationView.update();
		SimulationView.render();
		
		SimulationView.fpsMeter.tick();
		
		requestAnimationFrame(SimulationView.frame);
	}
}

/**
	based on view-source:http://stemkoski.github.io/three.js/skybox.html 23.07.2014
	Milky Way skybox source: https://code.google.com/p/osghimmel/downloads/detail?name=resources_milkyway_equatorial_1024.zip&can=1&q= 29.07.2014
**/
var SkyBox = {
	//TODO skybox image order is incorrect for milky way images.
	init:function() {
/* 		var imagePrefix = "images/milkyway_skybox1/";
		var images = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
		var imageSuffix = ".png";
		
		var skyboxVertShader = ;
		var skyboxFragShader = ;
		
		var materialArray = [];
		for (var i = 0; i < 6; i++) {
			var skyboxUniforms = {
				texture1: {type: "t", value: THREE.ImageUtils.loadTexture(imagePrefix + images[i] + imageSuffix)}
			};
			materialArray.push(new THREE.ShaderMaterial({
				uniforms: skyboxUniforms,
				vertexShader: skyboxVertShader,
				fragmentShader: skyboxFragShader,
				side: THREE.BackSide
			 }));
		}
		*/
		var skyboxGeometry = new THREE.SphereGeometry(9999, 60, 40);
		var skyboxUniforms = {
			texture1: {type: "t", value: THREE.ImageUtils.loadTexture("images/eso0932a.jpg")}
		}
		var skyboxMaterial = new THREE.ShaderMaterial({
			uniforms: skyboxUniforms,
			vertexShader: $('#unlit_tex_v_shader').text(),
			fragmentShader: $('#unlit_tex_f_shader').text(),
			side: THREE.BackSide
		});
		
		var skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
		
		SimulationView.scene.add(skyboxMesh);
	}
}

var GUIController = {
	resourceGUITarget:null,
	
	resourceGUIParams: {
		foodQuantity:0,
		foodPrice:0,
		waterQuantity:0,
		waterPrice:0,
		fuelQuantity:0,
		fuelPrice:0,
		metalQuantity:0,
		metalPrice:0,
	},
	
	init:function() {
		GUIController.resourceGUI = new dat.GUI({height: 4 * 32 - 1});
		GUIController.resourceGUI.add(GUIController.resourceGUIParams, 'foodQuantity').name('Food Quantity').listen();
		GUIController.resourceGUI.add(GUIController.resourceGUIParams, 'foodPrice').name('Food Price').listen();
		GUIController.resourceGUI.add(GUIController.resourceGUIParams, 'waterQuantity').name('Water Quantity').listen();
		GUIController.resourceGUI.add(GUIController.resourceGUIParams, 'waterPrice').name('Water Price').listen();
		GUIController.resourceGUI.add(GUIController.resourceGUIParams, 'fuelQuantity').name('Fuel Quantity').listen();
		GUIController.resourceGUI.add(GUIController.resourceGUIParams, 'fuelPrice').name('Fuel Price').listen();
		GUIController.resourceGUI.add(GUIController.resourceGUIParams, 'metalQuantity').name('Metal Quantity').listen();
		GUIController.resourceGUI.add(GUIController.resourceGUIParams, 'metalPrice').name('Metal Price').listen();
	},
	
	update:function() {
		if (GUIController.resourceGUITarget) {
			GUIController.resourceGUIParams.foodQuantity = GUIController.resourceGUITarget.economy.getResourceByName('food').quantity;
			GUIController.resourceGUIParams.waterQuantity = GUIController.resourceGUITarget.economy.getResourceByName('water').quantity
			GUIController.resourceGUIParams.fuelQuantity = GUIController.resourceGUITarget.economy.getResourceByName('fuel').quantity
			GUIController.resourceGUIParams.metalQuantity = GUIController.resourceGUITarget.economy.getResourceByName('metal').quantity
			GUIController.resourceGUIParams.foodPrice = GUIController.resourceGUITarget.economy.getResourceByName('food').price;
			GUIController.resourceGUIParams.waterPrice = GUIController.resourceGUITarget.economy.getResourceByName('water').price
			GUIController.resourceGUIParams.fuelPrice = GUIController.resourceGUITarget.economy.getResourceByName('fuel').price
			GUIController.resourceGUIParams.metalPrice = GUIController.resourceGUITarget.economy.getResourceByName('metal').price
		}
	}
}

var SimulationController = {
	numPlanets:6,
	numColonies:6,
	numTraders:500,
	
	planets:[],
	colonies:[],
	traders:[],
	
	init:function() {
		//create planets
		var skyGeometry = new THREE.SphereGeometry(PlanetSpec.world1.outerRadius, 500, 500);
		var groundGeometry = new THREE.SphereGeometry(PlanetSpec.world1.innerRadius, 64, 64);
		
		for (var i = 0; i < SimulationController.numPlanets; i++) {
			//find free locations for planets using crude monte carlo method(?)
			var planetPosition = null;
			var foundPosition = false;
			while(!foundPosition) {
				foundPosition = true;
				planetPosition = vec3.random(vec3.create(), Math.random() * SolarSystemSpec.system1.maxPlanetSpread);
				for (var j = 0; j < SimulationController.planets.length; j++) {
					if (vec3.distance(planetPosition, SimulationController.planets[j].body.position) < SolarSystemSpec.system1.minPlanetDistance) {
						foundPosition = false;
					}
				}
			}
			
			//planetPosition = vec3.fromValues(300 * Math.random(), 300 * Math.random(), 100);
			var planetBody = new Body(planetPosition, 0, 0, 0)
			
			var skyUniforms = {
				cameraPos: {type:'v3', value: new THREE.Vector3(0.0, 0.0, 0.0)},
				cameraHeight2: {type:'f', value: 0},
				lightDir: {type:'v3', value: new THREE.Vector3(1e8, 0, 1e8).normalize()},
				invWaveLength: {type:'v3', value: new THREE.Vector3(1.0/Math.pow(PlanetSpec.world1.waveLength[0],4), 1.0/Math.pow(PlanetSpec.world1.waveLength[1],4), 1.0/Math.pow(PlanetSpec.world1.waveLength[2],4))},
				outerRadius: {type:'f', value:PlanetSpec.world1.outerRadius},
				outerRadius2: {type:'f', value:PlanetSpec.world1.outerRadius * PlanetSpec.world1.outerRadius},
				innerRadius: {type:'f', value:PlanetSpec.world1.innerRadius},
				innerRadius2: {type:'f', value:PlanetSpec.world1.innerRadius * PlanetSpec.world1.innerRadius},
				krESun: {type:'f', value:PlanetSpec.world1.kr * PlanetSpec.world1.eSun},
				kmESun: {type:'f', value:PlanetSpec.world1.km * PlanetSpec.world1.eSun},
				kr4Pi: {type:'f', value:PlanetSpec.world1.kr * 4 * Math.PI},
				km4Pi: {type:'f', value:PlanetSpec.world1.km * 4 * Math.PI},
				scale: {type:'f', value:1 / (PlanetSpec.world1.outerRadius - PlanetSpec.world1.innerRadius)},
				scaleDepth: {type:'f', value:PlanetSpec.world1.scaleDepth},
				scaleOverScaleDepth: {type:'f', value:1 / (PlanetSpec.world1.outerRadius - PlanetSpec.world1.innerRadius) / PlanetSpec.world1.scaleDepth},
			};

			var groundUniforms = {
				planetTexture: {type: "t", value: THREE.ImageUtils.loadTexture('images/plutomap1k.jpg')},
				cameraPos: {type:'v3', value: new THREE.Vector3(0.0, 0.0, 0.0)},
				cameraHeight2: {type:'f', value: 0},
				lightDir: {type:'v3', value: new THREE.Vector3(1e8, 0, 1e8).normalize()},
				invWaveLength: {type:'v3', value: new THREE.Vector3(1.0/Math.pow(PlanetSpec.world1.waveLength[0],4), 1.0/Math.pow(PlanetSpec.world1.waveLength[1],4), 1.0/Math.pow(PlanetSpec.world1.waveLength[2],4))},
				outerRadius: {type:'f', value:PlanetSpec.world1.outerRadius},
				outerRadius2: {type:'f', value:PlanetSpec.world1.outerRadius * PlanetSpec.world1.outerRadius},
				innerRadius: {type:'f', value:PlanetSpec.world1.innerRadius},
				innerRadius2: {type:'f', value:PlanetSpec.world1.innerRadius * PlanetSpec.world1.innerRadius},
				krESun: {type:'f', value:PlanetSpec.world1.kr * PlanetSpec.world1.eSun},
				kmESun: {type:'f', value:PlanetSpec.world1.km * PlanetSpec.world1.eSun},
				kr4Pi: {type:'f', value:PlanetSpec.world1.kr * 4 * Math.PI},
				km4Pi: {type:'f', value:PlanetSpec.world1.km * 4 * Math.PI},
				scale: {type:'f', value:1 / (PlanetSpec.world1.outerRadius - PlanetSpec.world1.innerRadius)},
				scaleDepth: {type:'f', value:PlanetSpec.world1.scaleDepth},
				scaleOverScaleDepth: {type:'f', value:1 / (PlanetSpec.world1.outerRadius - PlanetSpec.world1.innerRadius) / PlanetSpec.world1.scaleDepth},
			};
		
			var skyMaterial = new THREE.ShaderMaterial({
				uniforms: skyUniforms,
				vertexShader: $('#atmosphere_v_shader').text(),
				fragmentShader: $('#atmosphere_f_shader').text(),
				side: THREE.BackSide,
				transparent: true,
				blending: THREE.AdditiveBlending
			});
			
			var groundMaterial = new THREE.ShaderMaterial({
				uniforms: groundUniforms,
				vertexShader: $('#ground_v_shader').text(),
				fragmentShader: $('#ground_f_shader').text(),
			});
			
			var skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
			var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
			
			var planetView = new View();
			planetView.meshes.push(skyMesh);
			planetView.meshes.push(groundMesh);
			
			//generate planet resources
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
			
			SimulationController.planets.push(new Planet(planetBody, planetView, planetEconomy));
			
			if (SimulationView.worldObjects) {
				for (var j = 0; j < planetView.meshes.length; j++) {
					SimulationView.worldObjects.add(planetView.meshes[j]);
				}
			}
		}
		
		//create colonies
		for (var i = 0; i < SimulationController.numColonies; i++) {
			var colony = new Colony(SimulationController.planets[i % SimulationController.planets.length], new Economy());
			SimulationController.planets[i % SimulationController.planets.length].colonies.push(colony);
			SimulationController.colonies.push(colony);
		}
		
		//create traders
		var traderGeometry = new THREE.BoxGeometry(1, 1, 1);
		var traderMaterial = new THREE.ShaderMaterial({
			vertexShader: $('#unlit_v_shader').text(),
			fragmentShader: $('#unlit_f_shader').text(),
		});
		
		//var traderMaterial = new THREE.MeshBasicMaterial({color: 0x003344});
		for (var i = 0; i < SimulationController.numTraders; i++) {
			var traderPosition = vec3.random(vec3.create(), Math.random() * SimulationController.maxPlanetSpread); //TODO implement max trader spread
			var traderBody = new Body(traderPosition, 1, 0.02, 0.3);
			
			var traderView = new View();
			traderView.meshes.push(new THREE.Mesh(traderGeometry, traderMaterial));
			
			var traderEconomy = new Economy();
			
			SimulationController.traders.push(new Trader(traderBody, traderView, traderEconomy));
			
			if (SimulationView.worldObjects) {
				for (var j = 0; j < traderView.meshes.length; j++) {
					SimulationView.worldObjects.add(traderView.meshes[j]);
				}
			}
		}
	},
	
	update:function() {
		//update colonies and traders using TraderController and ColonyController#
		var lightPos = SimulationView.planetLight.position;
		for (var i = 0; i < SimulationController.planets.length; i++) {
			var planetPos = new THREE.Vector3(SimulationController.planets[i].body.position[0], SimulationController.planets[i].body.position[1], SimulationController.planets[i].body.position[2]);;
			var relativeCameraPos = new THREE.Vector3().subVectors(SimulationView.camera.position, planetPos);
			var cameraHeight = relativeCameraPos.length();
			var cameraHeight2 = cameraHeight * cameraHeight;
			var lightDir = lightPos.sub(planetPos).normalize();
			
			for (var j = 0; j < SimulationController.planets[i].view.meshes.length; j++) {
				//TODO need to deal with situations where mesh doesn't have said unifroms - probably have specific update functionn in view or planet object
				SimulationController.planets[i].view.meshes[j].material.uniforms.cameraPos.value = relativeCameraPos;
				SimulationController.planets[i].view.meshes[j].material.uniforms.cameraHeight2.value = cameraHeight2;
				SimulationController.planets[i].view.meshes[j].material.uniforms.lightDir.value = lightDir;
			}
			
			if (SimulationController.planets[i].view.needsUpdate) {
				SimulationController.planets[i].view.update(SimulationController.planets[i].body.position);
				SimulationController.planets[i].view.needsUpdate = false;
			}
		}
		for (var i = 0; i < SimulationController.traders.length; i++) {
			TraderController.updateTrader(SimulationController.traders[i]);
			if (SimulationController.traders[i].view.needsUpdate) {
				SimulationController.traders[i].view.update(SimulationController.traders[i].body.position);
				SimulationController.traders[i].view.needsUpdate = false;
			}
		}
		for (var i = 0; i < SimulationController.colonies.length; i++) {
			ColonyController.updateColony(SimulationController.colonies[i]);
		}
	}
}

var TraderController = {
	updateTrader:function(trader) {
		if (trader.destination == null) {
			TraderController.getNewDestination(trader);
		}
		
		if (trader.destination != null) {
			var destinationVec = vec3.subtract(vec3.create(), trader.destination.planet.body.position, trader.body.position);
			
			if (vec3.length(destinationVec) <= trader.interactionRange) {
				if (trader.economy.hasResources()) {
					TraderController.sellResources(trader, trader.destination);
				}
				else {
					TraderController.buyResources(trader, trader.destination);
				}
				trader.destination = null;
				//return; TODO why do we need to return here?
			}
			
			var direction = vec3.normalize(vec3.create(), destinationVec);
			
			trader.body.move(direction);
		}
		
		trader.view.needsUpdate = true;
		//trader.view.update(trader.body.position);
	},
	
	getNewDestination:function(trader) {
		var highColony;
		
		var lowColony;
		var lowResource;
		
		var highPrice = 0;
		var lowPrice = Number.MAX_VALUE;
		
		for (var i = 0; i < SimulationController.colonies.length; i++) {
			var distance = vec3.distance(SimulationController.colonies[i].planet.body.position, trader.body.position);
			
			for (var j = 0; j < SimulationController.colonies[i].economy.resources.length; j++) { //TODO dividing and multiplying by distance is probably an inaccurate method of ensuring that the best price/distance ratio is found
				if (SimulationController.colonies[i].economy.resources[j].quantity > 0 && SimulationController.colonies[i].economy.resources[j].price * distance <= lowPrice) { //TODO what if multiple traders purchase resource and there is not enough present
					lowColony = SimulationController.colonies[i];
					lowResource = SimulationController.colonies[i].economy.resources[j].name;
					lowPrice = SimulationController.colonies[i].economy.resources[j].price * distance;
				}
			}
			
			for (var j = 0; j < trader.economy.resources.length; j++) {
				if (trader.economy.resources[j].quantity > 0 && SimulationController.colonies[i].economy.getResourceByName(trader.economy.resources[j].name).price / distance >= highPrice) {
					highColony = SimulationController.colonies[i];
					highPrice = SimulationController.colonies[i].economy.getResourceByName(trader.economy.resources[j].name).price / distance;
				}
			}
		}
		
		if (trader.economy.hasResources() && highColony) {
			trader.destination = highColony; //TODO does not check whether or not the high price was for the correct resource
		}
		else if (lowColony) {
			trader.destination = lowColony;
			trader.targetResource = lowResource;
		}
	},
	
	sellResources:function(trader, colony) {
		//TODO currently just dumps resources
		for (var i = 0; i < trader.economy.resources.length; i++) {
			colony.economy.changeResourceQuantity(trader.economy.resources[i].name, trader.economy.resources[i].quantity);
			trader.economy.setResourceQuantity(trader.economy.resources[i].name, 0); //TODO replace setResourceQuantity() with clearResource().
		}
	},
	
	buyResources:function(trader, colony) {
		//TODO currently just adds resource to trader without removing it from colony, need to add trade interaction with colony
		trader.economy.changeResourceQuantity(trader.targetResource, 1);
		colony.economy.changeResourceQuantity(trader.targetResource, -1);
	}
}

var ColonyController = {
	updateColony:function(colony) {
		//harvest resources
		for (var i = 0; i < colony.planet.economy.resources.length; i++) {
			if (colony.planet.economy.resources[i].quantity > 0) {
				colony.economy.changeResourceQuantity(colony.planet.economy.resources[i].name, 1);
				//colony.planet.economy.changeResourceQuantity(colony.planet.economy.resources[i].name, -1);
			}
		}
		
		//set prices
		for (var i = 0; i < colony.economy.resources.length; i++) {
			if (colony.economy.resources[i].quantity <= 0) {
				colony.economy.changeResourcePrice(colony.economy.resources[i].name, 1);
			}
			else if (colony.economy.resources[i].quantity > 0) {
				colony.economy.changeResourcePrice(colony.economy.resources[i].name, -1);
			}
		}
	}
}

//TODO is an object needed for resource? Should it just be a value on Planet, Ship and Colony objects? How to do enum that defines resource chain? Should each container have a single Resources object that contains the name and quantity of each resource?

//TODO possibly change this to use names as array indices, e.g. resources["food"] = {quantity:0, buyPrice:0}, etc.
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

function Body(position, mass, force, maxVelocity) {
	this.position = position;
	this.mass = mass;
	this.force = force;
	this.maxVelocity = maxVelocity;
	this.velocity = vec3.create();
}

Body.prototype = {
	move:function(direction, acceleration) {
		vec3.scaleAndAdd(this.velocity, this.velocity, direction, this.force / this.mass);
		
		if (vec3.length(this.velocity) > this.maxVelocity) {
			vec3.normalize(this.velocity, this.velocity);
			vec3.scale(this.velocity, this.velocity, this.maxVelocity);
		}
		
		vec3.add(this.position, this.position, this.velocity); 
	}
}

function View() {
	this.meshes = [];
	//this.mesh.position.set(position[0], position[1], position[2]);
	this.needsUpdate = true;
}

View.prototype = {
	update:function(position) {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].position.set(position[0], position[1], position[2]);
		}
	},
	
	setWorldParent:function(worldParent) {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].worldParent = worldParent;
		}
	}
}

function Planet(body, view, economy) {
	this.body = body;
	this.view = view;
	this.economy = economy;
	this.colonies = [];
	
	this.view.setWorldParent(this);
}

var PlanetSpec = {
	world1: {
		waveLength: [0.65, 0.57, 0.475],
		outerRadius: 51.25,
		innerRadius: 50,
		eSun: 50,
		kr: 0.0025,
		km: 0.001,
		scaleDepth: 0.25
	}
}

var SolarSystemSpec = {
	system1: {
		minPlanetDistance:300,
		maxPlanetSpread:5000
	}
}

function Trader(body, view, economy) {
	this.body = body;
	this.view = view;
	this.economy = economy;
	
	this.interactionRange = 5;
	
	this.targetResource = null;
	this.destination = null;
	
	this.view.setWorldParent(this)
}

function Colony(planet, economy) {
	this.planet = planet;
	this.economy = economy;
}