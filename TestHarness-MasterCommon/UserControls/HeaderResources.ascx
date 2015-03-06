<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="HeaderResources.ascx.cs" Inherits="TestHarness.UserControls.HeaderResources" %>


<div class="test-col-25 check-container">
    <h4 class="vertical-text">Javascripts</h4>
    <div class="checkbox-list">
        <asp:CheckBoxList ID="chklstScripts" AutoPostBack="true" CssClass="chkboxlist" runat="server" OnSelectedIndexChanged="chklstScripts_SelectedIndexChanged">
        </asp:CheckBoxList>
        <asp:CheckBoxList ID="chklstScriptsCurrent" CssClass="chkboxlist" runat="server">
        </asp:CheckBoxList>
    </div>
</div>
<div class="test-col-25 check-container">
    <h4 class="vertical-text">CSS Styles</h4>
    <div class="">

        <div class="checkbox">
            <label>
                <input type="checkbox" class="js-styles" data-location="content/core-styles/bootstrap.css" />Bootstrap.css</label>
        </div>

        <div class="checkbox">
            <label>
                <input type="checkbox" class="js-styles" data-location="content/core-styles/smartadmin-production.css" />smartadmin-production.css</label>
        </div>
    </div>
</div>
<script type="text/javascript">
    /**
        *   Loads Js/Css files
        *   @param filename Name of the file being loaded.
        *   @param filetype type of the file being loaded (css/js).
        */
        function loadJsCss(filename, filetype) {
            if (filetype == "js") { //if filename is a external JavaScript file
                var fileref = document.createElement('script')
                fileref.setAttribute("type", "text/javascript")
                fileref.setAttribute("src", filename)
            }
            else if (filetype == "css") { //if filename is an external CSS file
                var fileref = document.createElement("link")
                fileref.setAttribute("rel", "stylesheet")
                fileref.setAttribute("type", "text/css")
                fileref.setAttribute("href", filename)
            }
            if (typeof fileref != "undefined")
                document.getElementsByTagName("head")[0].appendChild(fileref)
        }

        /**
        *   Unloads Js/Css files
        *   @param filename Name of the file being unloaded.
        *   @param filetype type of the file being unloaded (css/js).
        */
        function removeJsCss(filename, filetype) {
            var targetelement = (filetype == "js") ? "script" : (filetype == "css") ? "link" : "none" //determine element type to create nodelist from
            var targetattr = (filetype == "js") ? "src" : (filetype == "css") ? "href" : "none" //determine corresponding attribute to test for
            var allsuspects = document.getElementsByTagName(targetelement)
            for (var i = allsuspects.length; i >= 0; i--) { //search backwards within nodelist for matching elements to remove
                if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(filename) != -1)
                    allsuspects[i].parentNode.removeChild(allsuspects[i]) //remove element by calling parentNode.removeChild()
            }
        }

        /**
        *   invoke load or unload files function checking the value of the checkbox
        *   @param e Event
        */
        var toggleScripts = function (e) {
            var checkbox = e.currentTarget;
            var url = checkbox.getAttribute("data-location");
            var isLoaded = checkbox.getAttribute("data-loaded");
            if (isLoaded == true || isLoaded == "true") {
                removeJsCss(url, 'css');
                checkbox.setAttribute("data-loaded", "false");
                log(url.substring(url.lastIndexOf('/') + 1) + ' has been unloaded.');
            } else {
                loadJsCss(url, 'css');
                checkbox.setAttribute("data-loaded", "true");
                log(url.substring(url.lastIndexOf('/') + 1) + ' has been loaded.');
            }

        }
        /**
        *   Binding onchange event for the style checkboxes 
        */
        var checkboxScripts = document.getElementsByClassName('js-styles');
        for (var i = 0; i < checkboxScripts.length; i++) {
            var checkbox = checkboxScripts[i];
            checkbox.onchange = toggleScripts;
        }
</script>