/// <reference path="breeze.d.ts" />
/// <reference path="kendo.web.d.ts" />
/// <reference path="knockout.d.ts" />
/// <reference path="Q.d.ts" />
/// <reference path="jquery.d.ts" />
/// <reference path="jqueryui.d.ts" />
/// <reference path="bootstrap.d.ts" />

interface ThemeDefinition {
    Name: string;
    Styles: string[];
    Scripts: string[];
}

interface JigsawConfigStatic {
    /**  */
    FingerPrint: string;
    InitialUserAutorized: boolean;
    AvailableModules: string[];
    DefaultTheme: string;
    Themes: ThemeDefinition[];
    Mobile: boolean;
}

/** configuration variable injected by the server on the home page */
declare var JigsawConfig: JigsawConfigStatic;


interface IDict<T> {
    [key:string]: T;
}


// these definitions are only for the Jigsaw project

interface JQuery {
    deferredAnimate(properties: any, duration: number, queue?: boolean): Q.Promise<any>;
}

interface JQueryStatic {
    /** file download jquery plugin */
    fileDownload(path: string, options?): JQueryPromise<any>;
}

interface IDisposable {
    dispose(): void;
}

interface GuardedObservable<T> extends KnockoutComputed<T> {
    guarded: KnockoutComputed<T>;
    guard(guardian: (key?, silent?: boolean) => Q.Promise<any>): IDisposable;

    /** adds a second level of promises that get's executed before setting the value */
    prepare(guardian: (key?) => Q.Promise<any>): IDisposable;
    inject(value:T, silent?:boolean):Q.Promise<any>;
}

interface KnockoutStatic {
    guarded<T>(initialValue?:T):GuardedObservable<T>;
}

/** Missing definitions from kendo ui, could be removed o future updates of the file kendo.all.d.ts */
declare module kendo {
    module ui {
        export class Popup {
            close();
        }

        export class FilterMenu extends kendo.ui.Widget {
            static fn: FilterMenu;
            static extend(proto: Object): FilterMenu;

            element: JQuery;
            wrapper: JQuery;
            constructor(element: Element, options?);

            popup: kendo.ui.Popup;

            filter(expression);
            clear();
        }
    }
}

declare module "jquery-ui" {
    function sortable(): void;
    function draggagble(): void;
    function droppable(): void;
}