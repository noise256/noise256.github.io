function SPP(position, direction) {
	SPP.origin = $V([0, 0]);
	
	SPP.repulseStr = 0.05;
	SPP.repulseRange = 0.1;
	
	SPP.alignStr = 0.05;
	SPP.alignRange = 1;
	
	SPP.attractStr = 0.05;
	SPP.attractRange = 2;
	
	SPP.levyRange = Math.PI/2;
	SPP.levyExp = 5;
	SPP.levyStr = 0.5;
	
	SPP.velocity = 0.01;
	
	var position = position;
	var direction = direction;
	
	var geometry = new THREE.PlaneGeometry(0.075, 0.075);//SphereGeometry(0.075, 32, 32);
	var material = new THREE.MeshBasicMaterial({ambient: 0x030303, color: Math.random() * 0x667799, specular: 0xffffff, shininess: 10, shading: THREE.SmoothShading});
	var mesh = new THREE.Mesh(geometry, material);
	
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
		
		direction = SPP.origin;
		direction = direction.add(levyWalk.toUnitVector().multiply(SPP.levyStr));
		direction = direction.add(alignVector.toUnitVector().multiply(SPP.alignStr));
		direction = direction.add(repulseVector.toUnitVector().multiply(SPP.repulseStr));
		direction = direction.add(attractVector.toUnitVector().multiply(SPP.attractStr));
		
		position = position.add(direction.toUnitVector().multiply(SPP.velocity));
	}
	
	this.getLevyWalk = function() {
		var u = Math.random() * (1 - Math.pow(SPP.levyRange + 1, -SPP.levyExp));
		
		var f = (1 - u) / Math.pow(1, SPP.levyExp);
		var x = Math.pow(f, 1 / -SPP.levyExp) - 1;
		
		x = Math.random() < 0.5 ? -x : x;
		
		x += Math.atan2(direction.e(2), direction.e(1));
		
		return $V([1, 0]).rotate(x, SPP.origin);
	}
	
	this.updateView = function() {
		mesh.position.x = position.e(1);
		mesh.position.y = position.e(2);
	}
	
	this.getMesh = function() {
		return mesh;
	}
	
	this.getDirection = function() {
		return direction;
	}
	
	this.getPosition = function() {
		return position;
	}
}