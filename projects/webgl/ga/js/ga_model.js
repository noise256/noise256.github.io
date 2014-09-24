var gblSimulation = {};

window.onload = function() {
	GASimulation();
}

function GASimulation() {
	gblSimulation.simulationView = new Renderer(document.getElementById("canvas"));
	gblSimulation.simulationView.init();
	
	gblSimulation.simulationView.camera.position.set(24, 2000, 2000);
	gblSimulation.simulationView.camera.lookAt(new THREE.Vector3(0, 2000, 0));
	gblSimulation.simulationView.renderer.setClearColor(0xffffff);
	
	gblSimulation.objectManager = new ObjectManager();
	gblSimulation.objectManager.init();
	
	generate();
	//skybox();
	
	this.frame = function() {
		requestAnimationFrame(this.frame.bind(this));
		
		gblSimulation.objectManager.update();
		gblSimulation.simulationView.update();
	}
	
	this.frame();
}

function generate() {
	Node.prototype.init();
	
	var nodeList = [];
	
	nodeList.push(Tree.prototype.create());
	
	gblSimulation.objectManager.objectList.nodeList = nodeList;
}

function Tree(root) {
	this.root = root;
}

Tree.prototype = {
	create:function() {
		var nodeMaterial = new THREE.PointCloudMaterial( {map: THREE.ImageUtils.loadTexture("images/particle-grey.png"), size: 100, color: 0xffffff, transparent: true});
		var nodeGeometry = new THREE.Geometry();
		
		var edgeMaterial = new THREE.LineBasicMaterial({color: 0x666666, opacity: 0.5, transparent: true});
		var edgeGeometry = new THREE.Geometry();
		
		var root = Node.prototype.create(new THREE.Vector3(0.0,0.0,0.0), null, 5, nodeGeometry, edgeGeometry)
		
		gblSimulation.simulationView.scene.add(new THREE.PointCloud(nodeGeometry, nodeMaterial));
		gblSimulation.simulationView.scene.add(new THREE.Line(edgeGeometry, edgeMaterial));
		
		return new Tree(root);
	},
	
	update:function() {
		//this.view.update(this.position);
	},
}

function Node(position, parent) {
	this.position = position;
	this.parent = parent;
	this.children = [];
}

Node.prototype = {
	storedMaterials:[],
	
	init:function() {
		var PI2 = Math.PI * 2;
		var nodeMaterial = new THREE.SpriteCanvasMaterial( {
			color: 0xffffff,
			program: function (context) {
				context.beginPath();
				context.arc(0, 0, 0.5, 0, PI2, true);
				context.fill();
			}
		});
		
		var edgeMaterial = new THREE.LineBasicMaterial({
			color: 0xffffff, 
			opacity: 0.5, 
			lineWidth: 0.5 
		});
		
		this.storedMaterials.push({name: 'nodeMaterial', value: nodeMaterial});
		this.storedMaterials.push({name: 'edgeMaterial', value: edgeMaterial});
	},
	
	getMaterialByName:function(name) {
		for (var i = 0; i < this.storedMaterials.length; i++) {
			if (this.storedMaterials[i].name == name) {
				return this.storedMaterials[i].value;
			}
		}
	},
	
	create:function(position, parent, depth, nodeGeometry, edgeGeometry) {
		var view = new View();
		
		nodeGeometry.vertices.push(new THREE.Vector3(position.x, position.y, position.z));
		
		if (parent != null) {
			edgeGeometry.vertices.push(new THREE.Vector3(parent.position.x, parent.position.y, parent.position.z));
			edgeGeometry.vertices.push(new THREE.Vector3(position.x, position.y, position.z));
		}
		
		var node = new Node(position, parent);
		
		if (depth > 0) {
			var degree = 2;
			
			for (var i = 0; i < degree; i++) {
				var childPosition = new THREE.Vector3().addVectors(node.position, new THREE.Vector3((Math.random() * 300.0) - 150.0, (Math.random() * 225.0) + 25.0, (Math.random() * 300.0) - 150.0));

				node.children.push(Node.prototype.create(childPosition, node, depth - 1, nodeGeometry, edgeGeometry));
			}
		}
		
		return node;
	},
}

function View() {
	this.meshes = [];
}

View.prototype = {
	update:function(position) {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].value.position.set(position.x, position.y, position.z);
		}
	},
	
	setWorldParent:function(worldParent) {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].value.worldParent = worldParent;
		}
	},
	
	getMeshByName:function(name) {
		for (var i = 0; i < this.meshes.length; i++) {
			if (this.meshes[i].name == name) {
				return this.meshes[i];
			}
		}
	}
}