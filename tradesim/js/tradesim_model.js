window.onload = function() {
	TradeSimModel.init();
	TradeSimModel.frame();
}

var TradeSimModel = {
	canvasWidth: 1000,
	canvasHeight: 800,
	
	fpsMeter: null, 
	
	scene: null, 
	camera: null, 
	renderer: null,
	
	init: function() {
		fpsMeter = new FPSMeter(document.body, { decimals: 0, graph: true, theme: 'dark', left: '5px' });
		
		scene = new THREE.Scene();
		
		camera = new THREE.PerspectiveCamera(60, TradeSimModel.canvasWidth / TradeSimModel.canvasHeight, 0.1, 1000);
		camera.position.x = 24;
		camera.position.y = 10;
		camera.position.z = 24;
		camera.lookAt(new THREE.Vector3(0, 10, 0));
		
		var controls = new THREE.OrbitControls(camera, document.getElementById("canvas"));
		controls.target.y = 10;
		
		var ambientLight = new THREE.AmbientLight(0x404040);
		var mainLight = new THREE.PointLight();
		mainLight.position.set(50, 150, 150);
		
		scene.add(ambientLight);
		scene.add(mainLight);
		
		renderer = new THREE.WebGLRenderer();
		renderer.setSize(TradeSimModel.canvasWidth, TradeSimModel.canvasHeight);
		renderer.setClearColor(0xffffff, 1);
		
		document.getElementById("canvas").appendChild(renderer.domElement);
	},
	
	update: function() {
	},
	
	render: function() {
		if (TradeSimModel.renderer) {
			TradeSimModel.renderer.render(TradeSimModel.scene, TradeSimModel.camera);
		}
	},
	
	frame: function() {
		fpsMeter.tickStart();

		TradeSimModel.update();
		TradeSimModel.render();
		
		fpsMeter.tick();
		
		requestAnimationFrame(TradeSimModel.frame);
	}
}