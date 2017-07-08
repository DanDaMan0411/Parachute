var express = require('express');
var router = express.Router();

var User = require('../models/user');
var Organization = require('../models/organization');

router.get('/', ensureAuthenticated, function(req, res){
	res.render('org_page');
});

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
