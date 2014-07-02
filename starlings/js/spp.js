function SPP(position, direction) {
	SPP.velocity = 0.01;
	
	var UID = Math.random().toString(36).substr(2, 9);
	
	var position = position;
	var direction = direction;
	
	var geometry = new THREE.SphereGeometry(0.075, 32, 32);
	var material = new THREE.MeshPhongMaterial({ambient: 0x030303, color: 0x667799, specular: 0xffffff, shininess: 10, shading: THREE.SmoothShading});
	var mesh = new THREE.Mesh(geometry, material);
	
	this.updateSPP = function(siblings) {
 		var meanDirection;
		for (j = 0; j < siblings.length; j++) {
			meanDirection += siblings[j].getDirection();
		}
		
		//do stuff with mean direction
		
		var levyWalk = this.getLevyWalk();
		
		direction += levyWalk;
		
		var movement = $V([1, 0]).rotate(direction, $V([0, 0]));
		
		position = position.add(movement.multiply(SPP.velocity));
	}
	
	this.getLevyWalk = function() {
		var a = 5;
		var k = 1;
		var range = Math.PI*2;
		
		var u = Math.random() * (1 - Math.pow(range + 1, -a));
		
		var f = (1 - u) / Math.pow(k, a);
		var x = Math.pow(f, 1 / -a) - 1;
		
		x = Math.random() < 0.5 ? -x : x;
		
		return x;
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
}