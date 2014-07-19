window.onload = function() {
	initRenderer();
	initModel();
	frame();
}

var renderer = {
	canvasWidth: 1000,
	canvasHeight: 800,
	
	fpsMeter: new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' }),
	
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(60, this.canvasWidth / this.canvasHeight, 0.1, 1000),
	renderer: new THREE.WebGLRenderer(),
	
	initRenderer: function() {		
		camera.position.x = 24;
		camera.position.y = 10;
		camera.position.z = 24;
		camera.lookAt(new THREE.Vector3(0, 10, 0));
		
		var controls = new THREE.OrbitControls(camera, document.getElementById("canvas"));
		// controls.target.y = 10;
		
		var ambientLight = new THREE.AmbientLight(0x404040);
		scene.add(ambientLight);
		
		var mainLight = new THREE.PointLight();
		mainLight.position.set(50, 150, 150);
		scene.add(mainLight);
				
		renderer.setSize(canvasWidth, canvasHeight);
		renderer.setClearColor(0xffffff, 1);
		document.getElementById("canvas").appendChild(renderer.domElement);
	},
	
	initModel: function() {
	},
	
	frame: function() {
		fpsMeter.tickStart();

		update();
		render();
		
		fpsMeter.tick();
		
		requestAnimationFrame(frame);
	},
	
	update: function() {
	},
	
	render: function() {
		renderer.render(scene, camera);
	}
}