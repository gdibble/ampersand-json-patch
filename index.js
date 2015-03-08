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
	initPatcher: function(options) {
		options = options || {};

		//Save a previous version of this object
		this._previousState = this.toJSON();

		//Optionally enable listeners
		if(options.listeners) {
			var self = this;

			//Listen to own properties
			this.on('change', patch);

			//Listen to collections
			var collectionNames = Object.keys(this._collections);
			for(var i = 0; i < collectionNames.length; i++) {
				this.listenTo(this[collectionNames[i]], 'add remove change', patch);
			}

		} else {
			var self = this;
			
			//Listen to collections and emit events
			var collectionNames = Object.keys(this._collections);
			for(var i = 0; i < collectionNames.length; i++) {
				this.listenTo(this[collectionNames[i]], 'add', function() {
					self.trigger('add');
				});
				this.listenTo(this[collectionNames[i]], 'remove', function() {
					self.trigger('remove');
				});
				this.listenTo(this[collectionNames[i]], 'change', function() {
					self.trigger('change');
				});
			}
		}

		//Clear event listeners
		this.on('remove', function() {
			self.off('change remove');
			self.stopListening();
		});
	},

	patch: function(options) {
		var self = this;
		
		var patches = jsonpatch.compare(this._previousState, this.toJSON());

		if(patches.length === 0) {
			if(typeof options.success == 'function') options.success();
			return;
		}

		$.ajax({
			type: 'PATCH',
			url: this.url(),
			data: JSON.stringify(patches),
			processData: false,
			contentType: 'application/json',
			dataType: 'json',
			success: function(response, status) {
				self._previousState = self.toJSON();
				self.trigger('sync', self, response);

				if(typeof options.success == 'function') options.success(response);

				return;
			},
			error: function(xhr, type, error) {
				self.trigger('error', self, error);

				if(typeof options.error == 'function') options.error(error);

				return;
			},
		});
	},
};