<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="TestHarness.Default" %>

<%@ Register Src="~/UserControls/HeaderResources.ascx" TagPrefix="uc1" TagName="HeaderResources" %>


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

    <!-- Dynamically Added Styles -->
    <asp:Literal ID="litStylesTags" runat="server"></asp:Literal>

    <!-- Dynamically Added Scripts -->
    <asp:Literal ID="ltlScriptTags" runat="server"></asp:Literal>

    <!-- specRunner.js runs all of the tests -->
    <script data-main="scripts/main.js" src="scripts/lib/require.js"></script>

    <script type="text/javascript">
        
        // ConfigObject from server
        TestHarnessConfig = <%= this.Config.ToString() %>;

        if (typeof(log) != 'function') {
            window.log = console.log.bind(console)
            log("Console log wrapper libray not defined, normal console.log() will be used instead.");
        }

    </script>

</head>
<body>
    <form runat="server">
        <header class="test-harness-header">
            <div class="test-col-25">
                <p class="test-title"><b>Test Harness-MasterCommon </b></p>
                <button type="button" id="btn_force_error" class="red">
                        Force Error
                </button>
                <label><input type="checkbox" id="chk_alert_error"  name="Alert" /><b>Alert onError</b></label>
            </div>
            <div class="test-col-25">
                 <button type="button" id="btn_load_sample" class="blue">
                    Load Sample Page
                </button>
                <button type="button" id="btn_run_specs" class="blue">
                    Run Tests
                </button>
                <div class="environment">
                    Environment : 
                 <asp:DropDownList ID="ddlEnvironment" runat="server" AutoPostBack="true" OnSelectedIndexChanged="ddlEnvironment_SelectedIndexChanged">
                     <asp:ListItem Value="TEST">Test</asp:ListItem>
                     <asp:ListItem Value="LIVE">Live</asp:ListItem>
                    </asp:DropDownList>
                <%--<select id="sel_environment">
                    <option value="TEST">Test</option>
                    <option value="LIVE">Live</option>
                </select>--%>
                </div>
                
            </div>
            <uc1:HeaderResources runat="server" ID="HeaderResources" />
        </header>
        <div id="content-div"></div>
    </form>
</body>
</html>
