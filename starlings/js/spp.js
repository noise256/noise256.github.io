function SPP(position, direction) {
	SPP.velocity = 0.001;
	
	this.position = position;
	this.direction = direction;
	
	var geometry = new THREE.BoxGeometry(1, 1, 1);
	var material = new THREE.MeshBasicMaterial({ambient: 0x030303, color: 0x007799, specular: 0x000000, shininess: 30, shading: THREE.SmoothShading});
	var mesh = new THREE.Mesh(geometry, material);
	
	this.updateSPP = function() {
		//position[0] += direction[0] * SPP.velocity;
		//position[1] += direction[1] * SPP.velocity;
		//mesh.rotation.x += 0.001;
	};
	
	this.getMesh = function() {
		//mesh.position.x = position[0];
		//mesh.position.y = position[1];
		
		return mesh;
	};
}