function SPPModel(maxParticles) {
	this.maxParticles = maxParticles;
	
	var particles = [];
	
	for (i = 0; i < maxParticles; i++) {
		particles.push(new SPP($V([0, 0]), $V([1, 0]).rotate(Math.random() * Math.PI * 2, $V([0, 0]))));
	}
	
	this.updateSPPModel = function() {
		for (var i = 0; i < particles.length; i++) {
			particles[i].updateSPP(particles);
			particles[i].updateView();
		}
	}
	
	this.getView = function() {
		var view = [];
		
		for (var i = 0; i < particles.length; i++) {
			view.push(particles[i].getMesh());
		}
		
		return view;
	}
}



