/*jshint browser:true, nonew:false*/
/*global WebInspector:true*/
WebInspector.MainOverrides = function() {
  this._unregisterShortcuts();
  this._allowToSaveModifiedFiles();
  this._reloadOnDetach();
};

WebInspector.MainOverrides.prototype = {
  _unregisterShortcuts: function() {
    this._shortcutsToUnregister.forEach(function(shortcut) {
      var descriptor = WebInspector.KeyboardShortcut.makeDescriptorFromBindingShortcut(shortcut);
      var key = WebInspector.shortcutRegistry._defaultKeyToActions.get(String(descriptor.key));
      if (key) key.clear();
    });
  },

  _allowToSaveModifiedFiles: function() {
    WebInspector.extensionServer._onSubscribe(
      {
        type:WebInspector.extensionAPI.Events.ResourceContentCommitted
      },
      {
        postMessage: function(msg) {
          // no-op
        }
      }
    );
  },

  _reloadOnDetach: function() {
    var _tryReconnectToTarget = function(){
      if (Runtime.queryParam("ws")) {
        setInterval(function () {
          var ws = "ws://" + Runtime.queryParam("ws") + "/?poll";
          var test_socket = new WebSocket(ws);
          test_socket.onopen = function () {
            window.location.reload();
          }
        }, 1000);
      }
    };

    WebInspector.RemoteDebuggingTerminatedScreen = function(reason)
    {
      WebInspector.HelpScreen.call(this, WebInspector.UIString("Detached from the target"));
      var p = this.helpContentElement.createChild("p");
      p.classList.add("help-section");
      p.createChild("span").textContent = WebInspector.UIString("Remote debugging has been terminated with reason: ");
      p.createChild("span", "error-message").textContent = reason;
      p.createChild("br");
      p.createChild("br");
      p.createChild("span").textContent = WebInspector.UIString("Please wait while we try to re-attach to the new target...");
    }

    WebInspector.RemoteDebuggingTerminatedScreen.prototype = {
      __proto__: WebInspector.HelpScreen.prototype
    }

    if (InspectorBackend._connection){
      InspectorBackend._connection.addEventListener(InspectorBackendClass.Connection.Events.Disconnected,_tryReconnectToTarget);
    }
    WebInspector.Main.prototype._oldConnectionEstablished = WebInspector.Main.prototype._connectionEstablished;
    WebInspector.Main.prototype._connectionEstablished = function(connection){
      connection.addEventListener(InspectorBackendClass.Connection.Events.Disconnected,_tryReconnectToTarget);
      this._oldConnectionEstablished.call(this,connection);
    };
  },

  _shortcutsToUnregister: [
    // Front-end intercepts Cmd+R, Ctrl+R and F5 keys and reloads the debugged
    // page instead of the front-end page.  We want to disable this behaviour.
    'F5', 'Ctrl+R', 'Meta+R'
  ]
};

new WebInspector.MainOverrides();
