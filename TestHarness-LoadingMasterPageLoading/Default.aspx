<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="TestHarness.Default" %>

<!doctype html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Test Harness</title>


    <!-- Dynamically Added Styles -->
    <asp:Literal ID="ltlStylesTags" runat="server"></asp:Literal>

    <!-- Dynamically Added Scripts -->
    <asp:Literal ID="ltlScriptTags" runat="server"></asp:Literal>


    <!-- specRunner.js runs all of the tests -->
    <script data-main="scripts/main.js" src="scripts/lib/require.js"></script>


</head>
<body>
    <form runat="server">
        <header class="test-harness-header">
            <div class="test-col-25">
                <p class="test-title"><b>Test Harness-LoadingMasterPageLoading </b></p>
                
            </div>
            <div class="test-col-25">
                 
            </div>
            <div class="test-col-25 check-container">
                <h4 class="vertical-text">Javascripts</h4>
                <div class="checkbox-list">
                    <asp:CheckBoxList ID="chklstScripts" AutoPostBack="true" CssClass="chkboxlist" runat="server" OnSelectedIndexChanged="chklstScripts_SelectedIndexChanged">
                    </asp:CheckBoxList>
                </div>
            </div>
            <div class="test-col-25 check-container">
                <h4 class="vertical-text">CSS Styles</h4>
                <div class="stylesheets-list">
                    <asp:CheckBoxList ID="chklstStyles" AutoPostBack="true" CssClass="chkboxlist" runat="server" OnSelectedIndexChanged="chklstScripts_SelectedIndexChanged">
                    </asp:CheckBoxList>                    
                </div>
            </div>
         
   
        </header>
        <div id="content-div">
            <div id="progress-bar-container">
                <%--Total percentage--%>
                <div class="header">
                    <div class="title">Jigsaw</div>
                    <div class="subtitle"><b>Overall Progress</b></div>
                    <div class="pgbar">
                        <div class="progress progress-striped">
					        <div id="overall-progress" class="progress-bar bg-color-greenLight" data-updated-progress="0" aria-valuetransitiongoal="0" style="width: 0%;" aria-valuenow="0">0%</div>
				        </div>
                    </div>
                </div>
                <%--JS loading--%>
                <div class="well no-padding core-file-loader">
                    <div class="core-files-header"><h3><b>Loading Core Files</b></h3></div>
                    <div class="bar-holder">
				        <div class="progress">
					        <div id='core-files-progress' data-updated-progress='0' class="progress-bar bg-color-redLight" aria-valuetransitiongoal="0" style="width: 0%;" aria-valuenow="0">0%</div>
				        </div>
			        </div>
                </div>
                <div class="statusContainer">
                    <span class="status" id="fileNameStatus">Loading Resources . .</span>
                    <span class="fileNameLoading" id="fileNameLoading"></span>
                </div>
                <%--css loading--%>
                <div class="well no-padding core-theme-loader">
                    <div class="core-files-header"><h3><b>Loading Theme Files</b></h3></div>
                    <div class="bar-holder">
				        <div class="progress">
					        <div id='core-themes-progress' data-updated-progress='0' class="progress-bar bg-color-blue" aria-valuetransitiongoal="0" style="width: 0%;" aria-valuenow="0">0%</div>
				        </div>
			        </div>
                </div>
                <div class="statusContainer">
                    <span class="status" id="themeNameStatus">Loading Resources . .</span>
                    <span class="fileNameLoading" id="themeNameLoading"></span>
                </div>
                <div class="finalStatusContainer">
                    <span class="status" id="finalStatus">Loading Resources . .</span>
                    <span class="fileNameLoading" id="finalLoading">All resources have been downloaded.</span>
                </div>
            </div>
        </div>
    </form>
</body>
</html>
