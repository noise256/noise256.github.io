function SPP(position, direction) {
	SPP.velocity = 0.001;
	
	this.direction = direction;
	
	var geometry = new THREE.BoxGeometry(1, 1, 1);
	var material = new THREE.MeshPhongMaterial({ambient: 0x030303, color: 0x007799, specular: 0x000000, shininess: 30, shading: THREE.SmoothShading});
	var mesh = new THREE.Mesh(geometry, material);
	
	mesh.position.x = position[0];
	mesh.position.y = position[1];
	
	this.updateSPP = function() {
		mesh.position.x += direction[0] * SPP.velocity;
		mesh.position.y += direction[1] * SPP.velocity;
		
		mesh.rotation.x += 0.01;
	};
	
	this.getMesh = function() {
		mesh.position.x = position[0];
		mesh.position.y = position[1];
		
		return mesh;
	};
}