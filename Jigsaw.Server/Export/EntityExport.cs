using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web.Hosting;
using System.Web.Mvc;
using CodeEffects.Rule.Attributes;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Novacode;
using NPOI.HSSF.UserModel;
using Font = iTextSharp.text.Font;

namespace Jigsaw.Server.Export
{
    public static class EntityExport
    {
        /// <summary>
        /// retrieves the content of a file inside the server
        /// </summary>
        /// <param name="serverRelativePath"></param>
        /// <returns></returns>
        public static string ReadStaticTemplate(string serverRelativePath)
        {
            var path = HostingEnvironment.MapPath(serverRelativePath);
            using (var stream = new StreamReader(path))
            {
                return stream.ReadToEnd();
            }
        }

        public static string RenderRazorViewToString(this Controller controller, string viewName, object model = null)
        {
            controller.ViewData.Model = model;
            using (var sw = new StringWriter())
            {
                var viewResult = ViewEngines.Engines.FindPartialView(controller.ControllerContext, viewName);
                var viewContext = new ViewContext(controller.ControllerContext, viewResult.View, controller.ViewData, controller.TempData, sw);
                viewResult.View.Render(viewContext, sw);
                viewResult.ViewEngine.ReleaseView(controller.ControllerContext, viewResult.View);
                return sw.GetStringBuilder().ToString();
            }
        }

        private static string GetDisplayName(this PropertyInfo property)
        {
            return (property.CustomAttributes.Count(x => x.AttributeType == typeof(DisplayAttribute)) > 0 && property.GetCustomAttribute<DisplayAttribute>().Name != null)
                ? property.GetCustomAttribute<DisplayAttribute>().Name
                : property.Name;
        }

        public static byte[] ToPdfDocument<T>(T entity, string htmlTemplate)
        {
            var titleFont = new Font(Font.FontFamily.HELVETICA, 20f, Font.BOLD);
            var tabFont = new Font(Font.FontFamily.HELVETICA, 16f, Font.BOLD, BaseColor.BLUE);
            var groupFont = new Font(Font.FontFamily.HELVETICA, 14f, Font.BOLD);
            var fieldLabelFont = new Font(Font.FontFamily.HELVETICA, 12f, Font.BOLD);
            var fieldFont = new Font(Font.FontFamily.HELVETICA, 12f);


            using (var output = new MemoryStream())
            {
                var document = new Document();
                PdfWriter.GetInstance(document, output);
                document.Open();

                var para = new iTextSharp.text.Paragraph(typeof(T).Name + " Export", titleFont);
                para.Alignment = Element.ALIGN_CENTER;
                document.Add(para);

                var parsed = ViewbarTemplateParser.Parse(htmlTemplate);

                foreach (var tab in parsed)
                {
                    var tabParagraph = new iTextSharp.text.Paragraph(tab.Title, tabFont);
                    var paragraph = document.Add(tabParagraph);

                    foreach (var group in tab.Groups)
                    {
                        var groupParagraph = new iTextSharp.text.Paragraph(group.Title, groupFont);
                        document.Add(groupParagraph);

                        foreach (var field in group.Fields)
                        {
                            var property = typeof(T).GetProperty(field.Property);

                            var fieldParagraph = new iTextSharp.text.Paragraph();
                            
                            if (property != null)
                            {
                                var chunk = new Chunk(property.GetDisplayName() + ": ", fieldLabelFont);
                                fieldParagraph.Add(chunk);

                                var value = property.GetValue(entity);
                                if (value != null)
                                {
                                    switch (field.FieldType)
                                    {
                                        case ViewbarTemplateParser.FieldType.Input:
                                        case ViewbarTemplateParser.FieldType.Span:
                                            var chunk0 = new Chunk(value.ToString(), fieldFont);
                                            fieldParagraph.Add(chunk0);
                                            break;
                                        case ViewbarTemplateParser.FieldType.Textarea:
                                            var chunk1 = new Chunk(Environment.NewLine + value.ToString(), fieldFont);
                                            fieldParagraph.Add(chunk1);
                                            break;
                                        case ViewbarTemplateParser.FieldType.Image:
                                            var image = iTextSharp.text.Image.GetInstance((byte[])value);
                                            //fieldParagraph.Add(Environment.NewLine);
                                            fieldParagraph.Add(image);
                                            break;
                                    }
                                }
                            }
                            document.Add(fieldParagraph);
                        }

                        document.Add(new iTextSharp.text.Paragraph(Environment.NewLine));
                    }
                }

                document.Close();

                return output.ToArray();
            }
        }

        public static byte[] ToWordDocument<T>(T entity, string htmlTemplate)
        {
            using (var output = new MemoryStream())
            {
                using (DocX document = DocX.Create(output))
                {
                    // Insert a new Paragraph into the document.
                    var title = document.InsertParagraph().Append(typeof(T).Name + " Export").FontSize(20);
                    title.Alignment = Alignment.center;

                    var parsed = ViewbarTemplateParser.Parse(htmlTemplate);

                    foreach (var tab in parsed)
                    {
                        var paragraph = document.InsertParagraph(tab.Title).Bold().FontSize(16).Color(Color.Blue)
                            .AppendLine();

                        foreach (var group in tab.Groups)
                        {
                            paragraph.AppendLine(group.Title).Bold().FontSize(14);

                            foreach (var field in group.Fields)
                            {
                                var property = typeof(T).GetProperty(field.Property);
                                
                                if (property != null)
                                {
                                    paragraph.AppendLine(property.GetDisplayName() + ": ").Bold();

                                    var value = property.GetValue(entity);
                                    if (value != null)
                                    {
                                        switch (field.FieldType)
                                        {
                                            case ViewbarTemplateParser.FieldType.Input:
                                            case ViewbarTemplateParser.FieldType.Span:
                                                paragraph.Append(value.ToString());
                                                break;
                                            case ViewbarTemplateParser.FieldType.Textarea:
                                                paragraph.AppendLine().Append(value.ToString());
                                                break;
                                            case ViewbarTemplateParser.FieldType.Image:
                                                using (var stream = new MemoryStream((byte[])value))
                                                {
                                                    var image = document.AddImage(stream);
                                                    var picture = image.CreatePicture();
                                                    paragraph.AppendLine().AppendPicture(picture);
                                                }
                                                break;
                                        }
                                    }
                                }
                            }

                            paragraph.AppendLine();
                        }

                        paragraph.AppendLine();
                    }

                    document.Save();
                }

                return output.ToArray();
            }
        }

        public static byte[] CollectionToExcelDocument<T>(IEnumerable<T> items, ColumnSpec[] columns, bool includeHeaders = true)
        {
            //Create new Excel workbook
            var workbook = new HSSFWorkbook();
            using (var stream = new MemoryStream())
            {

                //Create new Excel sheet
                var sheet = workbook.CreateSheet();

                for (int i = 0; i < columns.Length; i++)
                {
                    if (columns[i].Width > 0)
                    {
                        sheet.SetColumnWidth(i, columns[i].Width);
                    }
                }

                if (includeHeaders)
                {
                    //Create a header row
                    var headerRow = sheet.CreateRow(0);

                    for (int i = 0; i < columns.Length; i++)
                    {
                        if (!string.IsNullOrEmpty(columns[i].Title))
                        {
                            headerRow.CreateCell(i).SetCellValue(columns[i].Title);
                        }
                        else
                        {
                            headerRow.CreateCell(i).SetCellValue(columns[i].PropertyName);
                        }
                    }

                    //(Optional) freeze the header row so it is not scrolled
                    sheet.CreateFreezePane(0, 1, 0, 1);
                }

                var properties = columns.Select(column => column.PropertyName)
                    .Select(property => typeof(T).GetProperty(property))
                    .ToDictionary(property => property.Name);

                int rowNumber = 1;

                //Populate the sheet with values from the grid data
                foreach (var item in items)
                {
                    //Create a new row
                    var row = sheet.CreateRow(rowNumber++);

                    for (int i = 0; i < columns.Length; i++)
                    {
                        var property = properties[columns[i].PropertyName];
                        var value = property.GetValue(item);
                        row.CreateCell(i).SetCellValue(value!=null? value.ToString(): "");
                    }
                }

                workbook.Write(stream);

                return stream.ToArray();
            }

        }


    }

    public class ColumnSpec
    {
        public string Title { get; set; }

        public string PropertyName { get; private set; }

        public int Width { get; set; }

        public ColumnSpec(string propertyName)
        {
            this.PropertyName = propertyName;
        }
    }
}





