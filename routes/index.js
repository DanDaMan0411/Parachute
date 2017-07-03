var express = require('express');
var router = express.Router();

var User = require('../models/user');

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

router.get('/class_code', ensureAuthenticated, function(req, res){
	res.render('class_code');
});

router.post('/class_code', ensureAuthenticated, function(req, res){
	var class_code = req.body.class_code;
	
	req.checkBody('class_code', 'Class code must be entered').notEmpty();
	
	var errors = req.validationErrors();
	
	if(errors){
		res.render('register', {
			errors: errors,
		});
	}else{
		User.update({class_code: class_code}, function(err, result){
			if (err) throw err;
		});
		
		req.flash('success_msg', 'You have successfully joined a class!');
		res.redirect('/');
	}
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}else{
		res.redirect('/users/login');
	}
}

module.exports = router;
