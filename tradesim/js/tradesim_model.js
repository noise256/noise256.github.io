window.onload = function() {
	SimulationView.init();
	SkyBox.init();
	
	SimulationController.init();
	
	SimulationView.frame();
}

var SimulationView = {
	canvasWidth: 1000,
	canvasHeight: 800,
	
	fpsMeter: null, 
	
	scene: null,
	camera: null, 
	renderer: null,
	
	init: function() {
		fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
		
		SimulationView.scene = new THREE.Scene();
		
		SimulationView.camera = new THREE.PerspectiveCamera(60, SimulationView.canvasWidth / SimulationView.canvasHeight, 1, 10000);
		SimulationView.camera.position.x = 24;
		SimulationView.camera.position.y = 10;
		SimulationView.camera.position.z = 24;
		SimulationView.camera.lookAt(new THREE.Vector3(0, 10, 0));
		
		var controls = new THREE.OrbitControls(SimulationView.camera, document.getElementById("canvas"));
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
		
		document.getElementById("canvas").appendChild(SimulationView.renderer.domElement);
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
		fpsMeter.tickStart();

		SimulationView.update();
		SimulationView.render();
		
		fpsMeter.tick();
		
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
	numPlanets:50,
	numTraders:150,
	
	minSystemDistance:10,
	maxPlanetSpread:500,
	
	planets:[],
	colonies:[],
	traders:[],
	
	init:function() {
		//create planets
		var planetGeometry = new THREE.SphereGeometry(5, 32, 32);
		var planetMaterial = new THREE.MeshPhongMaterial({map: THREE.ImageUtils.loadTexture('images/sedna.jpg')});
			
		for (var i = 0; i < SimulationController.numPlanets; i++) {
			//find free locations for planets using crude monte carlo method(?)
			var planetPosition = null;
			var foundPosition = false;
			while(!foundPosition) {
				foundPosition = true;
				planetPosition = vec3.random(vec3.create(), Math.random() * SimulationController.maxPlanetSpread);
				for (var j = 0; j < planets.length; j++) {
					if (vec3.distance(planetPosition, planets[i].body.position) < SimulationController.minSystemDistance) {
						foundPosition = false;
					}
				}
			}
			
			var planetBody = new Body(planetPosition, 0, 0, 0);
			var planetView = new View(planetGeometry, planetMaterial);
			SimulationController.planets.push(new Planet(planetBody, planetView));
			if (SimulationView.scene) {
				SimulationView.scene.add(planetView.mesh);
			}
		}
		
		//create traders
		var traderGeometry = new THREE.SphereGeometry(1, 32, 32);
		var traderMaterial = new THREE.MeshPhongMaterial({color: 0x003344});
		for (var i = 0; i < SimulationController.numTraders; i++) {
			var traderBody = new Body(vec3.create(), 1, 0.001, 0.1);
			var traderView = new View(traderGeometry, traderMaterial);
			
			SimulationController.traders.push(new Trader(traderBody, traderView));
			
			if (SimulationView.scene) {
				SimulationView.scene.add(traderView.mesh);
			}
		}
	},
	
	update:function() {
		//update colonies and traders using TraderController and ColonyController
		for (var i = 0; i < SimulationController.planets.length; i++) {
			SimulationController.planets[i].update();
		}
		for (var i = 0; i < SimulationController.traders.length; i++) {
			TraderController.updateTrader(SimulationController.traders[i]);
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
				trader.destination = null;
				return;
			}
			
			var direction = vec3.normalize(vec3.create(), destinationVec);
			
			trader.body.move(direction);
		}
		
		trader.view.update(trader.body.position);
	},
	
	getNewDestination:function(trader) {
		trader.destination = SimulationController.planets[Math.floor(Math.random() * SimulationController.planets.length)].body.position;
	}
}

var ColonyController = {
}

//TODO is an object needed for resource? Should it just be a value on Planet, Ship and Colony objects? How to do enum that defines resource chain? Should each container have a single Resources object that contains the name and quantity of each resource?
var Resources = function(params) {
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
}

View.prototype = {
	update:function(position) {
		this.mesh.position.set(position[0], position[1], position[2]);
	}
}

function Planet(body, view) {
	this.body = body;
	this.view = view;
	this.colonies = [];
}

Planet.prototype = {
	update:function() {
		this.view.update(this.body.position);
	}
}

function Trader(body, view) {
	this.interactionRange = 5;
	
	this.body = body;
	this.view = view;
	
	this.destination = null;
}

function Colony() {
}