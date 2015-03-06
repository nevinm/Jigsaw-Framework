@ECHO OFF

ECHO.
ECHO ------------------------------------------
ECHO Setting the build environment
ECHO ------------------------------------------
ECHO.
CALL "C:\Program Files (x86)\Microsoft Visual Studio 12.0\Common7\Tools\vsvars32.bat" > NUL 

CALL msbuild.exe "MSBuild.build" /target:Compile

PAUSE