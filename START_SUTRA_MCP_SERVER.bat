@echo off
title SutraFlow Sovereign Fabric Vault MCP Server (Port 8000)
color 0B
echo ======================================================================
echo   SutraFlow Sovereign Fabric & Legal Memory Vault
echo   Multi-Harness MCP Server live on SSE Transport (Port 8000)
echo ======================================================================
echo.
echo [*] Local SSE Endpoint:     http://127.0.0.1:8000/sse
echo [*] Local Streamable HTTP:  http://127.0.0.1:8000/mcp
echo [*] Production Gateway:     https://sutraflow.us/mcp
echo.
echo [*] Supported AI Harnesses:
echo     - Antigravity IDE
echo     - Claude Desktop
echo     - Cursor / VS Code
echo     - Custom Agents & SDKs
echo.
echo Starting MCP SSE Server...
python "%~dp0src\mcp_servers\sutra_mcp_unified.py" --transport sse --host 0.0.0.0 --port 8000
pause
