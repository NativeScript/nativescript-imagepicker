var frame = require("ui/frame");
var imagepicker = require("imagepicker");

function onSelectImagesTap(args) {
	var topmost = frame.topmost();

	var pickerContext = imagepicker.create();
	pickerContext.on(imagepicker.selectionEvent, args => {
		console.log("Done selecting:")
		args.urls.forEach(function(url) {
			console.log(" - " + url);
		});
	});

	var promise = pickerContext.authorize();
	exports.promise = promise;
	console.log("Promise: " + promise);
	promise.then(
		function() {
			console.log("Promise then called!");
			topmost.navigate({
				moduleName: "./tns_modules/imagepicker/albums",
				context: pickerContext
			});

		}).catch(function(e) {
			console.log("Error " + e);
		});
	console.log("promise.then( called");

	topmost.navigate({
		moduleName: "./tns_modules/imagepicker/albums",
		context: pickerContext
	});
}
exports.onSelectImagesTap = onSelectImagesTap;
