var express = require('express');
var router = express.Router();

var User = require('../models/user');
var Organization = require('../models/organization');
var Inbox = require('../models/inbox');

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
	
	removeUserFromOrg(req.user.username, org_code, function(org_name){
		/*
		 * redirect happens here to fetch 
		 * the organization's name
		 */
		req.flash('success_msg', 'You have left the ' + org_name);
		res.redirect('/');
	});
});





/*
 * Leaves requested organization
 */
router.post('/send_msg', ensureAuthenticated, function(req, res){
	var message = req.body.message;
	var id = generateRandomString();
	var sender = req.user.username;
	var recipient = req.body.recipient;
	
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
			
			/*
			 * Checks to see if recipient exists
			 * Should always be the case, but just precautionary
			 */
			if (user){
				handleNewInboxMsg(user, message, id, sender, can_reply, recipient, req, res);
			}else{
				req.flash('error_msg', 'User you wanted to send message to not found.');
				res.redirect('back');
			}
		})
	}
});

/*
 * Adds new inbox message id to user's inbox list in database
 * Then adds new inbox message to inbox schema database
 */
function handleNewInboxMsg(user, message, id, sender, can_reply, recipient, req, res){
	var new_inbox = user.inbox;
				
	user.update({inbox: new_inbox.concat(id)}, function(err, result){
		if (err) throw err;
		
		var newInbox = new Inbox({
			message: message,
			id: id,
			sender: sender,
			can_reply: can_reply,
			recipient: recipient,
		});
		
		Inbox.createInbox(newInbox, function(err, inbox){
			if(err) throw err;
		});
		
		req.flash('success_msg', 'Message to ' + recipient + ' has been sent');
		res.redirect('back');
	});
}



/*
 * Removes specified user from desired organization
 */
router.post('/rem_user', ensureAuthenticated, function(req, res){
	var org_code = req.body.org_code;
	var username = req.body.username;
	
	removeUserFromOrg(username, org_code, function(){
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
function removeUserFromOrg(username, org_code, redirectDestination){
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
		var user_index = new_members.indexOf(username);
		
		/*
		 * Makes sure user is in members list
		 * Should always be the case, just precautionary
		 */
		if (user_index >= 0){
			new_members.splice(user_index, 1);
		}
				
		org.update({members: new_members}, throwError);
		
		redirectDestination(org.name);
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
 * Generates a string roughly 20 characters long
 */
function generateRandomString(){
	return (Math.random()*1e32).toString(36);
}

module.exports = router;
