var User = require('../models/user');
var Inbox = require('../models/inbox');
var Organization = require('../models/organization');

/*
 * Adds new inbox message id to user's inbox list in database
 * Then adds new inbox message to inbox schema database
 */
module.exports.handleNewInboxMsg = function(user, message, id, sender, can_reply, callback){
	var new_inbox = user.inbox;
				
	user.update({inbox: new_inbox.concat(id)}, function(err, result){
		if (err) throw err;
		
		var newInbox = new Inbox({
			message: message,
			id: id,
			sender: sender,
			can_reply: can_reply,
			recipient: user.username,
		});
		
		Inbox.createInbox(newInbox, function(err, inbox){
			if(err) throw err;
		});
		
		callback()
	});
}
