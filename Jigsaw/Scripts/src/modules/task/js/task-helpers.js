/// <amd-dependency path='text!modules/task/templates/DataSourceNotificationPanelItem.html' />
/// <amd-dependency path='text!modules/task/templates/TaskEdit.html' />
/// <amd-dependency path='text!modules/task/assets/styles.css' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'modules/data', 'app', 'metadata/task', "text!modules/task/templates/DataSourceNotificationPanelItem.html", "text!modules/task/templates/TaskEdit.html", "text!modules/task/assets/styles.css"], function(require, exports, _data, _app, metadata) {
    var taskTemplateDataSourceNotificationPanelItem = require('text!modules/task/templates/DataSourceNotificationPanelItem.html');
    var taskTemplateTaskEdit = require('text!modules/task/templates/TaskEdit.html');
    var taskTemplateStyles = require('text!modules/task/assets/styles.css');

    (function (task) {
        var TaskDataSource = (function (_super) {
            __extends(TaskDataSource, _super);
            function TaskDataSource(manager) {
                _super.call(this, {
                    manager: manager,
                    endPoint: new breeze.EntityQuery("taskversion"),
                    typeName: "TaskVersionTracker",
                    entityVersionTypeName: "TaskVersion",
                    versionedTypeName: "Task"
                });
            }
            TaskDataSource.prototype.createEntity = function (props) {
                return _super.prototype.createEntity.call(this);
            };

            TaskDataSource.prototype.initializeVersionedEntity = function (entity) {
                _super.prototype.initializeVersionedEntity.call(this, entity);

                entity.Tags = entity.TaskTags.map(function (x) {
                    return x.Tag();
                });
            };
            return TaskDataSource;
        })(_data.VersionPager.DataSource);
        task.TaskDataSource = TaskDataSource;

        (function (Notifications) {
            // register templates of notifications without template
            _app.Jigsaw.Notifications.notificationTemplate.candidate(taskTemplateDataSourceNotificationPanelItem, function (x) {
                return x.Owner === 'task-data';
            });
        })(task.Notifications || (task.Notifications = {}));
        var Notifications = task.Notifications;

        task.url = "/tasks", task.manager = _data.Server.createManager('api/task', metadata.metadata), task.dataSource = new TaskDataSource(task.manager), task.columns = ['Current.Entity.Name', 'Current.Entity.Description'], task.itemsViewModel = new _data.DataItemsViewModel(task.dataSource, {
            jumpToSearchUri: 'api/task/nextTaskVersion',
            jumpToSearchProperty: 'Guid',
            //excelExportPath: 'api/northwind/ExcelExportTasks',
            columns: task.columns
        }), task.barViewModelOptions = {
            //wordExportUrl: 'export/wordExportCustomer',
            //pdfExportUrl: 'export/pdfExportCustomer',
            approveUri: 'api/task/approve',
            rejectUri: 'api/task/reject',
            revertUri: 'api/task/revert'
        }, task.dataView = _data.Templates.DataItems({
            title: "Tasks",
            jumpTo: false,
            columns: [_data.VersionPager.hasPendingColumn].concat(task.columns),
            //addNew: true,
            //excelExport: true,
            //dragHint: templates.MyCustomerItem,
            viewModel: task.itemsViewModel
        }), task.barView = _data.Templates.VersionPager(_.template(taskTemplateTaskEdit)), task.stylesModule = new _app.Jigsaw.Theming.ContentStyleSheet(taskTemplateStyles);

        function addRibbonButton(ribbon) {
            ribbon.tab("Users").group("Versions", 10).add(new _app.Jigsaw.Ribbon.RibbonButton("Tasks", function () {
                _app.history.navigate(task.url);
            }, "Loads the Tasks Module", "fa fa-university"));
        }
        task.addRibbonButton = addRibbonButton;
    })(exports.task || (exports.task = {}));
    var task = exports.task;
});
