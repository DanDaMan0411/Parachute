var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var InboxSchema = mongoose.Schema({
	sender: {
		type: String
	},
	
	message: {
		type: String
	},
	
	can_reply: {
		type: Boolean
	},
	
	id: {
		type: String,
		unique: true
	},
	
	viewed: {
		type: Boolean,
		default: true
	},
	
	timestamp: {
		type: Date,
		default: Date.now
	},
	
	recipient: {
		type: String,
	},
});

var Inbox = module.exports = mongoose.model('Inbox', InboxSchema);

module.exports.createInbox = function(Inbox, callback){
	Inbox.save(callback);
}

module.exports.getInboxById = function(id, callback){
	var query = {id: id};
	Inbox.findOne(query, callback);
}
