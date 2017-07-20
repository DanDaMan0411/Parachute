var express = require('express');
var router = express.Router();

var _ = require('underscore');

var User = require('../models/user');
var Inbox = require('../models/inbox');
var Organization = require('../models/organization');



////////////////////////////////////////
//Data Fetch Structure order
//
//(If one context key is skipped,
//then go to next in line)
//
//>>first_name, last_name
//
//>>orgs
//
//>>is_student, is_counselor, is_teacher
//
//>>inbox
////////////////////////////////////////
router.get('/', ensureAuthenticated, function(req, res){
	var context = {
		first_name: req.user.first_name,
		last_name: req.user.last_name,
	}
	
	/*
	 * req.user.orgs data gets run through returnOrgInfo function
	 * to fetch the detailed information of the orgs the user is 
	 * currently in. Page is loaded inside loadIndexPage function
	 */
	if ((req.user.orgs).length > 0){
		insertOrgInfo(req, res, context, req.user.orgs);
	////


	/*
	 * If the user is not in any orgs, then skips
	 * the function where the data is fetched and 
	 * goes to fetching account_type info
	 */
	}else{
		context.orgs = null;
		insertAccountTypeInfo(req, res, context, req.user.account_type);
	}
	////
});

/*
 * Takes an input of org_codes and returns an
 * object with each organization's information.
 * 
 * The only reason req and res are passed through
 * here is because it is required to load the page
 * through the loadIndexPage function
 * 
 * Inserts org_info_object into the context 
 * that is passed  through as a parameter
 */
function insertOrgInfo(req, res, context, org_code_list){
	var list_length = org_code_list.length;
	var org_info_list = [];
		
	for (var i = 0; i < list_length; i++){
		Organization.getOrganizationByCode(org_code_list[i], function(err, organization){			
			org_info_list.push(organization) ;
			
			if (org_info_list.length == list_length){
				/*
				 * The _.sortBy sorts the org_info_list in 
				 * alphabetical order based on the name.
				 * 
				 * Without it, the list is randomly ordered
				 * each time the page is loaded
				 */
				context.orgs = _.sortBy(org_info_list, 'name');
								
				/*
				 * Fetches next data item for context, which is account_type
				 */
				insertAccountTypeInfo(req, res, context, req.user.account_type);
			}
		});
	}
}
////

function insertAccountTypeInfo(req, res, context, account_type){
	/*
	 * Different content is displayed on dashboard depending on the type of account the user has
	 * I.E. teachers and counselors cannot join organizations, they can only make them
	 * This is set up like this because handlebars can only handle true or false operators
	 */
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
	////
	
	context.is_student = is_student;
	context.is_counselor = is_counselor;
	context.is_teacher = is_teacher;
	
	/*
	 * Fetches next data item for context, which is inbox
	 */
	insertInboxInfo(req, res, context, req.user.inbox)
}

/*
 * Uses user's inbox codes and finds them inside
 * inbox database and replaces the code with the 
 * full inbox message information so that it can 
 * be useful to the user
 */
function insertInboxInfo(req, res, context, inbox_code_list){
	var list_length = inbox_code_list.length;
	var inbox_info_list = [];
	
	if (list_length > 0){
		for (var i = 0; i < list_length; i++){
			Inbox.getInboxById(inbox_code_list[i], function(err, inbox){			
				inbox_info_list.push(inbox); 
				
				if (inbox_info_list.length == list_length){
					/*
					 * The _.sortBy sorts the org_info_list in 
					 * alphabetical order based on the name.
					 * 
					 * Without it, the list is randomly ordered
					 * each time the page is loaded
					 * 
					 * .reverse() sorts messages so 
					 *  newest message appears on top
					 */
					context.inbox = _.sortBy(inbox_info_list, 'timestamp').reverse();
									
					
					loadIndexPage(req, res, context);
				}
			});
		}
	}else{
		/*
		 * Runs if user has no inbox messages.
		 * Skips the whole sorting inbox info process.
		 */
		loadIndexPage(req, res, context);
	}
}

/*
 * Index page gets loaded here after organization
 * data is fetched from returnOrgInfo function
 */
function loadIndexPage(req, res, context){
	res.render('index', context);
}





router.get('/chat', ensureAuthenticated, function(req, res){
	res.render('chat');
});





router.get('/make_org', ensureAuthenticated, ensureCounselor, function(req, res){
	res.render('make_org');
});




/*
 * Runs when counselor creates a new organization
 */
router.post('/make_org', ensureAuthenticated, ensureCounselor, function(req, res){
	var name = req.body.name;
	var region = req.body.region;
	var code = req.body.code;
	
	/*
	 * The leader of the organization is the user that created it
	 */
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
		Organization.findOne({'code': code}, function(err, org){
			handleUserMakeOrg(err, org, req, res, name, region, code, leader);
		});
	}
});

/*
 * Runs when user wants to create an organization
 * Posted to /make_org page
 */
function handleUserMakeOrg(err, org, req, res, name, region, code, leader){
	/*
	 * Checks to see if organization code is taken
	 */
	if (org != null ){
		req.flash('error_msg', "The code " + code + " is taken.");
		res.redirect('/make_org');
	////
	
	
	}else{
		/*
		 * Creates a new Organization instance
		 * and saves it in the database
		 */
		var newOrg = new Organization({
			name: name,
			region: region,
			code: code,
			leader: leader,
		});
		
		Organization.createOrganization(newOrg, function(err, org){
			if(err) throw err;
		});
		////
		
		
		/*
		 * Updates the orgs a user is in by 
		 * adding the org they just created
		 */
		var orgs = req.user.orgs; 
	
		User.getUserByUsername(req.user.username, function(err, user){
			user.update({orgs: orgs.concat(code)}, throwError);
		});
		////
		
		req.flash('success_msg', 'You have created the organization ' + name);
		
		res.redirect('/');
	}
}





router.get('/wall_of_love', ensureAuthenticated, function(req, res){
	res.render('wall_of_love');
});

router.get('/org_code', ensureAuthenticated, ensureStudent, function(req, res){
	res.render('org_code');
});




/*
* Handles input when user submits an organization code to join
*/
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
				req.flash('success_msg', 'You have joined the ' + organization.name + '!');
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
