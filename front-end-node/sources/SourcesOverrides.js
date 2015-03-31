/*jshint browser:true, nonew:false*/
/*global WebInspector:true*/
WebInspector.SourcesOverrides = function() {
  this._chromeSpecificsAreHidden = false;
  this._hideChromeSpecifics();
  this._overrideWatchExpression();
  this._hideContentsScript();
  this._disableAddFolderItem();
};

WebInspector.SourcesOverrides.prototype = {
  _hideChromeSpecifics: function() {
    if (WebInspector.panels.sources) {
      this._hideSourcesTabSpecifics();
    } else {
      WebInspector.inspectorView._tabbedPane.addEventListener(
        WebInspector.TabbedPane.EventTypes.TabSelected,
        function(event) {
          if (event.data.tabId == 'sources') setTimeout(this._hideSourcesTabSpecifics.bind(this));
        }, this);
    }
  },

  _hideSourcesTabSpecifics: function() {
    if (this._chromeSpecificsAreHidden) return;

    var panes = WebInspector.panels.sources.sidebarPanes;
    [
      //panes.domBreakpoints.element,
      //panes.domBreakpoints.titleElement.parentNode,
      panes.eventListenerBreakpoints.element,
      panes.eventListenerBreakpoints.titleElement.parentNode,
      //panes.xhrBreakpoints.element,
      //panes.xhrBreakpoints.titleElement.parentNode
    ].forEach(function(element) {
      element.classList.add('hidden');
    });
    this._chromeSpecificsAreHidden = true;
  },

  _overrideWatchExpression: function() {
    WebInspector.WatchExpressionsSection.NewWatchExpression = ' ';
  },
  
  _hideContentsScript: function(){
    sourcespanel_proto = WebInspector.SourcesPanel.prototype;
    sourcespanel_proto.oldWasShown = sourcespanel_proto.wasShown;
    sourcespanel_proto.wasShown = function(){
      this.registerRequiredCSS('node/sources/SourcesPanelOverrides.css');
      sourcespanel_proto.wasShown = sourcespanel_proto.oldWasShown;
      sourcespanel_proto.oldWasShown.call(this);
    };
  },
  
  _disableAddFolderItem: function(){
    WebInspector.NavigatorView.prototype._appendAddFolderItem = function(){};
  }
};

new WebInspector.SourcesOverrides();
