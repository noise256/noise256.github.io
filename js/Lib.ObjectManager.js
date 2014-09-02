function ObjectManager() {
	this.objectList = {};
	
	this.staticObjects = null;
	this.pickingObjects = null;
	
	this.mouseMoveEvent = null;
	this.mouseDownEvent = null;
	this.mouseUpEvent = null;
	this.mouseDblClickEvent = null;
	
	this.mouseDragFlag = null;
	
	this.lastScreenCoords = new THREE.Vector3();
	
	this.onMouseMove = function(e) {
		this.mouseMoveEvent = e;
	}
	
	this.onMouseDown = function(e) {
		this.mouseDownEvent = e;
	}
	
	this.onMouseUp = function(e) {
		this.mouseUpEvent = e;
	}

	this.onMouseDblClick = function(e) {
		this.mouseDblClickEvent = e;
	}
}

ObjectManager.prototype = {
	init:function() {
		this.staticObjects = new THREE.Object3D();
		this.pickingObjects = new THREE.Object3D();
		
		this.selectedObjects = [];
		
		gblSimulation.simulationView.scene.add(this.staticObjects);
		gblSimulation.simulationView.scene.add(this.pickingObjects);
		
		window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
		window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
		window.addEventListener('mouseup', this.onMouseUp.bind(this), false);
		window.addEventListener('dblclick', this.onMouseDblClick.bind(this), false);
	},
	
	update:function() {
		this.handleInput();
		
		for (var key in this.objectList) {
			for (var i = 0; i < this.objectList[key].length; i++) {
				this.objectList[key][i].update();
			}
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
	
	handleInput:function() {
		if (this.mouseMoveEvent != null) {
			this.lastScreenCoords = new THREE.Vector3(
				(this.mouseMoveEvent.clientX - gblSimulation.simulationView.offsetLeft - gblSimulation.simulationView.screenWidth / 2.0) / gblSimulation.simulationView.screenWidth * 2.0,
				- (this.mouseMoveEvent.clientY - gblSimulation.simulationView.offsetTop - gblSimulation.simulationView.screenHeight / 2.0) / gblSimulation.simulationView.screenHeight * 2.0,
				0.5
			);
			
			this.mouseMoveEvent = null;
		}
		
		for (var i = 0; i < this.pickingObjects.children.length; i++) {
			this.pickingObjects.children[i].worldParent.view.getMeshByName('pickingMesh').value.visible = false;
		} 
		
		var projector = new THREE.Projector();
		var raycaster = projector.pickingRay(this.lastScreenCoords.clone(), gblSimulation.simulationView.camera);
	
		var intersects = raycaster.intersectObjects(this.pickingObjects.children);
		
		if (intersects.length > 0) {
			var worldParent = intersects[0].object.worldParent;
			
			if (worldParent.highlight) {
				worldParent.view.getMeshByName('pickingMesh').value.visible = true;
			}
		}
		
		if (this.mouseUpEvent != null) {
			var screenCoords = new THREE.Vector3(
				(this.mouseUpEvent.clientX - gblSimulation.simulationView.offsetLeft - gblSimulation.simulationView.screenWidth / 2.0) / gblSimulation.simulationView.screenWidth * 2.0,
				- (this.mouseUpEvent.clientY - gblSimulation.simulationView.offsetTop - gblSimulation.simulationView.screenHeight / 2.0) / gblSimulation.simulationView.screenHeight * 2.0,
				0.5
			);
			
			var projector = new THREE.Projector();
			var raycaster = projector.pickingRay(screenCoords.clone(), gblSimulation.simulationView.camera);
			
			if (this.mouseUpEvent.button == 0) {
				var intersects = raycaster.intersectObjects(this.pickingObjects.children);
				
				this.selectedObjects = [];
				
				if (intersects.length > 0) {
					this.selectedObjects.push(intersects[0].object.worldParent);
				}
			}
			else if (this.mouseUpEvent.button == 2) {
				var intersectPoint = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0.0, -1.0, 0.0), 0.0));
				
				if (intersectPoint != null) {
					for (var i = 0; i < this.selectedObjects.length; i++) {
						this.selectedObjects[i].inputCoordinates = intersectPoint;
					}
				}
			}
			
			this.mouseUpEvent = null;
		}
		
		if (this.mouseDblClickEvent != null) {
			var screenCoords = new THREE.Vector3(
				(this.mouseDblClickEvent.clientX - gblSimulation.simulationView.offsetLeft - gblSimulation.simulationView.screenWidth / 2.0) / gblSimulation.simulationView.screenWidth * 2.0,
				- (this.mouseDblClickEvent.clientY - gblSimulation.simulationView.offsetTop - gblSimulation.simulationView.screenHeight / 2.0) / gblSimulation.simulationView.screenHeight * 2.0,
				0.5
			);
			
			var projector = new THREE.Projector();
			var raycaster = projector.pickingRay(screenCoords.clone(), gblSimulation.simulationView.camera);
			
			var intersects = raycaster.intersectObjects(this.pickingObjects.children);
			
			if (intersects.length > 0) {
				var worldParent = intersects[0].object.worldParent;
				
				var destinationVec = new THREE.Vector3().subVectors(gblSimulation.simulationView.camera.position, worldParent.body.position).normalize();
	
 				gblSimulation.simulationView.orgCameraPosition = gblSimulation.simulationView.camera.position.clone();
				gblSimulation.simulationView.cameraDestination = new THREE.Vector3().addVectors(worldParent.body.position, destinationVec.multiplyScalar(gblSimulation.simulationView.cameraOffset));
				gblSimulation.simulationView.cameraProgress = 0.0;
				
				gblSimulation.simulationView.controls.target = worldParent.body.position.clone();
				gblSimulation.simulationView.camera.lookAt(worldParent.body.position.clone());
			}
			
			gblSimulation.objectManager.mouseDblClick = null;
			
			this.mouseDblClickEvent = null;
		}
	}
}