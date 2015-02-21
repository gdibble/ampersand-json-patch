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
});

```

Patches will now be automatically sent to your server on every `change` event.

```javascript
var myCar = new CarModel({id: 1, make: 'Honda', model: 'CR-V', year: 1999});

myCar.model = 'Civic';
```

Generates the following HTTP PATCH request to `/api/cars/1`:

```javascript
[ { op: 'replace', path: '/model', value: 'Civic' } ]
```

See [JSON-Patch](https://github.com/Starcounter-Jack/JSON-Patch) for all supported operations.

### Initialization
Keep in mind that if you specify an `initialize` method in your model constructor, it will override the `initialize` method defined by `ampersand-patch-json`. Solve this by simply calling it in your own initialization method.

```javascript
var CarModel = AmpersandModel.extend(PatchMixin, {
	urlRoot: '/api/cars',
	props: {
		id: 'number',
		make: 'string',
		model: 'string',
		year: 'number'
	},
	initialize: function() {
		PatchMixin.initialize.call(this); //Don't forget this!

		//Do my own stuff
	}
});
```