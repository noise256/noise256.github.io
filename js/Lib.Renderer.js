function Renderer(canvasElement) {
	this.canvasElement = canvasElement;
	
	this.scene = null;
	this.camera = null;
	this.renderer = null;
	this.controls = null;
	this.fpsMeter = null;
	
	this.screenWidth = null;
	this.screenHeight = null;
	this.orgCameraPosition = null;
	this.cameraDestination = null;
	this.cameraProgress = null;
	
	this.cameraOffset = 25000.0;
}

Renderer.prototype = {
	init: function() {		
		this.offsetLeft = this.canvasElement.offsetLeft;
		this.offsetTop = this.canvasElement.offsetTop;
		
		this.screenWidth = this.canvasElement.clientWidth;
		this.screenHeight = this.canvasElement.clientHeight;
		
		this.scene = new THREE.Scene();
		
		this.camera = new THREE.PerspectiveCamera(60, this.screenWidth / this.screenHeight, 10, 10000000);
		this.camera.position.set(0.0, 3000.0, 3000.0);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		
		this.renderer = new THREE.WebGLRenderer({antialias: true});
		this.renderer.setSize(this.screenWidth, this.screenHeight);
		this.renderer.setClearColor(0x000000, 1);
		
		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.maxDistance = 10000000;
		
		this.fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
		
		this.canvasElement.appendChild(this.renderer.domElement);
		
		window.addEventListener('resize', this.onResize.bind(this), false);
		THREEx.FullScreen.bindKey({charCode: 'f'.charCodeAt(0), element: this.renderer.domElement});
	},
	
	update: function() {
		this.fpsMeter.tickStart();
		
		this.controls.update();
		this.updateCamera();
		
		this.renderer.render(this.scene, this.camera);
		
		this.fpsMeter.tick();
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
	},
	
	onResize: function() {
		this.screenWidth = this.canvasElement.clientWidth;
		this.screenHeight = this.canvasElement.clientHeight;
		
		this.offsetLeft = this.canvasElement.offsetLeft;
		this.offsetTop = this.canvasElement.offsetTop;
		
		this.camera.aspect = this.screenWidth / this.screenHeight;
		this.camera.updateProjectionMatrix();
		
		this.renderer.setSize(this.screenWidth, this.screenHeight);
	}
}