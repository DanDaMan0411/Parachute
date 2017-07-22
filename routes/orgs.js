var express = require('express');
var router = express.Router();

var url = require('url');

var User = require('../models/user');
var Organization = require('../models/organization');
var Inbox = require('../models/inbox');

var notification_vars = require('../variables/notifications');

var inbox_functions = require('../functions/inbox_functions');

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
			
			/*
			 * Used for accessing org_code
			 * while dealing with an org page
			 * and can't get queried code
			 */
			req.session.currentOrg = org_code;
			
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
router.post('/leave_org', ensureAuthenticated, ensureStudent, function(req, res){
	var org_code = req.body.org_code;
	
	removeUserFromOrg(req, req.user.username, org_code, function(org){
		/*
		 * The user that would usually be passed through this function
		 * above is the user himself when the message should be intended
		 * for the recipient which is the organization leader
		 */
		User.getUserByUsername(org.leader, function(err, user){
			var message = notification_vars.userLeftOrgMessage(org.name, user.username);
			var id = inbox_functions.generateRandomString();
			var sender = req.user.username;
			var can_reply = false;
			var recipient = user.username
			
			inbox_functions.handleNewInboxMsg(user, message, id, sender, can_reply, recipient, function(undefined, undefined){
				
			});
			
			/*
			 * redirect happens here to fetch 
			 * the organization's name
			 */
			req.flash('success_msg', 'You have left the ' + org.name);
			res.redirect('/');
		})
	});
});






router.post('/send_msg', ensureAuthenticated, ensureCounselor, function(req, res){
	var message = req.body.message;
	var id = inbox_functions.generateRandomString();
	var sender = req.user.username;
	var recipient = req.body.recipient;
	
	var org_code = req.session.currentOrg;
	
	/*
	 * If checked, value will be 'on'
     * If not checked, value will be 'undefined'
	 */
	var can_reply = false
	if (req.body.can_reply === "on"){
		can_reply = true;
	}
	
	req.checkBody('message', 'Message is required').notEmpty();
	
	var errors = req.validationErrors();
	
	if(errors){
		/*
		 * Since validation is only checking for message
		 * can do it this way.
		 * Seems kinda like a cheat to do it this way,
		 * may revisit
		 */
		req.flash('error_msg', 'Message is required');
		res.redirect('back');
	}else{
		User.getUserByUsername(recipient, function(err, user){
			if (err) throw err;
			
			Organization.getOrganizationByCode(org_code, function(err, org){
				
				/*
				 * Security measure to make sure the recipient
				 * of the message is actually inside the organization
				 */
				if (isStudentInOrg(org.members, user.username)){
					/*
					 * Checks to see if recipient exists
					 * Should always be the case, but just precautionary
					 */
					if (user){
						inbox_functions.handleNewInboxMsg(user, message, id, sender, can_reply, recipient, function(){
							req.flash('success_msg', 'Message to ' + recipient + ' has been sent');
							res.redirect('back');
						});
					}else{
						req.flash('error_msg', 'User you wanted to send message to not found.');
						res.redirect('back');
					}
				}else{
					req.flash('error_msg', 'Desired recipient is not in the organization.');
					res.redirect('back');
				}
			})
			
		});
	}
});


/*
 * Removes specified user from desired organization
 */
router.post('/rem_user', ensureAuthenticated, ensureCounselor, function(req, res){
	var org_code = req.body.org_code;
	var username = req.body.username;
	
	removeUserFromOrg(req, username, org_code, function(org, user){
		var message = notification_vars.removeUserMessage(org.name);
		var id = inbox_functions.generateRandomString();
		var sender = req.user.username;
		var can_reply = false;
		var recipient = user.username
		
		inbox_functions.handleNewInboxMsg(user, message, id, sender, can_reply, recipient, function(undefined, undefined){
			
		});
		
		req.flash('success_msg', 'You have removed ' + username);
	
		/*
		 * redirects to the same org page 
		 * the user was previously on
		 */
		res.redirect('back');
	});
});


/*
 * Used when user wants to leave an organization on their own
 * or
 * counselor wants to remove user from their organization
 */
function removeUserFromOrg(req, username, org_code, callback){ 
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
				
		org.update({members: new_members}, function(err, result){
			
			/*
			 * Removes organization from user orgs list
			 * 
			 * Also sends user an inbox message notifying
			 * them that they were removed from the organization
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
				
				user.update({orgs: new_orgs}, function(err, result){});
				
				/*
				 * The user that is passed here is the 
				 * user who is getting removed from the 
				 * organization
				 */
				callback(org, user);
			});		
		});
	});
}






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
