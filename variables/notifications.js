module.exports.removeUserMessage = function(organization){
	var message = "You have been removed from the " + organization.toString();
	
	return message;
}

module.exports.newUserInOrgMessage = function(organization, username){
	var message = username.toString() + "  has joined the " + organization.toString();
	
	return message;
}

module.exports.userLeftOrgMessage = function(organization, username){
	var message = username.toString() + "  has left the " + organization.toString();
	
	return message;
}
