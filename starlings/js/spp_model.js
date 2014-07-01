function SPPModel(maxParticles) {
	this.maxParticles = maxParticles;
	
	var particles = [];
	
	for (i = 0; i < maxParticles; i++) {
		particles.push(new SPP([0.0, 0.0], Math.random() * Math.PI * 2));
	}
	
	this.updateSPPModel = function() {
		for (i = 0; i < particles.length; i++) {
			particles[i].updateSPP();
			particles[i].updateView();
		}
	};
	
	this.getView = function() {
		var view = [];
		
		for (i = 0; i < particles.length; i++) {
			view.push(particles[i].getMesh());
		}
		
		return view;
	};
}