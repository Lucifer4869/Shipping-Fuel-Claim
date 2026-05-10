@echo off
echo Starting Backend and Frontend...
start cmd /k "cd backend && dotnet run"
start cmd /k "cd frontend && npm run dev"
echo Both services are starting in new windows.
pause
