function SPPModel(maxParticles) {
	this.maxParticles = maxParticles;
	
	var particles = [];
	
	for (i = 0; i < maxParticles; i++) {
		var theta = Math.random() * Math.PI * 2;
		var mu = Math.random() < 0.5 ? Math.random() : -Math.random();
		
		var dir = $V([
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.cos(theta), 
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.sin(theta),
			mu
		]);
		
		particles.push(new SPP($V([Math.random()*2, Math.random()*2+10, Math.random()*2]), dir));//$V([1, 0]).rotate(Math.random() * Math.PI * 2, $V([0, 0]))));
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



