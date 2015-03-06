define(["exports"], function (exports) {
    exports.ErrorModule = (function () {
        function Module(messageQueue, Messages) {
            var _this = this;
            this.messageQueue = messageQueue;
            var handleError = function (errorMessage, url, line) {
                /*Condition for checking if its validation error*/
                if (errorMessage) {
                    if ((errorMessage.namespace == "bv.field" || errorMessage.namespace == "bv.validator" || errorMessage.namespace == "bv.form") && errorMessage.type == "error") {
                    } else {
                        _this.messageQueue.add({ title: "Unhandled Exception", body: errorMessage, timeout: 5000, level: Messages.MessageLevel.Error });
                    }
                }
            };

            window.onerror = handleError;
        }
        return Module;
    })();
});
