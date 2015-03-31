/*jshint browser:true, nonew:false*/
/*global WebInspector:true*/

WebInspector.DebuggerModel.prototype.scriptsForSourceURL = function (sourceURL) {
    if (!sourceURL)
        return [];
    return this._scriptsBySourceURL.get('file://' + sourceURL) || this._scriptsBySourceURL.get(sourceURL) || [];
};

WebInspector.DebuggerModel.prototype.createRawLocationByURL = function (sourceURL, lineNumber, columnNumber) {
    var closestScript = null;
    var scripts = this._scriptsBySourceURL.get('file://' + sourceURL) || this._scriptsBySourceURL.get(sourceURL) || [];
    for (var i = 0, l = scripts.length; i < l; ++i) {
        var script = scripts[i];
        if (!closestScript)
            closestScript = script;
        if (script.lineOffset > lineNumber || (script.lineOffset === lineNumber && script.columnOffset > columnNumber))
            continue;
        if (script.endLine < lineNumber || (script.endLine === lineNumber && script.endColumn <= columnNumber))
            continue;
        closestScript = script;
        break;
    }
    return closestScript ? new WebInspector.DebuggerModel.Location(this.target(), closestScript.scriptId, lineNumber, columnNumber) : null;
};

Runtime.ExperimentsSupport.prototype._checkExperiment = function () {
};