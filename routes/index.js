var express = require('express');
var router = express.Router();

var User = require('../models/user');
var Organization = require('../models/organization');





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
		orgs: req.user.orgs,
		is_student: is_student,
		is_teacher: is_teacher,
		is_counselor: is_counselor,
	}
	
	res.render('index', context);
});





router.get('/chat', ensureAuthenticated, function(req, res){
	res.render('chat');
});





router.get('/make_org', ensureAuthenticated, ensureCounselor, function(req, res){
	res.render('make_org');
});





router.post('/make_org', ensureAuthenticated, ensureCounselor, function(req, res){
	var name = req.body.name;
	var region = req.body.region;
	var code = req.body.code;
	
	//The leader of the organization is the user that created it
	var leader = req.user.username;
	
	req.checkBody('name', 'Organization name is required').notEmpty();
	req.checkBody('region', 'Organization region is required').notEmpty();
	req.checkBody('code', 'Organization code is required').notEmpty();
	
	var errors = req.validationErrors();

	
	if(errors){
		res.render('register', {
			errors: errors,
		});
	}else{
		//Checks to see if organization code is taken
		Organization.findOne({'code': code}, function(err, org){
			if (org != null ){
				req.flash('error_msg', "The code " + code + " is taken.");
				res.redirect('/make_org');	
			}else{
				//This runs if the email is not yet taken and registers the account
				var newOrg = new Organization({
					name: name,
					region: region,
					code: code,
					leader: leader,
				});
				
				Organization.createOrganization(newOrg, function(err, org){
					if(err) throw err;
				});
				
				req.flash('success_msg', 'You have created the organization ' + name);
				
				res.redirect('/');
			}
		});
	}
});

router.get('/wall_of_love', ensureAuthenticated, function(req, res){
	res.render('wall_of_love');
});

router.get('/org_code', ensureAuthenticated, ensureStudent, function(req, res){
	res.render('org_code');
});





//This handles input when user submits an organization code to join
router.post('/org_code', ensureAuthenticated, ensureStudent, function(req, res){
	var org_code = req.body.org_code;
	
	req.checkBody('org_code', 'Organization code must be entered').notEmpty();
	
	var errors = req.validationErrors();
	
	if(errors){
		res.render('register', {
			errors: errors,
		});
	}else{
		/*
		 * Gets desired organization data, then runs handleUserJoinOrg
		 * function to handle all of database updating
		 */
		Organization.getOrganizationByCode(org_code, function(err, organization){
			handleUserJoinOrg(err, organization, org_code, req, res);
		});
	}
});

/*
 * Runs when user wants to join an organization through entering code
 * Posted to /org_code page
 */
function handleUserJoinOrg(err, organization, org_code, req, res){	
	/*
	 * Runs if the organization code isn't associated with an organization
	 */
	if (!organization){
		req.flash('error_msg', 'Organization for code ' + org_code + " does not exist.");
		res.redirect('/org_code');
	////
	
	}else{
		User.getUserByUsername(req.user.username, function(err, user){	
			var orgs = user.orgs;
			if (checkUserInOrg(orgs, org_code)){
				/*
				 * If user is already in the organization of the code entered
				 * Gets redirected to dashboard with error message
				 */
				req.flash('error_msg', 'You already in this organization.');
				res.redirect('/');
				////
			}else{
				/*
				 * Updates the orgs a user is in by 
				 * adding the org they just joined 
				 */
				User.update({orgs: orgs.concat(org_code)}, throwError);
				////
				
				/*
				 * Updates the member section of an organization
				 * by adding the user that just joined
				 */
				var updated_members = organization.members;
				
				organization.update({members: updated_members.concat(req.user.username)}, throwError);
				////
				
				/*
				 * If successful, redirects back to dashboard displaying success message
				 */
				req.flash('success_msg', 'You have successfully joined an organization!');
				res.redirect('/');
				////
			}
		});
	}
}

/*
 * Checks if the user is in the organization he is trying to join
 */
function checkUserInOrg(user_orgs, org_code){
	//This doesn't work on Internet Explorer
	return (user_orgs).indexOf(org_code) >= 0;
}





/*
 * I think this is only for development setting
 * Simply throws an error if there is an error
 */
function throwError(err, result){
	if (err) throw err;
}

/*
 * Requires user to be authenticated to access
 * Attatched to all pages that require user to be authenticated
 */
function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}else{
		res.redirect('/users/login');
	}
}

/*
 * Requires user to have a student account type to access
 * Attatched to pages that only students should be able to see
 */
function ensureStudent(req, res, next){
	if (req.user.account_type === "s"){
		return next();
	}else{
		req.flash('error_msg', 'The page you requested is for students only.');
		res.redirect('/');
	}
}

/*
 * Requires user to have a counselor account type to access
 * Attatched to pages that only counselors should be able to see
 */
function ensureCounselor(req, res, next){
	if (req.user.account_type === "c" || req.user.account_type === "t"){
		return next();
	}else{
		req.flash('error_msg', 'The page you requested is for counselors only.');
		res.redirect('/');
	}
}

module.exports = router;
