# ampersand-json-patch
Adds JSON Patch (RFC 6902) support to Ampersand models.

###**[Don't patch like an idiot.](http://williamdurand.fr/2014/02/14/please-do-not-patch-like-an-idiot/)**

## Usage

`npm install --save ampersand-json-patch`

**ampersand-json-patch** is used as a [mixin](https://ampersandjs.com/learn/base-objects-and-mixins#using-and-re-using-mixins).

```javascript
var AmpersandModel = require('ampersand-model');
var PatchMixin = require('ampersand-patch-json');

var CarModel = AmpersandModel.extend(PatchMixin, {
	urlRoot: '/api/cars',
	props: {
		id: 'number',
		make: 'string',
		model: 'string',
		year: 'number'
	},
	initialize: function() {
		this.initPatcher();
	}
});

```

Models now have a `patch()` method.

```javascript
var myCar = new CarModel({id: 1, make: 'Honda', model: 'CR-V', year: 1999});

myCar.set({model: 'Civic'});

myCar.patch();
```

Generates the following HTTP PATCH request to `/api/cars/1`:

```javascript
[ { op: 'replace', path: '/model', value: 'Civic' } ]
```

The `patch` method also accepts `success` and `error` callbacks in the options hash, just like Ampersand's `save`.

Initializing the patcher with `initPatcher({listeners: true})` will fire a patch to the server automatically on every `change` event to your model.

See [JSON-Patch](https://github.com/Starcounter-Jack/JSON-Patch) for all supported operations.