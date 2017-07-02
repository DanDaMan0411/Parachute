var express = require('express');
var router = express.Router();

//Get homepage
router.get('/', ensureAuthenticated, function(req, res){
	var context = {
		first_name: req.user.first_name,
		last_name: req.user.last_name,
	}
	
	res.render('index', context);
});

router.get('/chat', ensureAuthenticated, function(req, res){
	res.render('chat');
});

router.get('/wall_of_love', ensureAuthenticated, function(req, res){
	res.render('wall_of_love');
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}else{
		res.redirect('/users/login');
	}
}

module.exports = router;
