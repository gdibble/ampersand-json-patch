// Copyright (c) 2015 Matt Reyer.

/*
 * Provides JSON patch support to ampersand models.
 *
 * Don't patch like an idiot.
 * http://williamdurand.fr/2014/02/14/please-do-not-patch-like-an-idiot/
 */

var jsonpatch = require('fast-json-patch');
var $ = require('browserify-zepto');
var _ = require('lodash');

module.exports = {
	initPatcher: function(options) {
		options = options || {};

		var self = this;

		//Save a previous version of this object
		this._previousState = this.toJSON();
		this._pendingPatches = [];

		//Optionally enable listeners
		if(options.listeners) {
			//Listen to own properties
			this.on('change', patch);

			//Listen to collections
			var collectionNames = Object.keys(this._collections);
			for(var i = 0; i < collectionNames.length; i++) {
				this.listenTo(this[collectionNames[i]], 'add remove change', patch);
			}

		} else {
			//Listen to collections and emit events
			var collectionNames = Object.keys(this._collections);
			for(var i = 0; i < collectionNames.length; i++) {
				this.listenTo(this[collectionNames[i]], 'add change', function() {
					self.trigger('change');
				});

				/*
				 * Ideally this is not necessary, see here: https://github.com/Starcounter-Jack/JSON-Patch/issues/65
				 * You'll have to generate your own remove patches
				 */
				
				this.listenTo(this[collectionNames[i]], 'remove', function() {
					self.trigger('change');
					self._previousState = self.toJSON(); //Silently update the previous state
				});
			}
		}

		//Clear event listeners
		this.on('remove', function() {
			self.off('change remove');
			self.stopListening();
		});	

		var initialSync = function() {
			this.off('sync', initialSync);
			this._previousState = this.toJSON();
		}
		this.on('sync', initialSync);
	},

	// For when you want to alter a model, but not patch changes
	updateSilently: function(data) {
		this.set(data);
		this._previousState = this.toJSON();
	},

	patch: _.debounce(function(options) {
		var self = this;
		
		var patches = jsonpatch.compare(this._previousState, this.toJSON());

		if(patches.length === 0) {
			if(typeof options.success == 'function') options.success();
			return;
		}

		var url;
		if(_.isFunction(this.url)) url = this.url();
		else url = this.url;

		$.ajax({
			type: 'PATCH',
			url: url,
			data: JSON.stringify(patches),
			processData: false,
			contentType: 'application/json',
			dataType: 'json',
			success: function(response, status) {
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


		self._previousState = self.toJSON();
	}, 500)
};