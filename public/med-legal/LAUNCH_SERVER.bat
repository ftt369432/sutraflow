@echo off
TITLE California Workers' Comp Litigation Master Suite - Localhost Server
color 0B
echo ===============================================================================
echo     ⚖️ CALIFORNIA WORKERS' COMP LITIGATION MASTER SUITE (2026 EDITION)
echo                    STANDALONE LOCALHOST HTTP SERVER
echo ===============================================================================
echo.
echo Starting Localhost Server on port 8899...
echo Access in browser: http://localhost:8899/index.html
echo.
cd /d "%~dp0"
start "" "http://localhost:8899/index.html"
python -m http.server 8899
