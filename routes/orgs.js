var express = require('express');
var router = express.Router();

var User = require('../models/user');
var Organization = require('../models/organization');

router.get('/', ensureAuthenticated, function(req, res){
	var org_code = req.query['org_code']
	Organization.getOrganizationByCode(org_code, function(err, org){
		
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
