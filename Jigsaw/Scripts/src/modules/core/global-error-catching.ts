

export class Module {
    messageQueue: any;
    constructor(messageQueue, Messages) {
        this.messageQueue = messageQueue;
        var handleError = (errorMessage: any, url: string, line: number) => {
            /*Condition for checking if its validation error*/
            if (errorMessage) {
                if ((errorMessage.namespace == "bv.field" || errorMessage.namespace == "bv.validator" || errorMessage.namespace == "bv.form") && errorMessage.type == "error") {
                }
                else {
                    this.messageQueue.add({ title: "Unhandled Exception", body: errorMessage, timeout: 5000, level: Messages.MessageLevel.Error });
                }
            }
        };

        window.onerror = <any>handleError;
    }
}
