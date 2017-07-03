var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var OrganizationSchema = mongoose.Schema({
	name: {
		type: String
	},
	
	city: {
		type: String,
		default: null
	},
	
	address: {
		type: String,
		default: null,
	},
	
	zip: {
		type: String,
		default: null
	}
	
	phone_number: {
		type: String,
		default: null
	},
	
	description: {
		type: String,
		default: null
	},
	
	leader: {
		type: String
	},
	
	code: {
		type: String
	}
});

var Organization = module.exports = mongoose.model('Organization', OrganizationSchema);

module.exports.createOrganization = function(Organization, callback){
	Organization.save(callback);
}

module.exports.getOrganizationByCode = function(code, callback){
	var query = {code: code};
	Organization.findOne(query, callback);
}
