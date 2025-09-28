# Java 21 LTS Environment Configuration
# Source this file or set these environment variables before building Android project

# Set JAVA_HOME to Java 21 LTS installation
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot"

# Add Java 21 to PATH (optional, puts it first in PATH)
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "✅ Java environment configured for Java 21 LTS"
Write-Host "JAVA_HOME: $env:JAVA_HOME"
Write-Host ""
Write-Host "To verify Java version:"
Write-Host "  java -version"
Write-Host ""
Write-Host "To build Android project:"
Write-Host "  cd app\android"
Write-Host "  .\gradlew assembleDebug"