@echo off
setlocal
set "PATH=C:\Users\Mario\Documents\Programming\Astra_Accenture_Hackathon\.tools\node-v22.22.0-win-x64;%PATH%"
"C:\Users\Mario\Documents\Programming\Astra_Accenture_Hackathon\.tools\node-v22.22.0-win-x64\node.exe" "C:\Users\Mario\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.mjs" %*
exit /b %ERRORLEVEL%
