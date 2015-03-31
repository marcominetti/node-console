
var TargetPrototype = WebInspector.Target.prototype;
var TargetCapabilities = WebInspector.Target.Capabilities;
var TargetNextId = WebInspector.Target._nextId;
WebInspector.Target = function(name, connection, callback)
{
    Protocol.Agents.call(this, connection.agentsMap());
    this._name = name;
    this._connection = connection;
    connection.addEventListener(InspectorBackendClass.Connection.Events.Disconnected, this._onDisconnect, this);
    this._id = WebInspector.Target._nextId++;

    /** @type {!Map.<!Function, !WebInspector.SDKModel>} */
    this._modelByConstructor = new Map();

    /** @type {!Object.<string, boolean>} */
    this._capabilities = {};
    this._loadedWithCapabilities.call(this, callback);
}
WebInspector.Target.Capabilities = TargetCapabilities;
WebInspector.Target.nextId = TargetNextId;
WebInspector.Target.prototype = TargetPrototype;
