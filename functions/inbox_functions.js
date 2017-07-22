var User = require('../models/user');
var Inbox = require('../models/inbox');
var Organization = require('../models/organization');

/*
 * Adds new inbox message id to user's inbox list in database
 * Then adds new inbox message to inbox schema database
 */
module.exports.handleNewInboxMsg = function(user, message, id, sender, can_reply, recipient, callback){
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
		
		callback();
	});
}


/*
 * Generates a string roughly 20 characters long
 * this generates the id's of inbox messages
 */
module.exports.generateRandomString = function(){
	return (Math.random()*1e32).toString(36);
}
