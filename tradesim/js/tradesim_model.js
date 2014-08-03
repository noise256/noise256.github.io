window.onload = function() {
	SimulationView.init();
	SkyBox.init();
	GUIController.init();
	
	SimulationController.init();

	SimulationView.frame();
}

var SimulationView = {
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
		SimulationView.scene = new THREE.Scene();
		
		SimulationView.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
		SimulationView.camera.position.x = 0;
		SimulationView.camera.position.y = 0;
		SimulationView.camera.position.z = 7500;
		SimulationView.camera.lookAt(new THREE.Vector3(0, 0, 0));
		
		//var ambientLight = new THREE.AmbientLight(0x404040);
		//SimulationView.planetLight = new THREE.PointLight();
		//SimulationView.planetLight.position.set(0.0, 0.0, 0.0);
		
		//SimulationView.scene.add(ambientLight);
		//SimulationView.scene.add(SimulationView.planetLight);
		
		SimulationView.renderer = new THREE.WebGLRenderer();
		SimulationView.renderer.setSize(window.innerWidth, window.innerHeight);
		SimulationView.renderer.setClearColor(0x000000, 1);
		
		SimulationView.controls = new THREE.TrackballControls(SimulationView.camera);
		SimulationView.controls.target.y = 10;
		SimulationView.controls.maxDistance = 35000;
		
		SimulationView.fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
		
		document.getElementById("canvas").appendChild(SimulationView.renderer.domElement);
		
		SimulationView.projector = new THREE.Projector();
		SimulationView.mouseVector = new THREE.Vector3();
		
		THREEx.WindowResize(SimulationView.renderer, SimulationView.camera);
		THREEx.FullScreen.bindKey({charCode: 'f'.charCodeAt(0)});
		
		window.addEventListener('mousemove', SimulationView.onMouseMove, false);
		window.addEventListener('resize', SimulationView.onWindowResize, false);
		
		SimulationView.worldObjects = new THREE.Object3D();
		SimulationView.scene.add(SimulationView.worldObjects);
	},
	
	//TODO there is a lot of game logic here that should not be in the view logic
	onMouseMove:function(e) {
		SimulationView.mouseVector = new THREE.Vector3(
			(event.clientX / window.innerWidth) * 2 - 1, 
			1 - (event.clientY / window.innerHeight) * 2,
			0.5
		);
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
		var skyboxGeometry = new THREE.SphereGeometry(49999, 60, 60);
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
		
		SimulationView.scene.add(new THREE.Mesh(skyboxGeometry, skyboxMaterial));
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
	numTraders:100,
	
	planets:[],
	colonies:[],
	traders:[],
	
	selector:null,
	
	init:function() {
		//create selector
		//var selectorGeometry = new THREE.PlaneGeometry(1000, 1000);
		var selectorMaterial = new THREE.SpriteMaterial({map: THREE.ImageUtils.loadTexture("images/selection_ring.png")});
		
		var selectorSprite = new THREE.Sprite(selectorMaterial);
		selectorSprite.scale.set( 1024, 1024, 1.0 );
		selectorSprite.position.set(1000, 0.0, 0.0);
		var selectorView = new View();
		selectorView.meshes.push({name: 'selectorMesh', value: selectorSprite});
		SimulationView.worldObjects.add(selectorSprite);
		
		SimulationController.selector = new Selector(selectorView);
		
		//create star
		var starSize = 500;
		
		var starPosition = new THREE.Vector3(0.0, 0.0, 0.0);
		var starGeometry = new THREE.SphereGeometry(starSize, 64, 64);
		var starMaterial = new THREE.MeshBasicMaterial({color: 0xfff5f2});
		
		SimulationView.worldObjects.add(new THREE.Mesh(starGeometry, starMaterial));
		
		//create planets
		var skyGeometry = new THREE.SphereGeometry(PlanetSpec.world1.outerRadius, 500, 500);
		var groundGeometry = new THREE.SphereGeometry(PlanetSpec.world1.innerRadius, 64, 64);
		var groundTexture = THREE.ImageUtils.loadTexture('images/plutomap1k.jpg');
		
		for (var i = 0; i < SimulationController.numPlanets; i++) {
			//find free locations for planets using crude monte carlo method(?)
			var planetPosition = null;
			var foundPosition = false;
			while(!foundPosition) {
				foundPosition = true;
				var randVector = vec3.random(vec3.create(), Math.random() * (SolarSystemSpec.system1.maxPlanetSpread - starSize + 1) + starSize);
				planetPosition = new THREE.Vector3(randVector[0], randVector[1] * 0.05, randVector[2]);
				
				for (var j = 0; j < SimulationController.planets.length; j++) {
					if (planetPosition.distanceTo(SimulationController.planets[j].body.position) < SolarSystemSpec.system1.minPlanetDistance) {
						foundPosition = false;
					}
				}
			}
			var planetBody = new Body(planetPosition, 0, 0, 0)
			
			var skyUniforms = {
				cameraPos: {type:'v3', value: new THREE.Vector3(0.0, 0.0, 0.0)},
				cameraHeight2: {type:'f', value: 0},
				lightDir: {type:'v3', value: new THREE.Vector3(starPosition.x - planetPosition.x, starPosition.y - planetPosition.y, starPosition.z - planetPosition.z).normalize()},
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
				dayTexture: {type: "t", value: groundTexture},
				nightTexture: {type: "t", value: groundTexture},
				cameraPos: {type:'v3', value: new THREE.Vector3(0.0, 0.0, 0.0)},
				cameraHeight2: {type:'f', value: 0},
				lightDir: {type:'v3', value: new THREE.Vector3(starPosition.x - planetPosition.x, starPosition.y - planetPosition.y, starPosition.z - planetPosition.z).normalize()},
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
			planetView.meshes.push({name: 'skyMesh', value: skyMesh});
			planetView.meshes.push({name: 'groundMesh', value: groundMesh});
			
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
					SimulationView.worldObjects.add(planetView.meshes[j].value);
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
		var traderGeometry = new THREE.SphereGeometry(10, 32, 32);
		
		for (var i = 0; i < SimulationController.numTraders; i++) {
			var randVector = vec3.random(vec3.create(), Math.random() * SolarSystemSpec.system1.maxPlanetSpread); //TODO implement max trader spread
			var traderPosition = new THREE.Vector3(randVector[0], 0.0, randVector[2]);
			var traderBody = new Body(traderPosition, 1, 0.5, 10.0);
			
			var traderMaterial = new THREE.ShaderMaterial({
				uniforms: {
					colour: {type: 'v3', value: new THREE.Vector3(1.0, 0.0, 0.0)}
				},
				vertexShader: $('#unlit_v_shader').text(),
				fragmentShader: $('#unlit_f_shader').text(),
			});
			
			var traderView = new View();
			traderView.meshes.push({name: 'traderMesh', value: new THREE.Mesh(traderGeometry, traderMaterial)});
			
			var traderEconomy = new Economy();
			
			SimulationController.traders.push(new Trader(traderBody, traderView, traderEconomy));
			
			if (SimulationView.worldObjects) {
				for (var j = 0; j < traderView.meshes.length; j++) {
					SimulationView.worldObjects.add(traderView.meshes[j].value);
				}
			}
		}
	},
	
	update:function() {
		if (SimulationView.mouseVector) {
			var raycaster = SimulationView.projector.pickingRay(SimulationView.mouseVector.clone(), SimulationView.camera);
		
			//TODO don't bother doing intersects if object is too far away
			var intersects = raycaster.intersectObjects(SimulationView.worldObjects.children);
		
			if (intersects.length > 0) {
				var worldParent = intersects[0].object.worldParent;
			
				if (worldParent instanceof Planet) {
					GUIController.resourceGUITarget = worldParent.colonies[0];
				}
				else {
					GUIController.resourceGUITarget = worldParent;
				}
				
				SimulationController.selector.target = worldParent;
			}
			
			SimulationView.mouseVector = null;
		}
			
		if (SimulationController.selector) {
			SimulationController.selector.update();
		}
				
		for (var i = 0; i < SimulationController.planets.length; i++) {
			SimulationController.planets[i].update();
		}
		for (var i = 0; i < SimulationController.traders.length; i++) {
			TraderController.updateTrader(SimulationController.traders[i]);
			SimulationController.traders[i].update();
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
			var destinationVec = new THREE.Vector3().subVectors(trader.destination.planet.body.position, trader.body.position);
			
			if (destinationVec.length() <= trader.interactionRange) {
				if (trader.economy.hasResources()) {
					TraderController.sellResources(trader, trader.destination);
				}
				else {
					TraderController.buyResources(trader, trader.destination);
				}
				trader.destination = null;
			}
			
			trader.body.move(destinationVec.normalize());
		}
	},
	
	getNewDestination:function(trader) {
		var highColony;
		
		var lowColony;
		var lowResource;
		
		var highPrice = 0;
		var lowPrice = Number.MAX_VALUE;
		
		for (var i = 0; i < SimulationController.colonies.length; i++) {
			var distance = SimulationController.colonies[i].planet.body.position.distanceTo(trader.body.position);
			
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

function Selector(view) {
	this.view = view;
	this.target = null;
}

Selector.prototype = {
	update:function() {
		if (this.target) {
			this.view.update(this.target.body.position);
		}
	}
}

function Star(body, view) {
	this.body = body;
	this.view = view;
	
	this.view.setWorldParent(this);
}

function Planet(body, view, economy) {
	this.body = body;
	this.view = view;
	this.economy = economy;
	this.colonies = [];
	
	this.view.setWorldParent(this);
}

Planet.prototype = {
	update:function() {
		this.view.update(this.body.position);
		
		this.updateUniforms();
	},
	
	updateUniforms:function() {
		var relativeCameraPos = new THREE.Vector3().subVectors(SimulationView.camera.position, this.body.position);
		var cameraHeight2 = relativeCameraPos.length() * relativeCameraPos.length();
		
		this.view.getMeshByName('skyMesh').value.material.uniforms.cameraPos.value = relativeCameraPos;
		this.view.getMeshByName('skyMesh').value.material.uniforms.cameraHeight2.value = cameraHeight2;
		
		this.view.getMeshByName('groundMesh').value.material.uniforms.cameraPos.value = relativeCameraPos;
		this.view.getMeshByName('groundMesh').value.material.uniforms.cameraHeight2.value = cameraHeight2;
	}
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
		minPlanetDistance:1500,
		maxPlanetSpread:15000
	}
}

function Trader(body, view, economy) {
	this.body = body;
	this.view = view;
	this.economy = economy;
	
	this.interactionRange = 50;
	
	this.targetResource = null;
	this.destination = null;
	
	this.view.setWorldParent(this)
}

Trader.prototype = {
		update:function() {
		this.view.update(this.body.position);
		
		this.updateUniforms();
	},
	
	//TODO creating new vectors each loop is unnecessary
	updateUniforms:function() {
		if (this.economy.hasResources()) {
			this.view.getMeshByName('traderMesh').value.material.uniforms.colour.value = new THREE.Vector3(0.0, 1.0, 0.0);
		}
		else {
			this.view.getMeshByName('traderMesh').value.material.uniforms.colour.value = new THREE.Vector3(1.0, 0.0, 0.0);
		}
	}
}

function Colony(planet, economy) {
	this.planet = planet;
	this.economy = economy;
}