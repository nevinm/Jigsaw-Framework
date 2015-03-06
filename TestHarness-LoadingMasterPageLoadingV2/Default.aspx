<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="TestHarness_LoadingMasterPageLoading2.Default" %>

<%@ Register TagPrefix="Jigsaw" TagName="HeaderResources" src="~/UserControls/HeaderResources.ascx" %>

<!doctype html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Test Harness - Master Common</title>

    <!-- Test Harness UI Styles -->
    <link rel="stylesheet" type="text/css" href="content/test-harness.css" />
    <link href="content/core-styles/smartadmin-production.css" rel="stylesheet" />

    <!-- Jasmine Styles -->
    <link rel="shortcut icon" type="image/png" href="scripts/lib/jasmine-2.0.0/jasmine_favicon.png">
    <link rel="stylesheet" type="text/css" href="scripts/lib/jasmine-2.0.0/jasmine.css">

    <link href="content/core-styles/bootstrap.css" rel="stylesheet" />

    

    <!-- Dynamically Added Styles -->
    <asp:Literal ID="litStylesTags" runat="server"></asp:Literal>

    <!-- Dynamically Added Scripts -->
    <asp:Literal ID="ltlScriptTags" runat="server"></asp:Literal>

    <!-- specRunner.js runs all of the tests -->
    <script data-main="scripts/main.js" src="scripts/lib/require.js"></script>

    <script type="text/javascript">
            // JSON array of files generated from server.
        files = <%= this.FilesJson %>;

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
                <p class="test-title"><b>Test Harness-LoadingMaterPageLoading - v2 </b></p>
                
            </div>
            <div class="test-col-25">
               
               
            </div>
            <Jigsaw:HeaderResources ID="HeaderResources1" runat="server" />
        </header>
        <div id="content-div">
            <div id="progress-bar-container">
                <%--JS--%>
                <div class="header">
                    <div class="title">Jigsaw</div>
                    <div class="subtitle">Overall Progress</div>
                    <div class="pgbar">
                        <div class="progress progress-striped">
					        <div id='overall-progress' class="progress-bar bg-color-greenLight" aria-valuetransitiongoal="0" style="width: 0%;" aria-valuenow="0">0%</div>
				        </div>
                    </div>
                </div>
                <div class="progress-bar-content">
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="core-files-header"><h3><b>Loading Core Files</b></h3></div>
                            <div class="bar-holder">
				                <div class="progress">
					                <div id='core-files-progress' class="progress-bar bg-color-redLight" data-downloaded-size="0"  aria-valuetransitiongoal="0" style="width: 0%;" aria-valuenow="0">0%</div>
				                </div>
			                </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="core-files-header"><h3><b>Loading Module Files</b></h3></div>
                            <div class="bar-holder">
				                <div class="progress">
					                <div id='module-files-progress' class="progress-bar bg-color-blue" data-downloaded-size="0" aria-valuetransitiongoal="0" style="width: 0%;" aria-valuenow="0">0%</div>
				                </div>
			                </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="core-files-header"><h3><b>Loading Theme Files</b></h3></div>
                            <div class="bar-holder">
				                <div class="progress">
					                <div id='theme-files-progress' class="progress-bar bg-color-blueLight" data-downloaded-size="0" aria-valuetransitiongoal="0" style="width: 0%;" aria-valuenow="0">0%</div>
				                </div>
			                </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="core-files-header"><h3><b>Loading Data Files</b></h3></div>
                            <div class="bar-holder">
				                <div class="progress">
					                <div id='data-files-progress' class="progress-bar bg-color-teal" data-downloaded-size="0" aria-valuetransitiongoal="0" style="width: 0%;" aria-valuenow="0">0%</div>
				                </div>
			                </div>
                        </div>
                    </div> 
                </div>  
                    
                
                <div class="statusContainer">
                    <span id="fileLoadingStatus" class="status">Loading Resources . .</span>
                    <span class="fileNameLoading" id="fileNameLoading"></span>
                </div>
                <%--css--%>
               
            </div>
        </div>
    </form>
</body>
</html>
