window.onload = function() {
	renderer.initRenderer();
	renderer.initModel();
	renderer.frame();
}

var renderer = {
	canvasWidth: 1000,
	canvasHeight: 800,
	
	init: function() {
		alert(x + y);
	}
}