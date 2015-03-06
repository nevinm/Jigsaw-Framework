/// <reference path="../src/definitions/webrule.d.ts" />
define(["require", "exports", 'codeeffects.control'], function(require, exports, codeeffects) {
    if (codeeffects) {
    }

    CodeEffects.register('CodeEffects.Rule.Client');
    CodeEffects.register('CodeEffects.Rule.Models');
    $rule.Client.Element = function () {
    };
    $rule.Models.RuleModel = function () {
    };
    $rule.Client.ElementType = { Flow: 0, Field: 1, Function: 2, Operator: 3, Value: 4, Clause: 6, Action: 7, LeftParenthesis: 8, RightParenthesis: 9, LeftBracket: 10, RightBracket: 11, Calculation: 12, Tab: 13, NewLine: 15, HtmlTag: 16 };
    $rule.Models.OperatorType = { String: 0, Numeric: 1, Date: 2, Time: 3, Bool: 4, Enum: 6, None: 8 };
    $rule.Client.FunctionType = { Name: 0, Param: 1, Comma: 2, End: 3, None: 4 };
    $rule.Client.InputType = { Field: 0, Input: 1, None: 2 };
    $rule.Client.CalculationType = { Field: 0, LeftParenthesis: 1, RightParenthesis: 2, Multiplication: 3, Division: 4, Addition: 6, Subtraction: 7, Number: 8, None: 9 };
    CodeEffects.register('CodeEffects.Rule.Common');
    $rule.Common.ValueInputType = { Fields: 0, User: 2, All: 4 };
    $rule.Help = {
        'i101': 'Click inside of the Filter Area to begin a new filter',
        'i102': 'Click anywhere inside of the Filter Area to modify the filter',
        'i103': 'Select a field or parenthesis from the menu; hit Space Bar if it&#39;s hidden',
        'i104': 'Select an operator from the menu; hit Space Bar if it&#39;s hidden',
        'i105': 'Type the value; use Backspace to delete, Enter or Right Arrow to complete',
        'i106': 'Select calculation elements from the menu; hit Space Bar if it&#39;s hidden',
        'i107': 'Use Left Arrow to edit the value; hit Space Bar and select a field to continue',
        'i108': 'Build calculation by selecting elements; hit Space Bar if the menu is hidden',
        'i109': 'Use your mouse to pick a date',
        'i110': 'Select an action from the menu; hit Space Bar if it&#39;s hidden',
        'i111': 'Select a clause or parenthesis from the menu; hit Space Bar if it&#39;s hidden',
        'i112': 'Use Arrows, Home, End, Tab, Backspace or Delete keys to edit this filter',
        'i113': 'Hit Space Bar to insert a new value; use Right Arrow to edit existing value',
        'i114': 'Hit Space Bar to bring up the date picker',
        'i115': 'Delete the date or select a clause from the menu; hit Space Bar if it&#39;s hidden',
        'i116': 'Use your mouse to pick the time; click OK to select it',
        'i117': 'Hit Space Bar to bring up the time picker',
        'i118': 'Delete the time or select a clause from the menu; hit Space Bar if it&#39;s hidden',
        'i119': 'Select a value from the menu; hit Space Bar if it&#39;s hidden',
        'i120': 'Delete the value or select a clause from the menu; hit Space Bar if it&#39;s hidden',
        'i121': 'Use Left Arrow to edit, Backspace to delete; hit Space Bar to continue',
        'i122': 'Make your selection; hit Space Bar if the menu is hidden',
        'i123': 'Type or select the parameter&#39;s value; hit Space Bar if selection is hidden',
        'i124': 'Use arrows to navigate the filter or Delete, Backspace and Space bar to edit it',
        'i125': 'Select a flow element from the menu; hit Space Bar if it&#39;s hidden',
        'i126': 'Create a new filter or select an existing one for editing',
        'i127': 'Select a new field from the menu to replace the current one',
        'i128': 'Select a new action from the menu to replace the current one',
        'i129': 'Select a new operator from the menu to replace the current one',
        'i130': 'Select a new clause from the menu to replace the current one',
        'i131': 'Type or select a new value to replace the current one',
        'i132': 'Pick a new date or select a field from the menu to replace the current one',
        'i133': 'Pick a new time or select a field from the menu to replace the current one',
        'i134': 'Select a new value from the menu to replace the current one'
    };
    $rule.Errors = {
        'e101': 'Your browser does not allow access to clipboard. Use Internet Explorer version 7 and up.',
        'e102': 'This filter is invalid. Hover over each highlighted element for details.',
        'e107': 'The highlighted filter elements have been deleted or could not be located. Please update this filter or roll back all changes made to the source object.'
    };
});
// $rule.Context.addControl('filterControl', new $rule.Control(["filterControl", false, false, null]));
