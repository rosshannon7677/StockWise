Write-Host "Setting up StockWise development environment..."

# Store the original directory
$scriptPath = $PSScriptRoot
Write-Host "Script running from: $scriptPath"

# Force running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {   
    $arguments = "& '" + $myinvocation.mycommand.definition + "'"
    Start-Process powershell -Verb runAs -ArgumentList $arguments -Wait
    Exit
}

# Install Node.js LTS using msi installer directly
$nodeVersion = "v18.19.1"  # LTS version
$nodeMsi = "node-$nodeVersion-x64.msi"
$nodeUrl = "https://nodejs.org/dist/$nodeVersion/$nodeMsi"
$nodeInstallerPath = "$env:TEMP\$nodeMsi"

Write-Host "Downloading Node.js..."
Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstallerPath

Write-Host "Installing Node.js..."
Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstallerPath /quiet"

# Update system PATH variables
$npmPath = "C:\Program Files\nodejs"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$npmPath", [EnvironmentVariableTarget]::Machine)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$npmPath", [EnvironmentVariableTarget]::User)

# Refresh current session PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Force PowerShell to recognize new PATH
$env:PSModulePath = [System.Environment]::GetEnvironmentVariable("PSModulePath", "Machine")

Write-Host "Verifying Node.js and npm installation..."
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Host "Node.js $nodeVersion and npm $npmVersion installed successfully"
} catch {
    Write-Host "Installation verification failed. Please restart your computer and try again."
    Exit 1
}

# Install Ionic CLI globally
Write-Host "Installing Ionic CLI..."
npm install -g @ionic/cli --force

# Install project dependencies
Set-Location $scriptPath
Write-Host "Installing project dependencies in: $scriptPath"
npm install --legacy-peer-deps

Write-Host "`nSetup complete!"
Write-Host "Please restart your computer to ensure all PATH changes take effect."
Write-Host "After restarting, navigate to the StockWise directory and run 'npm run start'"

# Keep window open
Read-Host -Prompt "Press Enter to exit"