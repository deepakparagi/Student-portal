# ========================================================
# MySQL Root Password Reset Script (Auto-Elevates)
# ========================================================
# This script:
# 1. Stops the MySQL80 service
# 2. Starts MySQL with --skip-grant-tables

# --- Self-Elevation ---
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit 0
}
# 3. Resets root password and creates the smart_study user
# 4. Restarts MySQL normally

Write-Host ">>> MySQL Root Password Reset" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop the MySQL service
Write-Host "[1/5] Stopping MySQL80 service..." -ForegroundColor Yellow
net stop MySQL80 2>$null
Start-Sleep -Seconds 3

# Verify stopped
$svc = Get-Service MySQL80 -ErrorAction SilentlyContinue
if ($svc.Status -eq 'Running') {
    Write-Host "ERROR: Could not stop MySQL80. Please run this script as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> Run as Administrator -> then run: .\reset-mysql.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "      MySQL80 service stopped." -ForegroundColor Green

# Step 2: Start MySQL with --skip-grant-tables
Write-Host "[2/5] Starting MySQL with --skip-grant-tables..." -ForegroundColor Yellow
$mysqld = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$proc = Start-Process -FilePath $mysqld -ArgumentList "--skip-grant-tables", "--shared-memory", "--console" -WindowStyle Minimized -PassThru
Start-Sleep -Seconds 5

# Step 3: Reset root password
Write-Host "[3/5] Resetting root password..." -ForegroundColor Yellow
$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
& $mysql -u root -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'dev-root-password-change-me';"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not reset root password." -ForegroundColor Red
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "      Root password reset to: dev-root-password-change-me" -ForegroundColor Green

# Step 4: Create smart_study user and database
Write-Host "[4/5] Creating database and user..." -ForegroundColor Yellow
& $mysql -u root -p"dev-root-password-change-me" -e "CREATE DATABASE IF NOT EXISTS smart_study; CREATE USER IF NOT EXISTS 'smart_study'@'localhost' IDENTIFIED BY 'dev-password-change-me'; GRANT ALL PRIVILEGES ON smart_study.* TO 'smart_study'@'localhost'; FLUSH PRIVILEGES;"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not create database/user." -ForegroundColor Red
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "      Database 'smart_study' and user created." -ForegroundColor Green

# Step 5: Stop skip-grant-tables instance and restart service normally
Write-Host "[5/5] Restarting MySQL normally..." -ForegroundColor Yellow
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
net start MySQL80
Start-Sleep -Seconds 2

$svc = Get-Service MySQL80 -ErrorAction SilentlyContinue
if ($svc.Status -eq 'Running') {
    Write-Host ""
    Write-Host ">>> MySQL reset complete! Service is running." -ForegroundColor Green
    Write-Host "    Root password: dev-root-password-change-me" -ForegroundColor White
    Write-Host "    DB User:      smart_study / dev-password-change-me" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now run: .\run-all.ps1" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: MySQL80 service did not restart. Try: net start MySQL80" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to close this window"
