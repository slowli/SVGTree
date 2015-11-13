var express = require('express');
var app = express();

app.use('/static', express.static('./public'));

app.set('view engine', 'jade');
app.set('views', './views');

var viewOptions = {
	app_version: process.env.npm_package_version,
	url_root: '',
	static_html: false
};

app.get('/', function(req, res) {
	res.render('index', viewOptions);
});
app.get('/demo', function(req, res) {
	res.render('demo', viewOptions);
});
app.get('/viewer-demo', function(req, res) {
	res.render('demo-viewer', viewOptions);
});

app.set('port', process.env.PORT || 4000);
var server = app.listen(app.get('port'), function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('%s-%s is running on port %s', process.env.npm_package_name, 
		process.env.npm_package_version, 
		app.get('port'));
});
