window.onload = function() {
	SimulationView.init();
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

var SimulationController = {
	numPlanets:50,
	
	planets:[],
	colonies:[],
	traders:[],
	
	init:function() {
		//create planets
		for (var i = 0; i < SimulationController.numPlanets; i++) {
			var planetBody = new Body(vec3.random(vec3.create(), Math.random() * 1000), 0);
			var planetView = new View(new THREE.SphereGeometry(5, 32, 32), new THREE.MeshPhongMaterial({color: 0x443300}));
			SimulationController.planets.push(new Planet(planetBody, planetView));
			
			if (SimulationView.scene) {
				SimulationView.scene.add(planetView.mesh);
			}
		}
	},
	
	update:function() {
		//update colonies and traders using TraderController and ColonyController
		for (var i = 0; i < SimulationController.planets.length; i++) {
			SimulationController.planets[i].update();
		}
	}
}

var TraderController = {
}

var ColonyController = {
}

//TODO is an object needed for resource? Should it just be a value on Planet, Ship and Colony objects? How to do enum that defines resource chain? Should each container have a single Resources object that contains the name and quantity of each resource?
var Resources = function(params) {
}

function Body(position, velocity) {
	this.position = position;
	this.velocity = velocity;
}

Body.prototype = {
	move:function(direction) {
		vec3.scaleAndAdd(this.position, this.position, direction, this.velocity); 
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

function Trader() {
}

function Colony() {
}