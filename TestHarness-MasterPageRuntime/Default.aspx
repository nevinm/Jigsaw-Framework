<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="TestHarness.Default" %>

<!doctype html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Test Harness - Master Common</title>

    <!-- Test Harness UI Styles -->
    <link rel="stylesheet" type="text/css" href="content/test-harness.css" />

    <!-- Jasmine Styles -->
    <link rel="shortcut icon" type="image/png" href="scripts/lib/jasmine-2.0.0/jasmine_favicon.png">
    <link rel="stylesheet" type="text/css" href="scripts/lib/jasmine-2.0.0/jasmine.css">

    <!-- Essential JS libraries for the TestHarness -->
    <script type="text/javascript" src="scripts/lib/current-running-libs/consolelog.js"></script>
    <script type="text/javascript" src="scripts/lib/current-running-libs/AjaxRequest.js"></script>
    <script type="text/javascript" src="scripts/lib/current-running-libs/jquery-2.0.3.js"></script>

    <!-- Dynamically Added Styles -->
    <asp:Literal ID="litStylesTags" runat="server"></asp:Literal>

    <!-- Dynamically Added Scripts -->
    <asp:Literal ID="ltlScriptTags" runat="server"></asp:Literal>

    <!-- specRunner.js runs all of the tests -->
    <script data-main="scripts/main.js" src="scripts/lib/current-running-libs/require.js"></script>


</head>
<body>
    <form runat="server">
        <header class="test-harness-header">
            <div class="test-col-20">
                <p class="test-title"><b>Test Harness-MasterCommon </b></p>
                <button type="button" id="btn_force_error" class="red">
                        Force Error
                </button>
                <label><input type="checkbox" id="chk_alert_error"  name="Alert" /><b>Alert onError</b></label>
            </div>
            <div class="test-col-20">
                 <button type="button" id="btn_load_sample" class="blue">
                    Load Sample Page
                </button>
                <button type="button" id="btn_run_specs" class="blue">
                    Run Tests
                </button>
            </div>
            <div class="test-col-15">
                <button type="button" id="btn_glimpse" class="blue">
                        Glimpse
                </button>
                <button type="button" id="btn_history" class="blue">
                        History
                </button>
            </div>
            <div class="test-col-15">
                <asp:DropDownList cssClass='sound-event' ID="SoundList" runat="server"></asp:DropDownList>
                <select class="sound-event">
                    <option value="Info">Information Message</option>
                    <option value="Error">Error Message</option>
                </select>
            </div>
            <div class="test-col-15 check-container">
                <h4 class="vertical-text">Javascripts</h4>
                <div class="checkbox-list">
                    <asp:CheckBoxList ID="chklstScripts" AutoPostBack="true" CssClass="chkboxlist" runat="server" OnSelectedIndexChanged="chklstScripts_SelectedIndexChanged">
                    </asp:CheckBoxList>
                     <asp:CheckBoxList ID="chklstScriptsCurrent" CssClass="chkboxlist" runat="server">
                    </asp:CheckBoxList>
                </div>
            </div>
            <div class="test-col-15 check-container">
                <h4 class="vertical-text">CSS Styles</h4>
                <div class="">
                    
                    <div class="checkbox">
                            <label><input type="checkbox" class="js-styles" data-location="content/core-styles/bootstrap.css" />Bootstrap.css</label>
                        </div>

                        <div class="checkbox">
                            <label><input type="checkbox" class="js-styles" data-location="content/core-styles/smartadmin-production.css" />smartadmin-production.css</label>
                        </div>
                </div>
            </div>
        </header>
        <div id="content-div"></div>
    </form>
    <div id="sound-container">
        <span id='sound-name'></span><br />
        <audio controls>
            <source id='ogg' src="" type="audio/ogg" />
            <source id='mp3' src="" type="audio/mpeg" />
            <source id='wav' src="" type="audio/wav" />
        </audio>
    </div>
</body>
</html>
