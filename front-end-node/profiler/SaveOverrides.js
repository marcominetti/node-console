/*jshint browser:true, nonew:false*/
/*global WebInspector:true*/

WebInspector.saveAs = function(blob,filename){
  var url = URL.createObjectURL(blob);
  var link = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
  link.download = filename;
  link.href = url;
  var event = document.createEvent("MouseEvents");
  event.initMouseEvent(
    "click", true, false, window, 0, 0, 0, 0, 0
    , false, false, false, false, 0, null
  );
  link.dispatchEvent(event);
  URL.revokeObjectURL(url);
};

WebInspector.CPUProfileHeader.prototype.saveToFile = WebInspector.HeapProfileHeader.prototype.saveToFile = function () {
    var self = this;
    self._fileName = self._fileName || new Date().toISO8601Compact() + self._profileType.fileExtension();
    if (self._tempFile == null) {
        self._oldOnTempFileReady = self._onTempFileReady;
        self._onTempFileReady = function () {
            self._tempFile.read(function (data) {
                WebInspector.saveAs(new Blob([data], {type: "application/octet-stream"}), self._fileName);
            });
            self._onTempFileReady = self._oldOnTempFileReady;
            if (self._onTempFileReady) {
                self._onTempFileReady();
                self._onTempFileReady = null;
            }
        };
    } else {
        self._tempFile.read(function (data) {
            WebInspector.saveAs(new Blob([data], {type: "application/octet-stream"}), self._fileName);
        });
    }
}
