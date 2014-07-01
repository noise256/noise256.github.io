function SPPModel(maxParticles) {
	this.maxParticles = maxParticles;
	
	var particles = [];
	
	for (i = 0; i < maxParticles; i++) {
		var a = Math.random() * Math.PI * 2;
		//var xDir = (Math.random() < 0.5 ? Math.random() : Math.random() * -1);
		//var yDir = (Math.random() < 0.5 ? Math.random() : Math.random() * -1);
		particles.push(new SPP([0.0, 0.0], a));
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