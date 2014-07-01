function SPP(position, direction) {
	SPP.velocity = 0.01;
	
	this.direction = direction;
	
	var geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
	var material = new THREE.MeshPhongMaterial({ambient: 0x030303, color: 0x007799, specular: 0x000000, shininess: 30, shading: THREE.SmoothShading});
	var mesh = new THREE.Mesh(geometry, material);
	
	mesh.position.x = position[0];
	mesh.position.y = position[1];
	
	this.updateSPP = function() {
		var a = 0.1;
		var k = 1;
		var range = Math.PI*2;
		
		var u = Math.random() * (1 - Math.pow(range + 1, -a));
		
		var f = (1 - u) / Math.pow(k, a);
		var x = Math.pow(f, 1 / -a) - 1;
		
		x = Math.random() < 0.5 ? -x : x;
		
		mesh.position.x += Math.cos(x) * SPP.velocity;
		mesh.position.y += Math.sin(x) * SPP.velocity;
		
		mesh.rotation.x += 0.01;
	};
	
	this.getMesh = function() {
		return mesh;
	};
}