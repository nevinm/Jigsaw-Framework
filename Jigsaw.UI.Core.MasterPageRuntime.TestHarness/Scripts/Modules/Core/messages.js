/// <amd-dependency path="text!modules/core/templates/messages/Error.html" />
/// <amd-dependency path="text!modules/core/templates/messages/Generic.html" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/core/knockout', 'modules/core/common', "text!modules/core/templates/messages/Error.html", "text!modules/core/templates/messages/Generic.html"], function(require, exports, Knockout, Common) {
    var templatesMessagesError = require('text!modules/core/templates/messages/Error.html');
    var templatesMessagesGeneric = require('text!modules/core/templates/messages/Generic.html');

    (function (MessageLevel) {
        MessageLevel[MessageLevel["Error"] = 0] = "Error";
        MessageLevel[MessageLevel["Warning"] = 1] = "Warning";
        MessageLevel[MessageLevel["Success"] = 2] = "Success";
        MessageLevel[MessageLevel["Info"] = 3] = "Info";
    })(exports.MessageLevel || (exports.MessageLevel = {}));
    var MessageLevel = exports.MessageLevel;

    (function (MessageQueueType) {
        MessageQueueType[MessageQueueType["Inline"] = 1] = "Inline";
        MessageQueueType[MessageQueueType["ExtraSmall"] = 2] = "ExtraSmall";
        MessageQueueType[MessageQueueType["Small"] = 3] = "Small";
        MessageQueueType[MessageQueueType["Big"] = 4] = "Big";
    })(exports.MessageQueueType || (exports.MessageQueueType = {}));
    var MessageQueueType = exports.MessageQueueType;

    var InlineMessageQueue = (function () {
        function InlineMessageQueue() {
            this.messages = ko.observableArray();
        }
        InlineMessageQueue.prototype.add = function (message) {
            var _this = this;
            this.messages.push(message);

            if (message.timeout) {
                Q.delay(true, message.timeout).then(function () {
                    return _this.remove(message);
                }).done();
            }

            return Q(true);
        };

        InlineMessageQueue.prototype.remove = function (message) {
            this.messages.remove(message);
            // delete message;
        };

        InlineMessageQueue.prototype.clear = function () {
            this.messages.removeAll();
            return this;
        };
        return InlineMessageQueue;
    })();
    exports.InlineMessageQueue = InlineMessageQueue;

    function ServerRequestError(status, text) {
        return { title: "Server error " + status, body: text };
    }
    exports.ServerRequestError = ServerRequestError;

    /** this variable can be used to add new messages and template selector for them */
    exports.messageTemplateSelector = new Knockout.TemplateSelector(_.template(templatesMessagesGeneric)({
        alert: 'alert-info',
        header: 'Info!'
    }));
    exports.messageTemplateSelector.candidate(_.template(templatesMessagesGeneric)({
        alert: 'alert-warning',
        header: 'Warning!'
    }), function (x) {
        return x.level === 1 /* Warning */;
    });
    exports.messageTemplateSelector.candidate(_.template(templatesMessagesGeneric)({
        alert: 'alert-success',
        header: 'Success!'
    }), function (x) {
        return x.level === 2 /* Success */;
    });
    exports.messageTemplateSelector.candidate(templatesMessagesError, function (x) {
        return x.level === 0 /* Error */;
    });

    ko.bindingHandlers['messageQueue'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element), model = ko.unwrap(valueAccessor()), context = bindingContext.createChildContext(model);

            // append the template to the element
            $element.addClass('messageQueue');

            ko.applyBindingsToNode(element, {
                template: {
                    name: function (x) {
                        return exports.messageTemplateSelector.select(x);
                    },
                    foreach: model.messages,
                    templateEngine: Knockout.StringTemplateEngine,
                    afterRender: function () {
                        return Common.triggerResize($element);
                    },
                    beforeRemove: function (node) {
                        $(node).remove();
                        Common.triggerResize($element);
                    }
                }
            }, context);

            return { controlsDescendantBindings: true };
        }
    };

    var boxOptions;
    (function (boxOptions) {
        var error = {
            color: "#C46A69",
            icon: "fa fa-warning shake animated"
        }, info = {
            color: "#3276B1",
            icon: "fa fa-bell swing animated"
        }, warning = {
            color: "#C79121",
            icon: "fa fa-shield fadeInLeft animated"
        }, success = {
            color: "#739E73",
            icon: "fa fa-check"
        };

        function colorFor(level) {
            switch (level) {
                case 0 /* Error */:
                    return error.color;
                case 3 /* Info */:
                    return info.color;
                case 1 /* Warning */:
                    return warning.color;
                case 2 /* Success */:
                    return success.color;
            }
        }
        boxOptions.colorFor = colorFor;

        function iconFor(level) {
            switch (level) {
                case 0 /* Error */:
                    return error.icon;
                case 3 /* Info */:
                    return info.icon;
                case 1 /* Warning */:
                    return warning.icon;
                case 2 /* Success */:
                    return success.icon;
            }
        }
        boxOptions.iconFor = iconFor;
    })(boxOptions || (boxOptions = {}));

    /** displays smart-admin big box */
    function bigBox(options) {
        var result = Q.defer();

        $.bigBox({
            title: options.title,
            content: options.body,
            color: boxOptions.colorFor(options.level),
            icon: boxOptions.iconFor(options.level),
            timeout: options.timeout
        }, function () {
            return result.resolve(true);
        });

        return result.promise;
    }
    exports.bigBox = bigBox;

    /** displays smart-admin small box */
    function smallBox(options) {
        var result = Q.defer();

        $.smallBox({
            title: options.title,
            content: options.body,
            color: boxOptions.colorFor(options.level),
            icon: boxOptions.iconFor(options.level),
            timeout: options.timeout
        }, function () {
            return result.resolve(true);
        });

        return result.promise;
    }
    exports.smallBox = smallBox;

    /** displays smart-admin small box */
    function extraSmallBox(options) {
        var result = Q.defer();

        $.smallBox({
            title: options.title,
            content: options.body,
            color: boxOptions.colorFor(options.level),
            iconSmall: boxOptions.iconFor(options.level),
            timeout: options.timeout
        }, function () {
            return result.resolve(true);
        });

        return result.promise;
    }
    exports.extraSmallBox = extraSmallBox;

    var SmallBoxMessageQueue = (function () {
        function SmallBoxMessageQueue() {
        }
        SmallBoxMessageQueue.prototype.add = function (message) {
            return exports.smallBox(message);
        };

        SmallBoxMessageQueue.prototype.remove = function (message) {
        };

        SmallBoxMessageQueue.prototype.clear = function () {
            $('#divSmallBoxes').children().remove();
            return this;
        };
        return SmallBoxMessageQueue;
    })();
    exports.SmallBoxMessageQueue = SmallBoxMessageQueue;

    var SmallBoxPrevNextMessageQueue = (function (_super) {
        __extends(SmallBoxPrevNextMessageQueue, _super);
        function SmallBoxPrevNextMessageQueue() {
            _super.apply(this, arguments);
        }
        //message: JumpToMultipleResultsMessage
        SmallBoxPrevNextMessageQueue.prototype.add = function (message) {
            var _this = this;
            var result = _super.prototype.add.call(this, message);

            $("#prev").bind('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                message.findPrev();
            });

            $("#next").bind('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                message.findNext();
            });

            result.then(function () {
                return _this._removeListeners();
            });

            return result;
        };

        SmallBoxPrevNextMessageQueue.prototype.remove = function (message) {
        };

        SmallBoxPrevNextMessageQueue.prototype.clear = function () {
            this._removeListeners();
            return _super.prototype.clear.call(this);
        };

        SmallBoxPrevNextMessageQueue.prototype._removeListeners = function () {
            $("#prev").unbind('click');
            $("#next").unbind('click');
        };
        return SmallBoxPrevNextMessageQueue;
    })(SmallBoxMessageQueue);
    exports.SmallBoxPrevNextMessageQueue = SmallBoxPrevNextMessageQueue;

    var ExtraSmallBoxMessageQueue = (function () {
        function ExtraSmallBoxMessageQueue() {
        }
        ExtraSmallBoxMessageQueue.prototype.add = function (message) {
            return exports.extraSmallBox(message);
        };

        ExtraSmallBoxMessageQueue.prototype.remove = function (message) {
        };

        ExtraSmallBoxMessageQueue.prototype.clear = function () {
            $('#divSmallBoxes').children().remove();
            return this;
        };
        return ExtraSmallBoxMessageQueue;
    })();
    exports.ExtraSmallBoxMessageQueue = ExtraSmallBoxMessageQueue;

    var BigBoxMessageQueue = (function () {
        function BigBoxMessageQueue() {
        }
        BigBoxMessageQueue.prototype.add = function (message) {
            return exports.bigBox(message);
        };

        BigBoxMessageQueue.prototype.remove = function (message) {
        };

        BigBoxMessageQueue.prototype.clear = function () {
            return this;
        };
        return BigBoxMessageQueue;
    })();
    exports.BigBoxMessageQueue = BigBoxMessageQueue;

    function createMessageQueue(type) {
        switch (type) {
            case 2 /* ExtraSmall */:
                return new ExtraSmallBoxMessageQueue();
            case 3 /* Small */:
                return new SmallBoxMessageQueue();
            case 4 /* Big */:
                return new BigBoxMessageQueue();
            default:
                return new InlineMessageQueue();
        }
    }
    exports.createMessageQueue = createMessageQueue;
});
