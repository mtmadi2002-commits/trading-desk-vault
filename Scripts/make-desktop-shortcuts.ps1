# Creates a "Trading Desk" folder on the Desktop with shortcuts to everything. Run from anywhere:  .\Scripts\make-desktop-shortcuts.ps1
$vault = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$desk  = Join-Path ([Environment]::GetFolderPath("Desktop")) "Trading Desk"
New-Item -ItemType Directory -Force -Path $desk | Out-Null
function Url($name, $url) { Set-Content -Path (Join-Path $desk "$name.url") -Value "[InternetShortcut]`r`nURL=$url" }
Url "1 Desk Floor (live 3D)"        "https://claude.ai/artifact/JSScJUS6LxVYYfr98XfUVL"
Url "2 Today's Playbook"           "https://claude.ai/artifact/3p1oPXKJcVnqULQmMMEgFr"
Url "3 Vault on GitHub"            "https://github.com/mtmadi2002-commits/trading-desk-vault"
Url "4 Desk engine (cloud session)" "https://claude.ai/code/session_01URQVpT1mE8o8ZHUQRQHzvP"
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut((Join-Path $desk "5 Vault folder.lnk")); $lnk.TargetPath = $vault; $lnk.Save()
$cmd = $ws.CreateShortcut((Join-Path $desk "6 Ask the desk (Claude Code).lnk")); $cmd.TargetPath = "powershell.exe"; $cmd.Arguments = "-NoExit -Command `"cd '$vault'; claude`""; $cmd.WorkingDirectory = $vault; $cmd.Save()
Copy-Item (Join-Path $vault "START-HERE.md") (Join-Path $desk "START-HERE.md") -Force
Copy-Item (Join-Path $vault "Desk\Rules.md")  (Join-Path $desk "Rules (current).md") -Force
Write-Host "Done: $desk" -ForegroundColor Green
Get-ChildItem $desk | Select-Object Name
