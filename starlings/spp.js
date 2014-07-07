function SPP(position, direction) {
	SPP.origin = $V([0, 0, 0]);
	
	SPP.repulseStr = 1;
	SPP.repulseRange = 0.5;
	
	SPP.alignStr = 0.5;
	SPP.alignRange = 1;
	
	SPP.attractStr = 0.5;
	SPP.attractRange = 2;
	
	SPP.levyRange = Math.PI/8;
	SPP.levyExp = 5;
	SPP.levyStr = 0.5;
	
	SPP.velocity = 0.1;
	
	SPP.numRandVecLU = 100;
	SPP.numLevyStepLU = 100;
	
	var randVecLU = [];
	var levyStepLU = [];
	
	var position = position;
	var direction = direction;
	
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3());
    var material = new THREE.ParticleBasicMaterial( {size: 20, color: 0xffffff, map: THREE.ImageUtils.loadTexture("images/particle.png"),} );
	var particle = new THREE.ParticleSystem(geometry, material);
	
	var repulseVector = SPP.origin;
	var alignVector = SPP.origin;
	var attractVector = SPP.origin;
	
	var siblingDist;
	
	var levyWalk;

	this.updateSPP = function(siblings) {
		repulseVector = SPP.origin;
 		alignVector = SPP.origin;
		attractVector = SPP.origin;
		
		for (var j = 0; j < siblings.length; j++) {
			siblingDist = siblings[j].getPosition().distanceFrom(position);
			if (siblingDist <= SPP.repulseRange) {
				repulseVector = repulseVector.add(position.subtract(siblings[j].getPosition()));//position.subtract(siblings[j].getPosition));
			}
			else if (siblingDist <= SPP.alignRange) {
				alignVector = alignVector.add(siblings[j].getDirection());
			}
			else if (siblingDist <= SPP.attractRange) {
				attractVector = attractVector.add(siblings[j].getPosition().subtract(position));
			}
		}
		
		levyWalk = this.getLevyWalk();
		
		//direction = SPP.origin;
		direction = direction.add(levyWalk.toUnitVector().multiply(SPP.levyStr));
		direction = direction.add(alignVector.toUnitVector().multiply(SPP.alignStr));
		direction = direction.add(repulseVector.toUnitVector().multiply(SPP.repulseStr));
		direction = direction.add(attractVector.toUnitVector().multiply(SPP.attractStr));
		
		direction = direction.toUnitVector();
		
		position = position.add(direction.toUnitVector().multiply(SPP.velocity));
	}
	
	this.getLevyWalk = function() {
		dir = randVecLU[Math.floor(Math.random() * SPP.numRandVecLU)];
		
		dir = dir.rotate(levyStepLU[Math.floor(Math.random() * SPP.numLevyStepLU)], $L([0, 0, 0], [1, 0, 0]));
		dir = dir.rotate(levyStepLU[Math.floor(Math.random() * SPP.numLevyStepLU)], $L([0, 0, 0], [0, 1, 0]));
		dir = dir.rotate(levyStepLU[Math.floor(Math.random() * SPP.numLevyStepLU)], $L([0, 0, 0], [0, 0, 1]));
		
		return dir;
/* 		var u = Math.random() * (1 - Math.pow(SPP.levyRange + 1, -SPP.levyExp));//Math.random() * Math.PI * 2;
		var f = (1 - u) / Math.pow(1, SPP.levyExp);
		var x = Math.pow(f, 1 / -SPP.levyExp) - 1;
		x = Math.random() < 0.5 ? -x : x;
		
		var mu = Math.random() < 0.5 ? Math.random() : -Math.random();
		
		var dir = $V([
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.cos(x), 
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.sin(x),
			mu
		]);
		
		return dir; */
/* 		var u = Math.random() * (1 - Math.pow(SPP.levyRange + 1, -SPP.levyExp));
		
		var f = (1 - u) / Math.pow(1, SPP.levyExp);
		var x = Math.pow(f, 1 / -SPP.levyExp) - 1;
		
		x = Math.random() < 0.5 ? -x : x;
		
		x += Math.atan2(direction.e(2), direction.e(1));
		
		return $V([1, 0]).rotate(x, SPP.origin); */
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
/* 	this.getMesh = function() {
		return mesh;
	} */
	
	this.getDirection = function() {
		return direction;
	}
	
	this.getPosition = function() {
		return position;
	}
	
	/**
		Pre-generate levy steps to reduce load.
	*/
	for (var i = 0; i < SPP.numLevyStepLU; i++) {
		levyStepLU[i] = getLevyAngle();
	}
	
	/**
		Pre-generate random 3D vectors to reduce load.
	*/
	for (var i = 0; i < SPP.numLevyStepLU; i++) {
		var theta = Math.random() * Math.PI * 2;
		var mu = Math.random() < 0.5 ? Math.random() : -Math.random();
		
		randVecLU[i] = $V([
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.cos(theta), 
			Math.sqrt(1 - Math.pow(mu, 2)) * Math.sin(theta),
			mu
		]);
	}
}