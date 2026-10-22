@echo off
echo ============================================
echo  MySQL Root Password Reset (Administrator)
echo ============================================
echo.

echo [1/6] Adding skip-grant-tables to my.ini...
echo skip-grant-tables >> "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
echo       Done.

echo [2/6] Restarting MySQL80 service...
net stop MySQL80
timeout /t 3 /nobreak >nul
net start MySQL80
timeout /t 5 /nobreak >nul

echo [3/6] Resetting root password...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY 'dev-root-password-change-me';"

echo [4/6] Creating database and user...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"dev-root-password-change-me" -e "CREATE DATABASE IF NOT EXISTS smart_study; CREATE USER IF NOT EXISTS 'smart_study'@'localhost' IDENTIFIED BY 'dev-password-change-me'; GRANT ALL PRIVILEGES ON smart_study.* TO 'smart_study'@'localhost'; FLUSH PRIVILEGES;"

echo [5/6] Removing skip-grant-tables from my.ini...
powershell -Command "(Get-Content 'C:\ProgramData\MySQL\MySQL Server 8.0\my.ini') | Where-Object { $_ -ne 'skip-grant-tables' } | Set-Content 'C:\ProgramData\MySQL\MySQL Server 8.0\my.ini'"

echo [6/6] Restarting MySQL normally...
net stop MySQL80
timeout /t 3 /nobreak >nul
net start MySQL80

echo.
echo ============================================
echo  DONE! MySQL reset complete.
echo  Root password: dev-root-password-change-me
echo  DB User: smart_study / dev-password-change-me
echo ============================================
echo.

echo DONE > "d:\Smart Edu\reset-mysql-result.txt"
pause
