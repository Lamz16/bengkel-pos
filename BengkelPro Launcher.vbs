Option Explicit
Dim shell, files, root, command, result
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
root = files.GetParentFolderName(WScript.ScriptFullName)
command = "powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File """ & root & "\tools\BengkelProLauncher.ps1"""
result = shell.Run(command, 0, True)
If result <> 0 Then MsgBox "Launcher gagal dibuka. Hubungi pengelola aplikasi untuk memeriksa instalasi.", vbCritical, "BengkelPro Launcher"
