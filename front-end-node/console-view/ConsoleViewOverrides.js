

WebInspector.ConsoleView.prototype._initConsoleMessages = function()
{
    var mainTarget = WebInspector.targetManager.mainTarget();
    this._fetchMultitargetMessages();
};

WebInspector.ConsoleView.prototype._printResult = function(result, wasThrown, originatingConsoleMessage, exceptionDetails)
{
    if (!result)
        return;

    var target = result.target();
    /**
     * @param {string=} url
     * @param {number=} lineNumber
     * @param {number=} columnNumber
     */
    function addMessage(url, lineNumber, columnNumber)
    {
        var level = wasThrown ? WebInspector.ConsoleMessage.MessageLevel.Error : WebInspector.ConsoleMessage.MessageLevel.Log;
        var message = new WebInspector.ConsoleMessage(target, WebInspector.ConsoleMessage.MessageSource.JS, level, "", WebInspector.ConsoleMessage.MessageType.Result, url, lineNumber, columnNumber, undefined, [result]);
        message.setOriginatingMessage(originatingConsoleMessage);
        target.consoleModel.addMessage(message);
    }

    addMessage();
};
