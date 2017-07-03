var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

//Register
router.get('/welcome', function(req, res){
	res.render('welcome');
});
//Register
router.get('/register', function(req, res){
	res.render('register');
});

//Login
router.get('/login', function(req, res){
	res.render('login');
});

//Register User
router.post('/register', function(req, res){
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var age = req.body.age;
	var email = req.body.email;
	var region = req.body.region;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var account_type = req.body.account_type;
	
	console.log(account_type)
	
	//Validation
	req.checkBody('first_name', 'First name is required').notEmpty();
	req.checkBody('last_name', 'Last name is required').notEmpty();
	req.checkBody('age', 'Age is required').notEmpty();
	req.checkBody('age', 'Age should be a number').isInt();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('region', 'Region is required').notEmpty();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	req.checkBody('account_type', 'Please specify the account type').notEmpty();
	
	var errors = req.validationErrors();
	
	if(errors){
		res.render('register', {
			errors: errors,
		});
	}else{
		User.findOne({'email': email}, function(err, user){
			//If user doesn't equal null that means that a user with the email already exists
			if(user != null){
				req.flash('error_msg', user.email + ' is already associated with an account.');
				res.redirect('/users/register');	
			}else{
				//Checks to see if username is taken
				User.findOne({'username': username}, function(err, user){
					if (user != null ){
						req.flash('error_msg', "The Username " +user.username + " is taken.");
						res.redirect('/users/register');	
					}else{
						//This runs if the email is not yet taken and registers the account
						var newUser = new User({
							first_name: first_name,
							last_name: last_name,
							age: age,
							email: email,
							region: region,
							username: username,
							password: password,
							account_type: account_type,
						});
						
						User.createUser(newUser, function(err, user){
							if(err) throw err;
						});
						
						req.flash('success_msg', 'You are registered and can now login');
						
						res.redirect('/users/login');
					}
				})
			}
		})
	}

});

passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUsername(username, function(err, user){
			if(err) throw err;
			if(!user){
				return done(null, false, {message: 'Unknown User'});
			}

			User.comparePassword(password, user.password, function(err, isMatch){
				if(err) throw err;
				if(isMatch){
					return done(null, user);
				} else {
					return done(null, false, {message: 'Invalid password'});
				}
			});
		});
	}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.getUserById(id, function(err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login',failureFlash: true}),
	function(req, res) {
		res.redirect('/');	
});

router.get('/logout', function(req, res){
	req.logout();
	req.flash('success_msg', 'You have logged out');
	res.redirect('login');
});

module.exports = router;
