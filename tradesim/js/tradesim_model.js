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
	
	mouseMove: new THREE.Vector3(),
	mouseDblClick: null,
	projector: null,
	
	init: function() {
		SimulationView.scene = new THREE.Scene();
		
		SimulationView.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 450000);
		SimulationView.camera.position.x = 0;
		SimulationView.camera.position.y = 3000;
		SimulationView.camera.position.z = 25000;
		SimulationView.camera.lookAt(new THREE.Vector3(0, 0, 0));
		
		SimulationView.renderer = new THREE.WebGLRenderer({antialias: true});
		SimulationView.renderer.setSize(window.innerWidth, window.innerHeight);
		SimulationView.renderer.setClearColor(0x000000, 1);
		
		SimulationView.controls = new THREE.OrbitControls(SimulationView.camera);
		SimulationView.controls.maxDistance = 125000;
		SimulationView.controls.xRotateSpeed = 1.0;
		SimulationView.controls.yRotateSpeed = 0.025;
		SimulationView.controls.panSpeed = 0.05;
		
		SimulationView.fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
		
		document.getElementById("canvas").appendChild(SimulationView.renderer.domElement);
			
		THREEx.WindowResize(SimulationView.renderer, SimulationView.camera);
		THREEx.FullScreen.bindKey({charCode: 'f'.charCodeAt(0)});
		
		window.addEventListener('dblclick', SimulationView.onDoubleClick, false);
		window.addEventListener('mousemove', SimulationView.onMouseMove, false);
		window.addEventListener('resize', SimulationView.onWindowResize, false);
		window.addEventListener('keydown', SimulationView.onKeyDown, false);
		
		SimulationView.projector = new THREE.Projector();
	},
	
	render: function() {
		if (SimulationView.renderer) {
			SimulationView.renderer.render(SimulationView.scene, SimulationView.camera);
		}
	},
	
	frame: function() {
		requestAnimationFrame(SimulationView.frame);
		
		SimulationView.fpsMeter.tickStart();
		
		CameraController.updateCamera();
		
		SimulationView.controls.update();
		SimulationController.update();
		
		SimulationView.render();
		GUIController.update();
		
		SimulationView.fpsMeter.tick();
	},
	
	onMouseMove:function(e) {
		SimulationView.mouseMove.x = (event.clientX / window.innerWidth) * 2 - 1;
		SimulationView.mouseMove.y = 1 - (event.clientY / window.innerHeight) * 2;
		SimulationView.mouseMove.z = 0.5;
	},
	
	onDoubleClick:function(e) {
		SimulationView.mouseDblClick = new THREE.Vector3(
			(event.clientX / window.innerWidth) * 2 - 1,
			1 - (event.clientY / window.innerHeight) * 2,
			0.5
		);
	},
	
	onKeyDown:function(e) {
		if (e.keyCode == 81) {
			CameraController.originalPosition = new THREE.Vector3().copy(SimulationView.camera.position);
			CameraController.destination = new THREE.Vector3(0.0, 3000.0, 25000.0);
			CameraController.progress = 0.0;
		}
	}
}

var CameraController = {
	offset: 25000.0,
	
	originalPosition: null,
	destination: null,
	progress: null,
	
	updateCamera:function() {
		if (CameraController.destination && CameraController.progress <= 1.0) {
			var cameraStep = CameraController.originalPosition.clone().lerp(CameraController.destination, CameraController.progress);
			
			SimulationView.camera.position.set(cameraStep.x, cameraStep.y, cameraStep.z);
			SimulationView.controls.savePosition();
			SimulationView.controls.saveTarget();
			SimulationView.controls.reset();
			
			CameraController.progress += 0.1;
		}
	}
}

var SimulationController = {
	numStars:1,
	numPlanets:7,
	numColonies:7,
	numTraders:200,
	
	stars:[],
	planets:[],
	colonies:[],
	traders:[],
	
	staticObjects: null,
	staticPickingObjects: null,
	dynamicObjects: null,
	dynamicPickingObjects: null,
	
	selector: null,
	lastMouseMove:new THREE.Vector3(),
	
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
		
		//create stars
		for (var i = 0; i < SimulationController.numStars; i++) {
			SimulationController.stars.push(StarFactory.generateStar(new THREE.Vector3(i * 10000.0, 0.0, 0.0)));
		}
		
		//create planets
		for (var i = 0; i < SimulationController.numStars; i++) {
			var distanceToStar = SolarSystemSpec.system1.maxStarSize + Math.random() * (SolarSystemSpec.system1.maxPlanetDistance - SolarSystemSpec.system1.minPlanetDistance) + SolarSystemSpec.system1.minPlanetDistance;
			for (var j = 0; j < SimulationController.numPlanets; j++) {
				var randVector = vec3.random(vec3.create(), distanceToStar);
				var planetOffset = new THREE.Vector3(randVector[0], 0.0, randVector[2]);
				SimulationController.planets.push(PlanetFactory.generatePlanet(SimulationController.stars[i], new THREE.Vector3().addVectors(SimulationController.stars[i].body.position, planetOffset), planetOffset.length()));
				
				distanceToStar += Math.random() * (SolarSystemSpec.system1.maxPlanetDistance - SolarSystemSpec.system1.minPlanetDistance) + SolarSystemSpec.system1.minPlanetDistance;
			}
		}
			//create planets

			
/* 			//create colonies
			for (var j = 0; j < SimulationController.numColonies; j++) {
				var colony = ColonyFactory.generateColony(SimulationController.planets[j % SimulationController.planets.length], new Economy());
				SimulationController.planets[j % SimulationController.planets.length].colonies.push(colony);
				SimulationController.colonies.push(colony);
			} */
		
/* 		//create traders
		var traderGeometry = new THREE.SphereGeometry(30, 32, 32);
		
		for (var i = 0; i < SimulationController.numTraders; i++) {
			var randVector = vec3.random(vec3.create(), Math.random() * (SolarSystemSpec.system1.maxPlanetDistance + SolarSystemSpec.system1.minPlanetDistance) / 2 * SimulationController.numPlanets); //TODO implement max trader spread
			var traderPosition = new THREE.Vector3(randVector[0], 0.0, randVector[2]);
			var traderBody = new Body(traderPosition, 1, 1, 25.0);
			
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
		} */
	},
	
	update:function() {
		SimulationController.handleMouseMove();
		SimulationController.handleMouseDoubleClick();
		
		for (var i = 0; i < SimulationController.stars.length; i++) {
			SimulationController.stars[i].update();
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
		if (SimulationView.mouseMove.distanceTo(SimulationController.lastMouseMove) > 0.0) {
			//reset picking object visibility TODO kind of a convoluted way of accessing the picking mesh
			for (var i = 0; i < SimulationController.staticPickingObjects.children.length; i++) {
				SimulationController.staticPickingObjects.children[i].worldParent.view.getMeshByName('pickingMesh').value.visible = false;
			}
			
 			var raycaster = SimulationView.projector.pickingRay(SimulationView.mouseMove.clone(), SimulationView.camera);
		
			//TODO don't bother doing intersects if object is too far away
			var intersects = raycaster.intersectObjects(SimulationController.staticPickingObjects.children);
			
			if (intersects.length > 0) {
				var worldParent = intersects[0].object.worldParent;
				
				if (worldParent instanceof Planet) {
					GUIController.resourceGUITarget = worldParent.colonies[0];
					worldParent.view.getMeshByName('pickingMesh').value.visible = true;
				}
			}
			
			SimulationController.lastMouseVector = SimulationView.mouseMove.clone();
		}
	},
	
	handleMouseDoubleClick:function() {
		if (SimulationView.mouseDblClick != null) {
			var raycaster = SimulationView.projector.pickingRay(SimulationView.mouseDblClick.clone(), SimulationView.camera);
		
			//TODO don't bother doing intersects if object is too far away
			var intersects = raycaster.intersectObjects(SimulationController.staticPickingObjects.children);
			
			if (intersects.length > 0) {
				var worldParent = intersects[0].object.worldParent;
				
				var destinationVec = new THREE.Vector3().subVectors(SimulationView.camera.position, worldParent.body.position).normalize();
				
				CameraController.originalPosition = SimulationView.camera.position.clone();
				CameraController.destination = new THREE.Vector3().addVectors(worldParent.body.position, destinationVec.multiplyScalar(CameraController.offset));
				CameraController.progress = 0.0;
				
				SimulationView.controls.target = worldParent.body.position.clone();
				SimulationView.camera.lookAt(worldParent.body.position.clone());
			}
			
			SimulationView.mouseDblClick = null;
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
		if (trader.buyDestination == null && trader.sellDestination == null) {
			TraderController.getNewDestination(trader);
		}
		
		if (trader.buyDestination != null && trader.sellDestination != null) {
			var destinationVec = null;
			if (trader.economy.hasResources()) {
				destinationVec = new THREE.Vector3().subVectors(trader.sellDestination.planet.body.position, trader.body.position);
			}
			else {
				destinationVec = new THREE.Vector3().subVectors(trader.buyDestination.planet.body.position, trader.body.position);
			}
			
			if (destinationVec.length() <= trader.interactionRange) {
				if (trader.economy.hasResources()) {
					TraderController.sellResources(trader, trader.sellDestination);
					trader.buyDestination = null;
					trader.sellDestination = null;
				}
				else {
					TraderController.buyResources(trader, trader.buyDestination);
				}
			}
			
			trader.body.move(destinationVec.normalize());
		}
	},
	
	getNewDestination:function(trader) {
		//var highColony;
		
		//var lowColony;
		//var lowResource;
		
		//var highPrice = 0;
		//var lowPrice = Number.MAX_VALUE;
		
		var buyColony;
		var sellColony;
		var targetResource;
		
		var netProfit = 0;
		for (var i = 0; i < SimulationController.colonies.length; i++) {
			var distanceToStart = SimulationController.colonies[i].planet.body.position.distanceTo(trader.body.position);
			
			for (var j = 0; j < SimulationController.colonies.length; j++) {
				if (i == j) {
					continue;
				}
				
				var distanceToEnd = SimulationController.colonies[i].planet.body.position.distanceTo(SimulationController.colonies[j].planet.body.position);
				var totalDistance = distanceToStart + distanceToEnd;
				
				for (var k = 0; k < SimulationController.colonies[i].economy.resources.length; k++) {
					var cNetProfit = (SimulationController.colonies[j].economy.resources[k].price - SimulationController.colonies[i].economy.resources[k].price) / totalDistance;
					if (cNetProfit > netProfit) {
						buyColony = SimulationController.colonies[i];
						sellColony = SimulationController.colonies[j];
						targetResource = SimulationController.colonies[i].economy.resources[k].name;
						netProfit = cNetProfit;
					}
				}
			}
		}
		
		trader.buyDestination = buyColony;
		trader.sellDestination = sellColony;
		trader.targetResource = targetResource;
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
		var skyboxGeometry = new THREE.SphereGeometry(300000, 60, 60);
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
	update:function() {
		this.view.update(this.body.position);
		
		this.updateUniforms();
	},
	
	updateUniforms:function() {
		this.view.getMeshByName('surfaceMesh').value.material.uniforms.cameraDir.value = new THREE.Vector3().subVectors(SimulationView.camera.position, this.body.position);
	}
}

var StarFactory = {
	generateStar:function(starPosition) {
		var innerRadius = Math.random() * (SolarSystemSpec.system1.maxStarSize - 3000) + 3000;
		var colour = [Math.random() * (1.0 - 0.8) + 0.8, Math.random() * (1.0 - 0.8) + 0.8, Math.random() * (1.0 - 0.8) + 0.8];

		var surfaceUniforms = {
			cameraDir:{type:'v3', value:new THREE.Vector3()},
			colour:{type:'v3', value:new THREE.Vector3(colour[0], colour[1], colour[2])},
		};
		var surfaceGeometry = new THREE.SphereGeometry(innerRadius, 500, 500);		
		var surfaceMaterial = new THREE.ShaderMaterial({
			uniforms: surfaceUniforms,
			vertexShader: $('#star_v_shader').text(),
			fragmentShader: $('#star_f_shader').text(),
			transparent: true,
			blending: THREE.AdditiveBlending
		});
		var surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
		
		var pickingGeometry = new THREE.SphereGeometry(innerRadius + 1, 64, 64);
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
		
		SimulationController.addObject(surfaceMesh, false, false);
		SimulationController.addObject(pickingMesh, false, true);
		
		var starBody = new Body(starPosition, 0, 0, 0);
		
		return new Star(starBody, starView);
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
	update:function() {
		this.body.position.applyAxisAngle(new THREE.Vector3(0.0, 1.0, 0.0), this.body.maxVelocity);
		
		//manually update meshes to avoid updating position of orbit ring
		//this.view.update(this.body.position);
		
		this.view.getMeshByName('skyMesh').value.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
		this.view.getMeshByName('groundMesh').value.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
		this.view.getMeshByName('pickingMesh').value.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
		
		var lightDir = new THREE.Vector3(this.star.body.position.x - this.body.position.x, this.star.body.position.y - this.body.position.y, this.star.body.position.z - this.body.position.z).normalize();
		var relativeCameraPos = new THREE.Vector3().subVectors(SimulationView.camera.position, this.body.position);
		var cameraHeight2 = relativeCameraPos.length() * relativeCameraPos.length();
		
		this.view.getMeshByName('skyMesh').value.material.uniforms.cameraPos.value = relativeCameraPos;
		this.view.getMeshByName('skyMesh').value.material.uniforms.cameraHeight2.value = cameraHeight2;
		this.view.getMeshByName('skyMesh').value.material.uniforms.lightDir.value = lightDir;
		
		this.view.getMeshByName('groundMesh').value.material.uniforms.cameraPos.value = relativeCameraPos;
		this.view.getMeshByName('groundMesh').value.material.uniforms.cameraHeight2.value = cameraHeight2;
		this.view.getMeshByName('groundMesh').value.material.uniforms.lightDir.value = lightDir;
	},
}

var PlanetFactory = {
	planetTextures: [
		THREE.ImageUtils.loadTexture('images/mercurymap.jpg'),
		THREE.ImageUtils.loadTexture('images/venusmap.jpg'),
		THREE.ImageUtils.loadTexture('images/marsmap.jpg'),
		THREE.ImageUtils.loadTexture('images/neptunemap.jpg'),
		THREE.ImageUtils.loadTexture('images/plutomap.jpg'),
		THREE.ImageUtils.loadTexture('images/sednamap.jpg')
	],
	
	generatePlanet:function(star, planetPosition, distanceToStar) {
		//create definition
		var innerRadius = Math.random() * (SolarSystemSpec.system1.maxPlanetSize - SolarSystemSpec.system1.minPlanetSize) + SolarSystemSpec.system1.minPlanetSize;
		
		var planetSpec = {
			waveLength: [Math.random() * (1.0 - 0.5) + 0.5, Math.random() * (1.0 - 0.5) + 0.5, Math.random() * (1.0 - 0.5) + 0.5],
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
		var planetTexture = Math.floor(Math.random() * PlanetFactory.planetTextures.length);
		var atmosphereUniforms = {
			dayTexture: {type: "t", value: PlanetFactory.planetTextures[planetTexture]},
			nightTexture: {type: "t", value: PlanetFactory.planetTextures[planetTexture]},
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
		
		var skyGeometry = new THREE.SphereGeometry(planetSpec.outerRadius, 64, 64);
		var skyMaterial = new THREE.ShaderMaterial({
			uniforms: atmosphereUniforms,
			vertexShader: $('#atmosphere_v_shader').text(),
			fragmentShader: $('#atmosphere_f_shader').text(),
			side: THREE.BackSide,
			transparent: true,
			blending: THREE.AdditiveBlending
		});
		var skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
		
		var groundGeometry = new THREE.SphereGeometry(planetSpec.innerRadius, 64, 64);
		var groundMaterial = new THREE.ShaderMaterial({
			uniforms: atmosphereUniforms,
			vertexShader: $('#ground_v_shader').text(),
			fragmentShader: $('#ground_f_shader').text(),
		});
		var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
		
		var planetPickingGeometry = new THREE.SphereGeometry(planetSpec.outerRadius + 1, 64, 64);
		var planetPickingMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.2
		});
		var planetPickingMesh = new THREE.Mesh(planetPickingGeometry, planetPickingMaterial);
		planetPickingMesh.visible = false;
		
		var orbitRingGeometry = new THREE.TorusGeometry(distanceToStar, 25, 8, 64);
		var orbitRingMaterial = new THREE.MeshBasicMaterial({color: 0x97EBC2});
		var orbitRingMesh = new THREE.Mesh(orbitRingGeometry, orbitRingMaterial);
		orbitRingMesh.position.set(star.body.position.x, star.body.position.y, star.body.position.z);
		orbitRingMesh.rotation.x = Math.PI/2;
		var planetView = new View();
		
		planetView.meshes.push({name: 'skyMesh', value: skyMesh});
		planetView.meshes.push({name: 'groundMesh', value: groundMesh});
		planetView.meshes.push({name: 'pickingMesh', value: planetPickingMesh});
		planetView.meshes.push({name: 'orbitRingMesh', value: orbitRingMesh});
		
		//SimulationController.addObject(skyMesh, false, false);
		//SimulationController.addObject(groundMesh, false, false);
		//SimulationController.addObject(planetPickingMesh, false, true);
		//SimulationController.addObject(orbitRingMesh, false, false);
			
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
	}
}

var SolarSystemSpec = {
	system1: {
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
	//this.targetResource = null;
	//this.destination = null;
	
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

var ColonyFactory = {
	generateColony:function(planet) {
		var colonyEconomy = new Economy();
		
		return new Colony(planet, colonyEconomy);
	}
}