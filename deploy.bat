@echo off
echo 🚀 Technically Fit AI Deployment Script
echo ========================================

echo Step 1: Download flyctl.exe
echo ---------------------------
echo Please download flyctl.exe manually from:
echo https://github.com/superfly/flyctl/releases/latest/download/flyctl.exe
echo Save it to: %CD%\flyctl.exe
echo.
echo Press any key when done...
pause >nul

echo.
echo Step 2: Authenticate with Fly.io
echo ---------------------------------
flyctl.exe auth login

echo.
echo Step 3: Deploy to Fly.io
echo ------------------------
flyctl.exe deploy

echo.
echo Step 4: Set Hugging Face Token
echo -------------------------------
echo Run this command with your actual HF token:
echo flyctl.exe secrets set HF_TOKEN=your_actual_huggingface_token_here

echo.
echo Step 5: Test the deployment
echo ----------------------------
echo Get your app URL with: flyctl.exe status
echo Test with: curl https://your-app.fly.dev/health

echo.
echo ✅ Deployment complete!
pause