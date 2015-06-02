// Copyright (c) 2015 Matt Reyer.

/*
 * Provides JSON patch support to ampersand models.
 *
 * Don't patch like an idiot.
 * http://williamdurand.fr/2014/02/14/please-do-not-patch-like-an-idiot/
 */

var jsonpatch = require('fast-json-patch');
var $ = require('browserify-zepto');
var debounce = require('lodash.debounce');
var isFunction = require('lodash.isfunction');

module.exports = {
	initPatcher: function(options) {
		options = options || {};

		var self = this;

		//Save a previous version of this object
		this._previousState = this.toJSON();
		this._patchQueue = [];
		this._persisting = false;

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
				this.listenTo(this[collectionNames[i]], 'add change remove', function() {
					self.trigger('change');
				});
			}
		}

		//Clear event listeners
		this.on('remove', function() {
			self.off('add change remove');
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

	patch: debounce(function(options) {

		var patches = jsonpatch.compare(this._previousState, this.toJSON());

		if(patches.length === 0) {
			if(typeof options.success == 'function') options.success();
			return;
		}

		this._patchQueue.push({
			patches: patches,
			options: options,
		});

		this._persistQueue();

		this._previousState = this.toJSON();
	}, 500),

	addToPatchQueue: function(item) {
		this._patchQueue.push(item);
		this._previousState = this.toJSON();
		this._persistQueue();
	},

	_persistQueue: function() {
		//Already persisting, don't invoke again
		if(this._persisting) return;

		//Persist items in order
		if(this._patchQueue.length) {
			this._persisting = true;
			this._persistItem(this._patchQueue[0]);
		}

		return;
	},

	_persistItem: function(item) {
		/*
		for(var i = 0; i < this._patchQueue.length; i++) {
			console.log(JSON.stringify(this._patchQueue[i].patches));
		}
		*/

		var self = this;

		var url;
		if(isFunction(this.url)) url = this.url();
		else url = this.url;

		$.ajax({
			type: 'PATCH',
			url: url,
			data: JSON.stringify(item.patches),
			processData: false,
			contentType: 'application/json',
			dataType: 'json',
			success: function(response, status) {
				self.trigger('sync', self, response);

				if(typeof item.options.success == 'function') item.options.success(response);

				// Remove this item from the queue and keep going
				self._patchQueue.shift();

				if(self._patchQueue.length) {
					self._persistItem(self._patchQueue[0]);
				} else {
					self._persisting = false;
				}

				return;
			},
			error: function(xhr, type, error) {
				self.trigger('error', self, error);

				if(typeof item.options.error == 'function') item.options.error(JSON.parse(xhr.response));

				return;
			},
		});
	}
};