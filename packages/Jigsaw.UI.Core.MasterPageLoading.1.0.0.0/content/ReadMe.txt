After installing this package, the following changes need to be made in the code base

1. In the main layout page, modify the <html> tag as follows
	<html lang="en" manifest="@Url.Action("Index", "Offline")">

2. Modify the Global.asax.cs to add the details of files that are to be cached in the client side app cache 
	using any of the following syntax
	CacheManifest.AddFile("~\\scripts\Test.js");	// To add a specific file
	CacheManifest.AddFolder("~\\scripts", true);	//To add a complete folder
	CacheManifest.AddFolder("~\\html", FileFilterEnum.Html, false);	// To add specific file types alone from a folder

3. Use the Scripts\Core\appcache.js module if there is any need to show the app-caching progress
