/// <amd-dependency path="text!modules/core/templates/messages/Error.html" />
/// <amd-dependency path="text!modules/core/templates/messages/Generic.html" />


var templatesMessagesError = require('text!modules/core/templates/messages/Error.html');
var templatesMessagesGeneric = require('text!modules/core/templates/messages/Generic.html');
import Knockout = require('modules/core/knockout');
import Common = require('modules/core/common');


    export enum MessageLevel {
        Error, Warning, Success, Info
    }

    export interface Message {
        title: string;
        body: string;
        level?: MessageLevel;
        timeout?: number;
    }

    export interface MessageQueue {
        add(message: Message): Q.Promise<any>;
        remove(message: Message);
        clear(): MessageQueue;
    }

    export enum MessageQueueType {
        Inline= 1, ExtraSmall= 2, Small= 3, Big= 4
    }

    export class InlineMessageQueue implements MessageQueue {
        messages = ko.observableArray<Message>();

        add(message: Message) {
            this.messages.push(message);

            if (message.timeout) {
                Q.delay(true, message.timeout)
                    .then(() => this.remove(message))
                    .done();
            }

            return Q(true);
        }

        remove(message: Message) {
            this.messages.remove(message);

            // delete message;
        }

        clear() {
            this.messages.removeAll();
            return this;
        }
    }

    export function ServerRequestError(status, text) {
        return { title: "Server error " + status, body: text };
    }

    /** this variable can be used to add new messages and template selector for them */
    export var messageTemplateSelector = new Knockout.TemplateSelector(_.template(templatesMessagesGeneric)({
        alert: 'alert-info',
        header: 'Info!'
    }));
    messageTemplateSelector.candidate(_.template(templatesMessagesGeneric)({
        alert: 'alert-warning',
        header: 'Warning!'
    }), x => x.level === MessageLevel.Warning);
    messageTemplateSelector.candidate(_.template(templatesMessagesGeneric)({
        alert: 'alert-success',
        header: 'Success!'
    }), x => x.level === MessageLevel.Success);
    messageTemplateSelector.candidate(templatesMessagesError, x => x.level === MessageLevel.Error);


    ko.bindingHandlers['messageQueue'] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var $element = $(element),
                model: InlineMessageQueue = ko.unwrap(valueAccessor()),
                context = bindingContext.createChildContext(model);

            // append the template to the element
            $element.addClass('messageQueue');

            ko.applyBindingsToNode(element, {
                template: {
                    name: x => messageTemplateSelector.select(x),
                    foreach: model.messages,
                    templateEngine: Knockout.StringTemplateEngine,
                    afterRender: () => Common.triggerResize($element),
                    beforeRemove: node => {
                        $(node).remove();
                        Common.triggerResize($element);
                    },
                }
            }, context);

                return { controlsDescendantBindings: true }
            }
    };

    module boxOptions {
        var error = {
            color: "#C46A69",
            icon: "fa fa-warning shake animated",
        },
            info = {
                color: "#3276B1",
                icon: "fa fa-bell swing animated",
            },
            warning = {
                color: "#C79121",
                icon: "fa fa-shield fadeInLeft animated",
            },
            success = {
                color: "#739E73",
                icon: "fa fa-check",
            };

        export function colorFor(level: MessageLevel) {
            switch (level) {
                case MessageLevel.Error:
                    return error.color;
                case MessageLevel.Info:
                    return info.color;
                case MessageLevel.Warning:
                    return warning.color;
                case MessageLevel.Success:
                    return success.color;
            }
        }

        export function iconFor(level: MessageLevel) {
            switch (level) {
                case MessageLevel.Error:
                    return error.icon;
                case MessageLevel.Info:
                    return info.icon;
                case MessageLevel.Warning:
                    return warning.icon;
                case MessageLevel.Success:
                    return success.icon;
            }
        }
    }


    /** displays smart-admin big box */
    export function bigBox(options: Message) {
        var result = Q.defer();

        $.bigBox({
            title: options.title,
            content: options.body,
            color: boxOptions.colorFor(options.level),
            icon: boxOptions.iconFor(options.level),
            timeout: options.timeout,
        }, () => result.resolve(true));

        return result.promise;
    }

    /** displays smart-admin small box */
    export function smallBox(options: Message) {
        var result = Q.defer();

        $.smallBox({
            title: options.title,
            content: options.body,
            color: boxOptions.colorFor(options.level),
            icon: boxOptions.iconFor(options.level),
            timeout: options.timeout,
        }, () => result.resolve(true));

        return result.promise;
    }

    /** displays smart-admin small box */
    export function extraSmallBox(options: Message) {
        var result = Q.defer();

        $.smallBox({
            title: options.title,
            content: options.body,
            color: boxOptions.colorFor(options.level),
            iconSmall: boxOptions.iconFor(options.level),
            timeout: options.timeout,
        }, () => result.resolve(true));

        return result.promise;
    }

    export class SmallBoxMessageQueue implements MessageQueue {
        add(message: Message) {
            return smallBox(message);
        }

        remove(message: Message) {

        }

        clear() {
            $('#divSmallBoxes').children().remove();
            return this;
        }
    }




    export class SmallBoxPrevNextMessageQueue extends SmallBoxMessageQueue {

        //message: JumpToMultipleResultsMessage
        add(message: any) {

            var result = super.add(message);

            $("#prev").bind('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                message.findPrev();
            });

            $("#next").bind('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                message.findNext();
            });

            result.then(() => this._removeListeners());

            return result;

        }

        remove(message: Message) {

        }

        clear() {
            this._removeListeners();
            return super.clear();
        }

        private _removeListeners() {
            $("#prev").unbind('click');
            $("#next").unbind('click');
        }

    }

    export class ExtraSmallBoxMessageQueue implements MessageQueue {
        add(message: Message) {
            return extraSmallBox(message);
        }

        remove(message: Message) {

        }

        clear() {
            $('#divSmallBoxes').children().remove();
            return this;
        }
    }

    export class BigBoxMessageQueue implements MessageQueue {
        add(message: Message) {
            return bigBox(message);
        }

        remove(message: Message) {

        }

        clear() {
            return this;
        }
    }

    export function createMessageQueue(type?: MessageQueueType) {
        switch (type) {
            case MessageQueueType.ExtraSmall:
                return new ExtraSmallBoxMessageQueue();
            case MessageQueueType.Small:
                return new SmallBoxMessageQueue();
            case MessageQueueType.Big:
                return new BigBoxMessageQueue();
            default:
                return new InlineMessageQueue();
        }
    }
