interface TemplateFunction {
    (rc): string; raw: string;
}
declare module "templates/app" { 
    var CoreMain:{ (): string; };
    var Dialog:TemplateFunction;
    var DragWrap:{ (): string; };
    var InputBoxMessage:TemplateFunction;
    var LoadingScreen:{ (): string; };
    var LoginForm:{ (): string; };
    var QuestionMessage:TemplateFunction;
    var SideLayout:TemplateFunction;
    var styles:string;
    var ViewLayout:TemplateFunction;
    module messages { 
        var Error:{ (): string; };
        var Generic:TemplateFunction;
         
    }
    module notification { 
        var Notification:{ (): string; };
        var NotificationsCollapsed:{ (): string; };
        var RibbonNotificationPanel:{ (): string; };
        var SidebarNotifications:{ (): string; };
        var styles:string;
        var SyncPendingChanges:{ (): string; };
         
    }
    module ribbon { 
        var Button:{ (): string; };
        var Select:{ (): string; };
         
    }
    module sidebar { 
        var Sidebar:{ (): string; };
         
    }
    module userSettings { 
        var Notification:{ (): string; };
        var styles:string;
        var UserSettings:{ (): string; };
         
    }
    module widget { 
        var expandOptions:TemplateFunction;
        var VirtualScrollButton:{ (): string; };
         
    } 
}
declare module "templates/app-mobile" { 
    var CoreMain:{ (): string; };
    var ForceOfflineNotification:{ (): string; };
    var styles:string;
    var ViewLayout:{ (): string; };
    var Dialog:TemplateFunction;
    var DragWrap:{ (): string; };
    var InputBoxMessage:TemplateFunction;
    var LoadingScreen:{ (): string; };
    var LoginForm:{ (): string; };
    var QuestionMessage:TemplateFunction;
    var SideLayout:TemplateFunction;
    module notification { 
        var Notification:{ (): string; };
        var NotificationsCollapsed:{ (): string; };
        var RibbonNotificationPanel:{ (): string; };
        var SidebarNotifications:{ (): string; };
        var styles:string;
        var SyncPendingChanges:{ (): string; };
         
    }
    module userSettings { 
        var UserSettings:{ (): string; };
        var Notification:{ (): string; };
        var styles:string;
         
    }
    module messages { 
        var Error:{ (): string; };
        var Generic:TemplateFunction;
         
    }
    module ribbon { 
        var Button:{ (): string; };
        var Select:{ (): string; };
         
    }
    module sidebar { 
        var Sidebar:{ (): string; };
         
    }
    module widget { 
        var expandOptions:TemplateFunction;
        var VirtualScrollButton:{ (): string; };
         
    } 
}
declare module "templates/beta" { 
    var BetaMain:{ (): string; };
    var NotificationPanelItem:{ (): string; };
     
}
declare module "templates/data" { 
    var codeeffects:string;
    var ColumnChooser:{ (): string; };
    var DataItems:TemplateFunction;
    var Field:TemplateFunction;
    var FieldReadOnly:TemplateFunction;
    var JumpToMultipleResultsMessage:TemplateFunction;
    var PopupLayout:TemplateFunction;
    var RequiredStar:{ (): string; };
    var styles:string;
    var TrackSummary:TemplateFunction;
    var ValidationMessage:{ (): string; };
    var VersionPagerHasPendingColumn:TemplateFunction;
    var VersionPagerViewBar:TemplateFunction;
    var ViewBar:TemplateFunction;
    var ViewBarSummaryTabContent:TemplateFunction;
    var Wizzard:TemplateFunction;
    var wizzardStyles:string;
    module chooser { 
        var ChooserDialog:TemplateFunction;
         
    }
    module comparison { 
        var DiffCollectionTrackSummaryItem:TemplateFunction;
        var DiffMessage:TemplateFunction;
        var DiffSummary:{ (): string; };
        var DiffTrackSummaryItem:TemplateFunction;
         
    }
    module myitems { 
        var myItemsStyles:string;
        var SidebarMyItems:{ (): string; };
        var SidebarMyItemsCollapsed:{ (): string; };
         
    }
    module mysearches { 
        var mySearchesStyles:string;
        var SidebarMySearches:{ (): string; };
        var SidebarMySearchesCollapsed:{ (): string; };
         
    }
    module notification { 
        var NotificationContent:{ (): string; };
        var styles:string;
         
    } 
}
declare module "templates/data-mobile" { 
    var styles:string;
    var ViewBar:TemplateFunction;
    var codeeffects:string;
    var ColumnChooser:{ (): string; };
    var DataItems:TemplateFunction;
    var Field:TemplateFunction;
    var FieldReadOnly:TemplateFunction;
    var JumpToMultipleResultsMessage:TemplateFunction;
    var PopupLayout:TemplateFunction;
    var RequiredStar:{ (): string; };
    var TrackSummary:TemplateFunction;
    var ValidationMessage:{ (): string; };
    var VersionPagerHasPendingColumn:TemplateFunction;
    var VersionPagerViewBar:TemplateFunction;
    var ViewBarSummaryTabContent:TemplateFunction;
    var Wizzard:TemplateFunction;
    var wizzardStyles:string;
    module chooser { 
        var ChooserDialog:TemplateFunction;
         
    }
    module comparison { 
        var DiffCollectionTrackSummaryItem:TemplateFunction;
        var DiffMessage:TemplateFunction;
        var DiffSummary:{ (): string; };
        var DiffTrackSummaryItem:TemplateFunction;
         
    }
    module myitems { 
        var myItemsStyles:string;
        var SidebarMyItems:{ (): string; };
        var SidebarMyItemsCollapsed:{ (): string; };
         
    }
    module mysearches { 
        var mySearchesStyles:string;
        var SidebarMySearches:{ (): string; };
        var SidebarMySearchesCollapsed:{ (): string; };
         
    }
    module notification { 
        var NotificationContent:{ (): string; };
        var styles:string;
         
    } 
}
declare module "templates/forms" { 
    var BuilderFieldShortcuts:{ (): string; };
    var MetaContent:TemplateFunction;
    module builder { 
        var FieldBuilder:TemplateFunction;
        var FormItemProperty:{ (): string; };
        var ItemAdder:{ (): string; };
        var styles:string;
        var Tab:{ (): string; };
        var TextFieldBuilder:{ (): string; };
        var TextFieldBuilderProperty:{ (): string; };
         
    }
    module display { 
        var FieldWrapper:TemplateFunction;
        var TextField:TemplateFunction;
         
    }
    module editor { 
        var ActiveFormTemplate:TemplateFunction;
        var ControlEdit:TemplateFunction;
        var ControlItems:TemplateFunction;
        var FormTemplateBasicEdit:TemplateFunction;
        var FormTemplatesList:{ (): string; };
        var TemplateQueryFilter:{ (): string; };
        var TestFormEdit:TemplateFunction;
         
    } 
}
declare module "templates/test" { 
    var TestMain:{ (): string; };
     
}
