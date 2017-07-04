var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var UserSchema = mongoose.Schema({
	first_name: {
		type: String
	},
	
	last_name: {
		type: String
	},
	
	age: {
		type: Number,
		min: 13
	},
	
	username: {
		type: String,
		index:true,
		lowercase: true,
		unique: true
	},
	
	password: {
		type: String
	},
	
	email: {
		type: String,
		unique: true
	},
	
	region: {
		type: String
	},
	
	////////////////////
	//Status Key	   /
	////////////////////
	//0: banned        /
	//1: full access   /
	//2: limited access/
	//3: flagged       /
	////////////////////
	status: {
		type: Number,
		default: 2
	},
	
	organization: {
		type: String,
		default: null
	},
	
	////////////////////
	//Account type Key /
	////////////////////
	//s: Student       /
	//t: Teacher       /
	//c: Counselor     /
	//o: Other         /
	////////////////////
	account_type: {
		type: String,
	},
	
	date_created: {
		type: Date,
		default: Date.now
	},
	
	admin: {
		type: Boolean,
		default: false
	},
	
	orgs: {
		type: Array,
		default: []
	},
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        newUser.save(callback);
	    });
	});
}

module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
		if(err) throw err;
		callback(null, isMatch);
	});
}
