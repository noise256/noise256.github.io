function SPP(position, direction) {
	SPP.alignStr = 0.05;
	SPP.levyStr = 1;
	
	SPP.alignRange = 1;
	SPP.velocity = 0.01;
	
	SPP.levyRange = Math.PI/2;
	SPP.levyExp = 5;
	
	var position = position;
	var direction = direction;
	
	var geometry = new THREE.SphereGeometry(0.075, 32, 32);
	var material = new THREE.MeshBasicMaterial({ambient: 0x030303, color: 0x667799, specular: 0xffffff, shininess: 10, shading: THREE.SmoothShading});
	var mesh = new THREE.Mesh(geometry, material);
	
	this.updateSPP = function(siblings) {
 		var meanDirection = $V([0, 0]);
		
		for (var j = 0; j < siblings.length; j++) {
			if (siblings[j].getPosition().distanceFrom(position) <= SPP.alignRange) {
				meanDirection = meanDirection.add(siblings[j].getDirection());
			}
		}
		
		meanDirection = meanDirection.multiply(1/siblings.length);
		
		var levyWalk = this.getLevyWalk();
		
		direction = $V([0, 0]);
		direction = direction.add(levyWalk.toUnitVector().multiply(SPP.levyStr));
		direction = direction.add(meanDirection.toUnitVector().multiply(SPP.alignStr));
		
		position = position.add(direction.toUnitVector().multiply(SPP.velocity));
	}
	
	this.getLevyWalk = function() {
		var range = SPP.levyRange;
		var a = SPP.levyExp;
		var k = 1;
		
		var u = Math.random() * (1 - Math.pow(range + 1, -a));
		
		var f = (1 - u) / Math.pow(k, a);
		var x = Math.pow(f, 1 / -a) - 1;
		
		x = Math.random() < 0.5 ? -x : x;
		
		x += Math.atan2(direction.e(2), direction.e(1));
		
		return $V([1, 0]).rotate(x, $V([0, 0]));
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