//TODO merge geometries, namely planets and other static objects

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
	fpsMeter: null,
	
	planetLight: null,
	
	mouseVector: null,
	projector: null,
	
	init: function() {
		SimulationView.scene = new THREE.Scene();
		
		SimulationView.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
		SimulationView.camera.position.x = 0;
		SimulationView.camera.position.y = 0;
		SimulationView.camera.position.z = 7500;
		SimulationView.camera.lookAt(new THREE.Vector3(0, 0, 0));
		
		//SimulationView.renderer = new THREE.WebGLRenderer({antialias: true});
		SimulationView.renderer = new THREE.WebGLRenderer();
		SimulationView.renderer.setSize(window.innerWidth, window.innerHeight);
		SimulationView.renderer.setClearColor(0x000000, 1);
		
		SimulationView.controls = new THREE.OrbitControls(SimulationView.camera);
		//SimulationView.controls.zoomSpeed = 0.5;
		//SimulationView.controls.maxDistance = 35000;
		SimulationView.controls.xRotateSpeed = 1.0;
		SimulationView.controls.yRotateSpeed = 0.01;
		//SimulationView.controls.keyPanSpeed = 1.0;
		
		SimulationView.fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
		
		document.getElementById("canvas").appendChild(SimulationView.renderer.domElement);
			
		THREEx.WindowResize(SimulationView.renderer, SimulationView.camera);
		THREEx.FullScreen.bindKey({charCode: 'f'.charCodeAt(0)});
		
		window.addEventListener('mousemove', SimulationView.onMouseMove, false);
		window.addEventListener('resize', SimulationView.onWindowResize, false);
		
		SimulationView.projector = new THREE.Projector();
		SimulationView.mouseVector = new THREE.Vector3();
	},
	
	update: function() {
		
	},
	
	render: function() {
		if (SimulationView.renderer) {
			SimulationView.renderer.render(SimulationView.scene, SimulationView.camera);
		}
	},
	
	frame: function() {
		requestAnimationFrame(SimulationView.frame);
		
		SimulationView.fpsMeter.tickStart();
		
		SimulationView.controls.update();
		SimulationController.update();
		
		SimulationView.render();
		GUIController.update();
		
		SimulationView.fpsMeter.tick();
	},
	
	onMouseMove:function(e) {
		SimulationView.mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
		SimulationView.mouseVector.y = 1 - (event.clientY / window.innerHeight) * 2;
		SimulationView.mouseVector.z = 0.5;
	},
	
	//TODO move to seperate class with pickingDataIndex as private variable
/* 	getPickingDataIndex:function() {
		SimulationView.pickingDataIndex += 1;
		return SimulationView.pickingDataIndex;
	}, */
	
/* 	applyVertexColors:function(g, c) {
		g.faces.forEach( function( f ) {
			var n = ( f instanceof THREE.Face3 ) ? 3 : 4;
			for( var j = 0; j < n; j ++ ) {
				f.vertexColors[ j ] = c;
			}
		});
	} */
}

var SimulationController = {
	numPlanets:5,
	numColonies:5,
	numTraders:100,
	
	planets:[],
	colonies:[],
	traders:[],
	
	staticObjects: null,
	staticPickingObjects: null,
	dynamicObjects: null,
	dynamicPickingObjects: null,
	
	selector:null,
	lastMouseVector:new THREE.Vector3(),
	
	init:function() {
		//create scene container objects
		SimulationController.staticObjects = new THREE.Object3D();
		SimulationController.staticPickingObjects = new THREE.Object3D();
		SimulationController.dynamicObjects = new THREE.Object3D();
		SimulationController.dynamicPickingObjects = new THREE.Object3D();
		
		SimulationView.scene.add(SimulationController.staticObjects);
		SimulationView.scene.add(SimulationController.staticPickingObjects);
		SimulationView.scene.add(SimulationController.dynamicObjects);
		SimulationView.scene.add(SimulationController.dynamicPickingObjects);
		
		//create star
		var starSize = 500;
		
		var starPosition = new THREE.Vector3(0.0, 0.0, 0.0);
		var starGeometry = new THREE.SphereGeometry(starSize, 64, 64);
		var starMaterial = new THREE.MeshBasicMaterial({color: 0xfff5f2});
		
		SimulationController.addObject(new THREE.Mesh(starGeometry, starMaterial), false, false);
		
		//create planets
		var skyGeometry = new THREE.SphereGeometry(PlanetSpec.world1.outerRadius, 64, 64);
		var groundGeometry = new THREE.SphereGeometry(PlanetSpec.world1.innerRadius, 64, 64);
		var planetPickingGeometry = new THREE.SphereGeometry(PlanetSpec.world1.outerRadius + 1, 64, 64);
		var groundTexture = THREE.ImageUtils.loadTexture('images/plutomap1k.jpg');
		
		var color = new THREE.Color();
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
			
			var planetPickingMaterial = new THREE.MeshBasicMaterial({
				color: 0xffffff,
				transparent: true,
				opacity: 0.2
			});
			
			var skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
			var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
			
			var planetPickingMesh = new THREE.Mesh(planetPickingGeometry, planetPickingMaterial);
			planetPickingMesh.visible = false;
			
			var planetView = new View();
			planetView.meshes.push({name: 'skyMesh', value: skyMesh});
			planetView.meshes.push({name: 'groundMesh', value: groundMesh});
			planetView.meshes.push({name: 'pickingMesh', value: planetPickingMesh});
			
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
			
			var planet = new Planet(planetBody, planetView, planetEconomy);
			
			SimulationController.planets.push(planet);
			
			SimulationController.addObject(skyMesh, false, true);
			SimulationController.addObject(groundMesh, false, false);
			SimulationController.addObject(planetPickingMesh, false, false);
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
			
			var traderMesh = new THREE.Mesh(traderGeometry, traderMaterial);
			SimulationController.addObject(traderMesh, true, false);
			
			var traderView = new View();
			traderView.meshes.push({name: 'traderMesh', value: traderMesh});
			
			var traderEconomy = new Economy();
			
			SimulationController.traders.push(new Trader(traderBody, traderView, traderEconomy));
		}
	},
	
	update:function() {
		SimulationController.handleMouseMove();
		
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
	},
	
	addObject:function(object, dynamic, picking) {
		if (!dynamic && !picking) {
			SimulationController.staticObjects.add(object);
		}
		else if (!dynamic && picking) {
			SimulationController.staticPickingObjects.add(object);
		}
		else if (dynamic && !picking) {
			SimulationController.dynamicObjects.add(object);
		}
		else if (dynamic && picking) {
			SimulationController.dynamicPickingObjects.add(object);
		}
	},
	
	handleMouseMove:function() {
		if (SimulationView.mouseVector.distanceTo(SimulationController.lastMouseVector) > 0.0) {
			//reset picking object visibility TODO kind of a convoluted way of accessing the picking mesh
			for (var i = 0; i < SimulationController.staticPickingObjects.children.length; i++) {
				SimulationController.staticPickingObjects.children[i].worldParent.view.getMeshByName('pickingMesh').value.visible = false;
			}
			
 			var raycaster = SimulationView.projector.pickingRay(SimulationView.mouseVector.clone(), SimulationView.camera);
		
			//TODO don't bother doing intersects if object is too far away
			var intersects = raycaster.intersectObjects(SimulationController.staticPickingObjects.children);
			
			if (intersects.length > 0) {
				var worldParent = intersects[0].object.worldParent;
			
				if (worldParent instanceof Planet) {
					GUIController.resourceGUITarget = worldParent.colonies[0];
					worldParent.view.getMeshByName('pickingMesh').value.visible = true;
				}
				else {
					GUIController.resourceGUITarget = worldParent;
				}
				
				//SimulationController.selector.target = worldParent;
			}
			else {
				//SimulationController.selector.target = null;
			}
			
			SimulationController.lastMouseVector = SimulationView.mouseVector.clone();
		}
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

/**
	Milky Way skybox source: https://code.google.com/p/osghimmel/downloads/detail?name=resources_milkyway_equatorial_1024.zip&can=1&q= 29.07.2014
**/
var SkyBox = {
	init:function() {
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

/**
	Object picking solution.
*/
function Selector(view) {
	this.view = view;
	this.target = null;
}

Selector.prototype = {
	update:function() {
		if (this.target != null) {
			this.view.update(this.target.body.position);
			this.view.meshes[0].value.visible = true;
		}
		else {
			this.view.meshes[0].value.visible = false;
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