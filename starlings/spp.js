function SPP(position, direction) {
	SPP.origin = $V([0, 0, 0]);
	
	SPP.repulseStr = 1;
	SPP.repulseRange = 3;
	
	SPP.alignStr = 1;
	SPP.alignRange = 3.5;
	
	SPP.attractStr = 1;
	SPP.attractRange = 10;
	
	SPP.walkStr = 1;
	
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
		
		var movement = $V([0, 0]);//randWalkLU[Math.floor(Math.random() * SPP.randWalkLUSize)].multiply(SPP.walkStr);
		
		movement = movement.add(alignVector.multiply(SPP.alignStr));
		movement = movement.add(repulseVector.multiply(SPP.repulseStr));
		movement = movement.add(attractVector.multiply(SPP.attractStr));
		
		direction.add(movement.toUnitVector());
		
		position = position.add(direction.multiply(SPP.velocity));
	}
	
	var getGaussianAngle = function() {
		var y = Math.PI * Math.exp(-(Math.random() * 5) / (2 * 0.01*0.01));
		return Math.random() < 0.5 ? y : -y;
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
		var theta = Math.random() * Math.PI * 2;//getGaussianAngle();
		var mu = Math.random() < 0.5 ? Math.random() : -Math.random();
		
		var vec = $V([
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.cos(theta), 
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.sin(theta),
			mu
		]).toUnitVector();
		
		var g1 = getGaussianAngle();
		var g2 = getGaussianAngle();
		var g3 = getGaussianAngle();
		
		vec = vec.rotate(g1, $L([0, 0, 0], [1, 0, 0]));
		vec = vec.rotate(g2, $L([0, 0, 0], [0, 1, 0]));
		vec = vec.rotate(g3, $L([0, 0, 0], [0, 0, 1]));
		
		randWalkLU[i] = vec;
	}
}