function SPP(position, direction) {
	SPP.origin = $V([0, 0, 0]);
	
	SPP.repulseStr = 5;
	SPP.repulseRange = 3;
	
	SPP.alignStr = 1;
	SPP.alignRange = 3.5;
	
	SPP.attractStr = 0.1;
	SPP.attractRange = 10;
	
	SPP.levyRange = Math.PI/4;
	SPP.levyExp = 10;
	SPP.levyStr = 0.5;
	
	SPP.velocity = 0.1;
	
	SPP.randWalkLUSize = 100;
	
	var randWalkLU = [];
	
	var position = position;
	var direction = direction;
	
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3());
    var material = new THREE.ParticleBasicMaterial( {size: 1, color: 0xffffff, map: THREE.ImageUtils.loadTexture("images/particle.png"), blending: THREE.AdditiveBlending, transparent: true} );
	var particle = new THREE.ParticleSystem(geometry, material);
	
	var repulseVector = SPP.origin;
	var alignVector = SPP.origin;
	var attractVector = SPP.origin;
	
	var siblingDist;
	
	//var levyWalk;

	this.updateSPP = function(siblings) {
		repulseVector = SPP.origin;
 		alignVector = SPP.origin;
		attractVector = SPP.origin;
		
		for (var j = 0; j < siblings.length; j++) {
			siblingDist = siblings[j].getPosition().distanceFrom(position);
			if (siblingDist <= SPP.repulseRange) {
				repulseVector = repulseVector.add(position.subtract(siblings[j].getPosition()).toUnitVector().multiply(SPP.repulseStr));//position.subtract(siblings[j].getPosition));
			}
			else if (siblingDist <= SPP.alignRange) {
				alignVector = alignVector.add(siblings[j].getDirection().toUnitVector().multiply(SPP.alignStr));
			}
			else if (siblingDist <= SPP.attractRange) {
				attractVector = attractVector.add(siblings[j].getPosition().subtract(position).toUnitVector().multiply(SPP.attractStr));
			}
		}
		
		//levyWalk = this.getLevyWalk();
		
		//direction = SPP.origin;
		r = 
		direction = direction.add(randWalkLU[Math.floor(Math.random() * SPP.randWalkLUSize)].multiply(SPP.levyStr));
		direction = direction.add(alignVector.toUnitVector().multiply(SPP.alignStr));
		direction = direction.add(repulseVector.toUnitVector().multiply(SPP.repulseStr));
		direction = direction.add(attractVector.toUnitVector().multiply(SPP.attractStr));
		
		direction = direction.toUnitVector();
		
		position = position.add(direction.toUnitVector().multiply(SPP.velocity));
	}
	
/* 	this.getLevyWalk = function() {
		dir = randVecLU[Math.floor(Math.random() * SPP.numRandVecLU)];
		
		dir = dir.rotate(levyStepLU[Math.floor(Math.random() * SPP.numLevyStepLU)], $L([0, 0, 0], [1, 0, 0]));
		dir = dir.rotate(levyStepLU[Math.floor(Math.random() * SPP.numLevyStepLU)], $L([0, 0, 0], [0, 1, 0]));
		dir = dir.rotate(levyStepLU[Math.floor(Math.random() * SPP.numLevyStepLU)], $L([0, 0, 0], [0, 0, 1]));
		
		return dir;
	} */
	
	var getGaussianAngle = function() {
		var y = Math.PI * Math.exp(-(Math.random() * 5) / (2 * 0.01*0.01));
		return Math.random() < 0.5 ? y : -y;
	}
	
	var getLevyAngle = function() {
		var u = Math.random() * (1 - Math.pow(SPP.levyRange + 1, -SPP.levyExp));
		var f = (1 - u) / Math.pow(1, SPP.levyExp);
		var x = Math.pow(f, 1 / -SPP.levyExp) - 1;
		
		return Math.random() < 0.5 ? -x : x;
	}
	
	this.updateView = function() {
		particle.position.x = position.e(1);
		particle.position.y = position.e(2);
		particle.position.z = position.e(3);
	}
	
	this.getParticle = function() {
		return particle;
	}
	
	this.getDirection = function() {
		return direction;
	}
	
	this.getPosition = function() {
		return position;
	}
	
	/**
		Pregenerate random walk vectors from normal distribution of angles and uniform random vectors.
	*/
	for (var i = 0; i < SPP.randWalkLUSize; i++) {
		var theta = getGaussianAngle();
		var mu = Math.random() < 0.5 ? Math.random() : -Math.random();
		
		randWalkLU[i] = $V([
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.cos(theta), 
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.sin(theta),
			mu
		]).toUnitVector();
	}
}