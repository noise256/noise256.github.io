window.onload = function() {
	SimulationView.init();
	SkyBox.init();
	
	SimulationController.init();
	
	SimulationView.frame();
}

var SimulationView = {
	canvasWidth: null,
	canvasHeight: null,
	
	fpsMeter: null, 
	
	scene: null,
	camera: null, 
	renderer: null,
	projector: null,
	mouseVector: null,
	
	worldObjects: null,
	
	init: function() {
		var canvas = document.getElementById("canvas");
		
		SimulationView.canvasWidth = canvas.clientWidth;
		SimulationView.canvasHeight = canvas.clientHeight;
		
		SimulationView.fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
		
		SimulationView.scene = new THREE.Scene();
		
		SimulationView.camera = new THREE.PerspectiveCamera(60, SimulationView.canvasWidth / SimulationView.canvasHeight, 1, 10000);
		SimulationView.camera.position.x = 24;
		SimulationView.camera.position.y = 10;
		SimulationView.camera.position.z = 24;
		SimulationView.camera.lookAt(new THREE.Vector3(0, 10, 0));
		
		var controls = new THREE.OrbitControls(SimulationView.camera, canvas);
		controls.target.y = 10;
		controls.maxDistance = 2000;
		
		var ambientLight = new THREE.AmbientLight(0x404040);
		var mainLight = new THREE.PointLight();
		mainLight.position.set(50, 150, 150);
		
		SimulationView.scene.add(ambientLight);
		SimulationView.scene.add(mainLight);
		
		SimulationView.renderer = new THREE.WebGLRenderer();
		SimulationView.renderer.setSize(SimulationView.canvasWidth, SimulationView.canvasHeight);
		SimulationView.renderer.setClearColor(0x000000, 1);
		
		SimulationView.projector = new THREE.Projector();
		SimulationView.mouseVector = new THREE.Vector3();
		
		SimulationView.worldObjects = new THREE.Object3D();
		SimulationView.scene.add(worldObjects);
		
		window.addEventListener('mousemove', SimulationView.onMouseMove, false);
		
		document.getElementById("canvas").appendChild(SimulationView.renderer.domElement);
	},
	
	onMouseMove:function(e) {
		SimulationView.mouseVector.x = 2 * (e.clientX / SimulationView.canvasWidth) - 1;
		SimulationView.mouseVector.y = 1 - 2 * (e.clientY / SimulationView.canvasHeight);
		
		var raycaster = SimulationView.projector.pickingRay(SimulationView.mouseVector.clone(), SimulationView.camera);
		var intersects = raycaster.intersectObjects(SimulationView.worldObjects.children);
		
		for (var i = 0; i < SimulationView.worldObjects.children.length; i++) {
			SimulationView.worldObjects.children[i].material.color.setRGB(1, 1, 1);
		}
		
		for (var i = 0; i < intersects.length; i++) {
			console.warn('intersects ' + intersects[i].object.uuid);
			intersects[i].object.material.color.setRGB(1, 0, 0);
		}
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

		SimulationView.update();
		SimulationView.render();
		
		SimulationView.fpsMeter.tick();
		
		requestAnimationFrame(SimulationView.frame);
	}
}

/**
	based on view-source:http://stemkoski.github.io/three.js/skybox.html 23.07.2014
**/
var SkyBox = {
	init:function() {
		var imagePrefix = "images/spacebox/";
		var images = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
		var imageSuffix = ".png";
		
		var materialArray = [];
		for (var i = 0; i < 6; i++) {
			materialArray.push(new THREE.MeshBasicMaterial({
				color: 0xffffff,
				map: THREE.ImageUtils.loadTexture(imagePrefix + images[i] + imageSuffix),
				side: THREE.BackSide
			}));
		}
		
		SimulationView.scene.add(new THREE.Mesh(
			new THREE.BoxGeometry(5000, 5000, 5000), 
			new THREE.MeshFaceMaterial(materialArray)
		));
	}
}

var SimulationController = {
	numPlanets:5,
	numColonies:5,
	numTraders:150,
	
	minSystemDistance:20,
	maxPlanetSpread:350,
	
	planets:[],
	colonies:[],
	traders:[],
	
	init:function() {
		//create planets
		var planetGeometry = new THREE.SphereGeometry(5, 32, 32);
			
		for (var i = 0; i < SimulationController.numPlanets; i++) {
			//find free locations for planets using crude monte carlo method(?)
			var planetPosition = null;
			var foundPosition = false;
			while(!foundPosition) {
				foundPosition = true;
				planetPosition = vec3.random(vec3.create(), Math.random() * SimulationController.maxPlanetSpread);
				for (var j = 0; j < SimulationController.planets.length; j++) {
					if (vec3.distance(planetPosition, SimulationController.planets[j].body.position) < SimulationController.minSystemDistance) {
						foundPosition = false;
					}
				}
			}
			
			var planetBody = new Body(planetPosition, 0, 0, 0);
			
			var planetMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});//{map: THREE.ImageUtils.loadTexture('images/sedna.jpg')}); //TODO move this back to make planet texture non-independent if not needed
			var planetView = new View(planetGeometry, planetMaterial);
			
			//generate planet resources
			var planetEconomy = new Economy();
			if (Math.random() > 0.5) {
				planetEconomy.setResourceQuantity('FOOD', 1);
			}
			if (Math.random() > 0.5) {
				planetEconomy.setResourceQuantity('WATER', 1);
			}
			if (Math.random() > 0.5) {
				planetEconomy.setResourceQuantity('FUEL', 1);
			}
			if (Math.random() > 0.5) {
				planetEconomy.setResourceQuantity('METAL', 1);
			}
			
			SimulationController.planets.push(new Planet(planetBody, planetView, planetEconomy));
			
			if (SimulationView.worldObjects) {
				SimulationView.worldObjects.add(planetView.mesh);
			}
		}
		
		//create colonies
		for (var i = 0; i < SimulationController.numColonies; i++) {
			SimulationController.colonies.push(new Colony(SimulationController.planets[i % SimulationController.planets.length], new Economy()));
		}
		
		//create traders
		var traderGeometry = new THREE.SphereGeometry(1, 32, 32);
		var traderMaterial = new THREE.MeshPhongMaterial({color: 0x003344});
		for (var i = 0; i < SimulationController.numTraders; i++) {
			var traderBody = new Body(vec3.create(), 1, 0.005, 0.3);
			var traderView = new View(traderGeometry, traderMaterial);
			var traderEconomy = new Economy();
			
			SimulationController.traders.push(new Trader(traderBody, traderView, traderEconomy));
			
			if (SimulationView.worldObjects) {
				SimulationView.worldObjects.add(traderView.mesh);
			}
		}
	},
	
	update:function() {
		//update colonies and traders using TraderController and ColonyController
		for (var i = 0; i < SimulationController.planets.length; i++) {
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
			var destinationVec = vec3.subtract(vec3.create(), trader.destination, trader.body.position);
			
			if (vec3.length(destinationVec) <= trader.interactionRange) {
				if (trader.economy.hasResources()) {
					TraderController.sellResources(trader);
				}
				else {
					TraderController.buyResources(trader);
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
		
		var highPrice = Number.MIN_VALUE;
		var lowPrice = Number.MAX_VALUE;
		
		for (var i = 0; i < SimulationController.colonies.length; i++) {
			var distance = vec3.distance(SimulationController.colonies[i].planet.body.position, trader.body.position);
			
			for (var j = 0; j < SimulationController.colonies[i].economy.resources.length; j++) { //TODO dividing and multiplying by distance is probably an inaccurate method of ensuring that the best price/distance ratio is found
				if (SimulationController.colonies[i].economy.resources[j].quantity > 0 && SimulationController.colonies[i].economy.resources[j].buyPrice * distance <= lowPrice) { //TODO what if multiple traders purchase resource and there is not enough present
					lowColony = SimulationController.colonies[i];
					lowResource = SimulationController.colonies[i].economy.resources[j].name;
					lowPrice = SimulationController.colonies[i].economy.resources[j].buyPrice * distance;
				}
				if (SimulationController.colonies[i].economy.resources[j].buyPrice / distance >= highPrice) {
					highColony = SimulationController.colonies[i];
					highPrice = SimulationController.colonies[i].economy.resources[j].buyPrice / distance;
				}
			}
		}
		
		if (trader.economy.hasResources() && highColony) {
			trader.destination = highColony.planet.body.position; //TODO does not check whether or not the high price was for the correct resource
		}
		else if (lowColony) {
			trader.destination = lowColony.planet.body.position;
			trader.targetResource = lowResource;
		}
	},
	
	sellResources:function(trader) {
		//TODO currently just dumps resources
		for (var i = 0; i < trader.economy.resources.length; i++) {
			trader.economy.setResourceQuantity(trader.economy.resources[i].name, 0); //TODO replace setResourceQuantity() with clearResource().
		}
	},
	
	buyResources:function(trader) {
		//TODO currently just adds resource to trader without removing it from colony, need to add trade interaction with colony
		trader.economy.changeResourceQuantity(trader.targetResource, 1);
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
			if (colony.economy.resources[i].quantity < 1) {
				colony.economy.resources[i].buyPrice += 1;
			}
			else if (colony.economy.resources[i].quantity > 0) {
				colony.economy.resources[i].buyPrice -= 1;
			}
		}
	}
}

//TODO is an object needed for resource? Should it just be a value on Planet, Ship and Colony objects? How to do enum that defines resource chain? Should each container have a single Resources object that contains the name and quantity of each resource?
function Economy() {
	this.resources = [	
		{name: 'FOOD', quantity: 0, buyPrice: 1500},
		{name: 'WATER', quantity: 0, buyPrice: 1500},
		{name: 'FUEL', quantity: 0, buyPrice: 1500},
		{name: 'METAL', quantity: 0, buyPrice: 1500}
	];
}

Economy.prototype = {
	setResourceQuantity:function(name, quantity) {
		for (var i = 0; i < this.resources.length; i++) {
			if (this.resources[i].name == name) {
				this.resources[i].quantity = quantity;
			}
		}
	},
	
	changeResourceQuantity:function(name, change) {
		for (var i = 0; i < this.resources.length; i++) {
			if (this.resources[i].name == name) {
				this.resources[i].quantity += change;
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

function View(geometry, material, position) {
	var geometry = geometry;
	var material = material;
	
	this.mesh = new THREE.Mesh(geometry, material);
	this.needsUpdate = true;
}

View.prototype = {
	update:function(position) {
		this.mesh.position.set(position[0], position[1], position[2]);
	}
}

function Planet(body, view, economy) {
	this.body = body;
	this.view = view;
	this.economy = economy;
	this.colonies = [];
}

function Trader(body, view, economy) {
	this.body = body;
	this.view = view;
	this.economy = economy;
	
	this.interactionRange = 5;
	
	this.targetResource = null;
	this.destination = null;
}

function Colony(planet, economy) {
	this.planet = planet;
	this.economy = economy;
}