using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

namespace Jigsaw.UI.Core.MasterPageRuntime.TestHarness.Models
{
    public class TestHarnessModel
    {
        [Display(Name="JQuery")]
        public bool RenderScripts { get; set;}

        [Display(Name = "Bootstrap")]
        public bool RenderStyles { get; set; }

    }
}