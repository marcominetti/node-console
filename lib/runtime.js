var helpers = require('./helpers');

//Code was based on /WebKit/Source/WebCore/inspector/InjectedScriptSource.js
var _objectId = 0;
var RemoteObject = function (object, forceValueType) {
    this.type = typeof object;

    if (helpers.isPrimitiveValue(object) ||
        object === null || forceValueType) {
        // We don't send undefined values over JSON.
        if (typeof object !== "undefined") {
            this.value = object;
        }

        // Null object is object with 'null' subtype'
        if (object === null) {
            this.subtype = "null";
        }

        // Provide user-friendly number values.
        if (typeof object === "number") {
            this.description = object + "";
        }
        return;
    }

    this.objectId = JSON.stringify({ injectedScriptId: 0, id: _objectId++});
    var subtype = helpers.subtype(object);
    if (subtype) {
        this.subtype = subtype;
    }
    this.className = object.constructor || object.name || '';
    this.description = helpers.describe(object);
    this.value = helpers.decycle(object,false);
};

var getPropertyDescriptors = function (object, ownProperties, accessorPropertiesOnly) {
    var descriptors = [];
    var propertyProcessed = { __proto__: null };

    function push(array, var_args)
	{
	    for (var i = 1; i < arguments.length; ++i)
	        array[array.length] = arguments[i];
	}

    function process(o, properties)
    {
        for (var i = 0; i < properties.length; ++i) {
            var property = properties[i];
            if (propertyProcessed[property])
                continue;

            var name = property;

            try {
                propertyProcessed[property] = true;
                var descriptor = Object.getOwnPropertyDescriptor(o, property);
                if (descriptor) {
                    if (accessorPropertiesOnly && !("get" in descriptor || "set" in descriptor))
                        continue;
                } else {
                    // Not all bindings provide proper descriptors. Fall back to the writable, configurable property.
                    if (accessorPropertiesOnly)
                        continue;
                    try {
                        descriptor = { name: name, value: o[property], writable: false, configurable: false, enumerable: false, __proto__: null };
                        if (o === object)
                            descriptor.isOwn = true;
                        push(descriptors, descriptor);
                    } catch (e) {
                        // Silent catch.
                    }
                    continue;
                }
            } catch (e) {
                if (accessorPropertiesOnly)
                    continue;
                var descriptor = { __proto__: null };
                descriptor.value = e;
                descriptor.wasThrown = true;
            }

            descriptor.name = name;
            if (o === object)
                descriptor.isOwn = true;
            if (helpers.isSymbol(property))
                descriptor.symbol = property;
            push(descriptors, descriptor);
        }
    }

    for (var o = object; helpers.isObject(o); o = o.__proto__) {
        // First call Object.keys() to enforce ordering of the property descriptors.
        process(o, Object.keys(/** @type {!Object} */ (o)));
        process(o, Object.getOwnPropertyNames(/** @type {!Object} */ (o)));
        
        if (ownProperties) {
            if (object.__proto__ && !accessorPropertiesOnly)
                push(descriptors, { name: "__proto__", value: object.__proto__, writable: true, configurable: true, enumerable: false, isOwn: true, __proto__: null });
            break;
        }
    }

    return descriptors;
};

function RuntimeAgent(notify) {
    this.objects = {};
    this.notify = notify;
}

(function() {
    this.enable = function(params,sendResult){
      sendResult({result: false});
      this.notify({
        method: 'Runtime.executionContextCreated',
        params: {
          context: {
            id: 1,
            isPageContext: true,
            name: 'global'
          }
        }
      });
    };
    this.evaluate = function (params, sendResult) {
        var result = null;
        try {
          result = eval.call(global, "with ({}) {\n" + params.expression + "\n}");
        } catch (e) {
            sendResult(this.createThrownValue(e, params.objectGroup));
        }

        if (global.Promise != null) {
            if (result != null && result.constructor === global.Promise) {
                var self = this;
                result.then(function(result){
                    sendResult({
                        result: self.wrapObject(result, params.objectGroup),
                        wasThrown: false
                    });
                }).catch(function(error){
                  if (global.Exception != null) {
                    sendResult(self.createThrownValue(new Exception(error), params.objectGroup));
                  } else {
                    sendResult(self.createThrownValue(error, params.objectGroup));
                  }
                });
                return;
            }
        }
    
        sendResult({
            result: this.wrapObject(result, params.objectGroup),
            wasThrown: false
        });
    };

    this.getProperties = function (params, sendResult) {
        var object = this.objects[params.objectId];

        if (helpers.isUndefined(object)) {
            console.error('RuntimeAgent.getProperties: Unknown object');
            return;
        }

        object = object.value;

        var descriptors = getPropertyDescriptors(object, params.ownProperties, params.accessorPropertiesOnly);
        var len = descriptors.length;

        if (len === 0 &&
            "arguments" in object) {
            for (var key in object) {
                descriptors.push({
                    name: key,
                    value: object[key],
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
            }
        }

        for (var i = 0; i < len; ++i) {
            var descriptor = descriptors[i];
            if ("get" in descriptor) {
                descriptor.get = this.wrapObject(descriptor.get);
            }

            if ("set" in descriptor) {
                descriptor.set = this.wrapObject(descriptor.set);
            }

            if ("value" in descriptor) {
                descriptor.value = this.wrapObject(descriptor.value);
            }

            if (!("configurable" in descriptor)) {
                descriptor.configurable = false;
            }

            if (!("enumerable" in descriptor)) {
                descriptor.enumerable = false;
            }
        }

        sendResult({
            result: descriptors
        });
    };

    this.wrapObject = function (object, objectGroup, forceValueType) {
        var remoteObject;

        try {
            remoteObject = new RemoteObject(object, forceValueType);
        } catch (e) {
            var description = "<failed to convert exception to string>";
            try {
                description = helpers.describe(e);
            } catch (ex) {}
            remoteObject = new RemoteObject(description, forceValueType);
        }

        this.objects[remoteObject.objectId] = {
            objectGroup: objectGroup,
            value: object
        };
        return remoteObject;
    };

    this.createThrownValue = function (value, objectGroup) {
        var remoteObject = this.wrapObject(value, objectGroup);
        var recent_stack = (value.stack||'').match(/\n\s*?at\s*(.*):(\d+):(\d+)\n/)||[];
        var exceptionDetails = {
            text: value.message,
            url: null,
            line: recent_stack[2]||0,
            column: recent_stack[3]||0,
            stackTrace: value.stack,
            scriptId: null
        };
        try {
            remoteObject.description = '' + value;
        } catch (e) {}

        return {
            wasThrown: true,
            result: remoteObject,
            exceptionDetails: exceptionDetails
        };
    };

    this.callFunctionOn = function (params, sendResult) {
        var object = this.objects[params.objectId];

        if (helpers.isUndefined(object)) {
            console.error('RuntimeAgent.callFunctionOn: Unknown object');
            return;
        }

        object = object.value;
        var resolvedArgs = [];

        var args = params.arguments;

        if (args) {
            for (var i = 0; i < args.length; ++i) {
                var objectId = args[i].objectId;
                if (objectId) {
                    var resolvedArg = this.objects[objectId];
                    if (!resolvedArg) {
                        console.error('RuntimeAgent.callFunctionOn: Unknown object');
                        return;
                    }

                    resolvedArgs.push(resolvedArg.value);
                } else if ("value" in args[i]) {
                    resolvedArgs.push(args[i].value);
                } else {
                    resolvedArgs.push(undefined);
                }
            }
        }

        var objectGroup = this.objects[params.objectId].objectGroup;
        try {
            var func = eval.call(global, ("(" + params.functionDeclaration + ")"));
            if (typeof func !== "function") {
                console.error('RuntimeAgent.callFunctionOn: Expression does ' +
                'not evaluate to a function');
                return;
            }

            return sendResult({
                    result:  this.wrapObject(func.apply(object, resolvedArgs), objectGroup, params.returnByValue),
                    wasThrown: false
            });
        } catch (e) {
            return sendResult(this.createThrownValue(e, objectGroup));
        }
    };

    this.releaseObjectGroup = function (params, sendResult) {
        for (var key in this.objects) {
            var value = this.objects[key];
            if (value.objectGroup === params.objectGroup) {
                delete this.objects[key];
            }
        }
        sendResult({});
    };

    this.releaseObject = function (params, sendResult) {
        delete this.objects[params.objectId];
        sendResult({});
    };
}).call(RuntimeAgent.prototype);

module.exports = RuntimeAgent;




