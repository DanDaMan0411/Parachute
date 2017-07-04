var express = require('express');
var router = express.Router();

var User = require('../models/user');

//Get homepage
router.get('/', ensureAuthenticated, function(req, res){
	var account_type = req.user.account_type;
	
	//Different content is displayed on dashboard depending on the type of account the user has
	//I.E. teachers and counselors cannot join organizations, they can only make them
	//This is set up like this because handlebars can only handle true or false operators
	var is_student;
	var is_teacher;
	var is_counselor;
	
	if (account_type === "s"){
		is_student = true;
	}else if (account_type === "t"){
		is_teacher = true;
	}else if (account_type === "c"){
		is_counselor = true;
	}
	
	var context = {
		first_name: req.user.first_name,
		last_name: req.user.last_name,
		joined_orgs: req.user.joined_orgs,
		is_student: is_student,
		is_teacher: is_teacher,
		is_counselor: is_counselor,
	}
	
	res.render('index', context);
});

router.get('/chat', ensureAuthenticated, function(req, res){
	res.render('chat');
});

router.get('/make_org', ensureAuthenticated, function(req, res){
	res.render('make_org');
});

router.get('/wall_of_love', ensureAuthenticated, function(req, res){
	res.render('wall_of_love');
});

router.get('/org_code', ensureAuthenticated, function(req, res){
	res.render('org_code');
});

router.post('/org_code', ensureAuthenticated, function(req, res){
	var org_code = req.body.org_code;
	
	req.checkBody('org_code', 'Organization code must be entered').notEmpty();
	
	var errors = req.validationErrors();
	
	if(errors){
		res.render('register', {
			errors: errors,
		});
	}else{
		User.getUserByUsername(req.user.username, function(err, user){
			var joined_orgs = user.joined_orgs;
			console.log();
			console.log(joined_orgs);
			console.log(joined_orgs.concat(org_code));
			User.update({joined_orgs: joined_orgs.concat(org_code)}, function(err, result){
				if (err) throw err;
			});
		});
		
		req.flash('success_msg', 'You have successfully joined an organization!');
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
