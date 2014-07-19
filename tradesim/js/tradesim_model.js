window.onload = function() {
	renderer.initRenderer();
	renderer.initModel();
	renderer.frame();
}

var renderer = {
	canvasWidth: 1000,
	canvasHeight: 800,
	
	fpsMeter: new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' }),
	
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(60, this.canvasWidth / this.canvasHeight, 0.1, 1000),
	renderer: new THREE.WebGLRenderer(),
	
	initRenderer: function() {		
		this.camera.position.x = 24;
		this.camera.position.y = 10;
		this.camera.position.z = 24;
		this.camera.lookAt(new THREE.Vector3(0, 10, 0));
		
		var controls = new THREE.OrbitControls(this.camera, document.getElementById("canvas"));
		controls.target.y = 10;
		
		var ambientLight = new THREE.AmbientLight(0x404040);
		
		var mainLight = new THREE.PointLight();
		mainLight.position.set(50, 150, 150);
		
		this.scene.add(ambientLight);
		this.scene.add(mainLight);
				
		this.renderer.setSize(this.canvasWidth, this.canvasHeight);
		this.renderer.setClearColor(0xffffff, 1);
		
		document.getElementById("canvas").appendChild(renderer.domElement);
	},
	
	initModel: function() {
	},
	
	frame: function() {
		this.fpsMeter.tickStart();

		update();
		render();
		
		this.fpsMeter.tick();
		
		requestAnimationFrame(frame);
	},
	
	update: function() {
	},
	
	render: function() {
		this.renderer.render(scene, camera);
	}
}