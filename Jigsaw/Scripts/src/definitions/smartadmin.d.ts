
﻿ interface JQuery {
    jarvisWidgets(obj): JQuery;
}
﻿
interface BoxSettings {
    title: string;
    content: string;
    icon?;
    color?;
    timeout?: number;
    colortime?: number;
}

interface SmartMessageSettings {
    title: string;
    content: string;
    buttons: string;
    input?: string;
}

interface JQueryStatic {
    bigBox(options: BoxSettings, callback?);
    smallBox(options: BoxSettings, callback?);

    SmartMessageBox(options: BoxSettings, callback?: (button: string, message?)=>void);

}
    
