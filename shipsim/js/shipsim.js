window.onload = function() {
	tradeSimulation();
}

var gblSimulation = {};

function tradeSimulation() {
	gblSimulation.simulationView = new SimulationView();
	gblSimulation.simulationView.init();
		
	gblSimulation.simulationView.frame();
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
		//gblSimulation.objectManager.update();
		//gblSimulation.guiController.update();
		
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