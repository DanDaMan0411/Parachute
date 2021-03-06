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
	},
	
	region: {
		type: String,
	},
	
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
	
	//This is unique to each organization
	code: {
		type: String,
		lowercase: true,
		unique: true
	},
	
	members: {
		type: Array,
		default: []
	},
	
	active: {
		type: Boolean,
		default: true
	},

	////////////////////
	//Join Setting Key /
	////////////////////
	//o: Open          /
	//r: Request       /
	//c: Closed        /
	////////////////////
	join_setting: {
		type: String,
		default: 'o'
	},
	
	banned_users: {
		type: Array,
		default: []	
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
