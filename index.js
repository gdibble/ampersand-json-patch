// Copyright (c) 2015 Matt Reyer.

/*
 * Provides JSON patch support to ampersand models.
 *
 * Don't patch like an idiot.
 * http://williamdurand.fr/2014/02/14/please-do-not-patch-like-an-idiot/
 */

var jsonpatch = require('fast-json-patch');
var $ = require('browserify-zepto');

module.exports = {
	patch: function(patches) {
		if(patches.length == 0) return;

		var self = this;

		$.ajax({
			type: 'PATCH',
			url: this.url(),
			data: JSON.stringify(patches),
			processData: false,
			contentType: 'application/json',
			dataType: 'json',
			success: function(response) {
				self.trigger('sync', self, response);
			},
			error: function(xhr, type) {
				console.log('ERR', xhr, type);
			}
		});
	},
	initialize: function(options) {
		var self = this;

		//Save a previous version of this object
		this.previousState = this.toJSON();

		//Patch changes to the server
		this.on('change', function() {
			self.patch(jsonpatch.compare(self.previousState, this.toJSON()));
			self.previousState = this.toJSON();
		});

		//Clear event listeners
		this.on('remove', function() {
			self.off('change');
			self.off('remove');
		});
	},
};