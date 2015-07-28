/// <amd-dependency path='text!modules/task/templates/DataSourceNotificationPanelItem.html' />
/// <amd-dependency path='text!modules/task/templates/TaskEdit.html' />
/// <amd-dependency path='text!modules/task/assets/styles.css' />

import _data = require('modules/data');

import _app = require('app');

import metadata = require('metadata/task');
var taskTemplateDataSourceNotificationPanelItem = require('text!modules/task/templates/DataSourceNotificationPanelItem.html');
var taskTemplateTaskEdit = require('text!modules/task/templates/TaskEdit.html');
var taskTemplateStyles = require('text!modules/task/assets/styles.css');


export module task {

    export class TaskDataSource extends _data.VersionPager.DataSource {

        constructor(manager: breeze.EntityManager) {
            super({
                manager: manager,
                endPoint: new breeze.EntityQuery("taskversion"),
                typeName: "TaskVersionTracker",
                entityVersionTypeName: "TaskVersion",
                versionedTypeName: "Task",
            });
        }

        createEntity(props?) {
            return super.createEntity();
        }

        initializeVersionedEntity(entity) {
            super.initializeVersionedEntity(entity);

            entity.Tags = entity.TaskTags.map(x => x.Tag());
        }
    }

    export module Notifications {

        // register templates of notifications without template
        _app.Jigsaw.Notifications.notificationTemplate.candidate(taskTemplateDataSourceNotificationPanelItem, x => x.Owner === 'task-data');
    }

    export var url = "/tasks",
        manager = _data.Server.createManager('api/task', metadata.metadata),
        dataSource = new TaskDataSource(manager),
        columns = ['Current.Entity.Name', 'Current.Entity.Description'],
        itemsViewModel = new _data.DataItemsViewModel(dataSource, {
            jumpToSearchUri: 'api/task/nextTaskVersion',
            jumpToSearchProperty: 'Guid',
            //excelExportPath: 'api/northwind/ExcelExportTasks',
            columns: columns,
            //savedSearchesGroup: 'Tasks',
            //wizzardViewBuilder: wizzardViewBuilder,
            //wizzardSaveDraft: item => this._myItemsCollectionModule.collection.addDraft(item),
        }),
        barViewModelOptions = {
            //wordExportUrl: 'export/wordExportCustomer',
            //pdfExportUrl: 'export/pdfExportCustomer',
            approveUri: 'api/task/approve',
            rejectUri: 'api/task/reject',
            revertUri: 'api/task/revert'
        },
        dataView = _data.Templates.DataItems({
            title: "Tasks",
            jumpTo: false,
            columns: [_data.VersionPager.hasPendingColumn].concat(<any>columns),
            //addNew: true,
            //excelExport: true,
            //dragHint: templates.MyCustomerItem,
            viewModel: itemsViewModel
        }),
        barView = _data.Templates.VersionPager(_.template(taskTemplateTaskEdit)),
        stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(taskTemplateStyles);

    export function addRibbonButton(ribbon: _app.Jigsaw.Ribbon.RibbonSet) {
        ribbon
            .tab("Users")
            .group("Versions", 10)
            .add(new _app.Jigsaw.Ribbon.RibbonButton("Tasks",
                () => { _app.history.navigate(url); }, "Loads the Tasks Module", "fa fa-university"));
    }
}
