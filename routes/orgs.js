var express = require('express');
var router = express.Router();

var User = require('../models/user');
var Organization = require('../models/organization');

/*
 * Displays page of queried organization
 */
router.get('/', ensureAuthenticated, function(req, res){
	var org_code = req.query['org_code'];
	Organization.getOrganizationByCode(org_code, function(err, org){
		/*
		 * If organization exists, fetches
		 * all of its data and loads page
		 */
		if (org){
			var context = {
				org: org,
				is_counselor: isCounselor(req.user.account_type),
				is_student: isStudent(req.user.account_type),
				user_in_org: isStudentInOrg(org.members, req.user.username)
			}
			
			res.render('org_page', context);
		
		/*
		 * Runs if result for org code is null
		 */
		}else{
			req.flash('error_msg', 'The organization you are looking for does not exist.');
			res.redirect('/');
		}
	});
});




/*
 * Leaves requested organization
 */
router.post('/leave_org', ensureAuthenticated, function(req, res){
	var org_code = req.body.org_code;
	
	/*
	 * Removes organization from user orgs list
	 */
	 User.getUserByUsername(req.user.username, function(err, user){
		if (err) throw err;
		
		var new_orgs = user.orgs;
		 
		/*
		 * Index of the org  wanted to leave
		 */
		var org_index = new_orgs.indexOf(org_code);
		
		/*
		 * Makes sure org is in orgs list
		 * Should always be the case, just precautionary
		 */
		if (org_index >= 0){
			new_orgs.splice(org_index, 1);
		}
		
		user.update({orgs: new_orgs}, throwError);
	 });
	
	 
	/*
	 * Removes user as a member of the organization
	 */
	Organization.getOrganizationByCode(org_code, function(err, org){
		if (err) throw err;
		
		var new_members = org.members;
		
		/*
		 * Index of the user that wants to leave
		 */
		var user_index = new_members.indexOf(req.user.username);
		
		/*
		 * Makes sure user is in members list
		 * Should always be the case, just precautionary
		 */
		if (user_index >= 0){
			new_members.splice(user_index, 1);
		}
		
		org.update({members: new_members}, throwError);
		
		
		/*
		 * redirect happens here to fetch 
		 * the organization's name
		 */
		req.flash('success_msg', 'You have left the ' + org.name);
		res.redirect('/');
	});
});




/*
 * Removes specified user from desired organization
 */
router.post('/rem_user', ensureAuthenticated, function(req, res){
	var org_code = req.body.org_code;
	var username = req.body.username;
	
	 
	/*
	 * Removes user as a member of the organization
	 */
	Organization.getOrganizationByCode(org_code, function(err, org){
		if (err) throw err;
		
		var new_members = org.members;
		
		/*
		 * Index of the user that wants to leave
		 */
		var user_index = new_members.indexOf(username);
		
		/*
		 * Makes sure user is in members list
		 * Should always be the case, just precautionary
		 */
		if (user_index >= 0){
			new_members.splice(user_index, 1);
		}
		
		console.log(new_members)
		
		org.update({members: new_members}, throwError);
	});
	
	/*
	 * Removes organization from user orgs list
	 */
	 User.getUserByUsername(username, function(err, user){
		if (err) throw err;
		
		var new_orgs = user.orgs;
		 
		/*
		 * Index of the org  wanted to leave
		 */
		var org_index = new_orgs.indexOf(org_code);
		
		/*
		 * Makes sure org is in orgs list
		 * Should always be the case, just precautionary
		 */
		if (org_index >= 0){
			new_orgs.splice(org_index, 1);
		}
		
		user.update({orgs: new_orgs}, throwError);
		
		req.flash('success_msg', 'You have removed the user');
	
		/*
		 * redirects to the same org page 
		 * the user was previously on
		 */
		res.redirect('back');
	 });
});




function isCounselor(account_type){
	if (account_type === "c"){
		return true;
	}
	return false;
}

function isStudent(account_type){
	if (account_type === "s"){
		return true;
	}
	return false;
}






function isStudentInOrg(members, username){
	//indexOf does not work on internet explorer
	if (members.indexOf(username) >= 0){
		return true;
	}
	return false;
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

module.exports = router;
