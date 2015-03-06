using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Jigsaw.Server.Files
{
    public static class Helpers
    {
        public static string Ident(string s)
        {
            return string.Join("\n", s.Split('\n').Select(x => "    " + x));
        }

        public static void CreateFile(string path, string content)
        {
            using (var writer = new StreamWriter(path))
            {
                writer.WriteLine(content);
            }
        }
    }
}
