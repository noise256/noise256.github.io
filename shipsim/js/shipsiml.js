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