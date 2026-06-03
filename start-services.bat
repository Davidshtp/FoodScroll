@echo off
title FeedGo Starter

set "WT=C:\Users\pc\AppData\Local\Microsoft\WindowsApps\wt.exe"
set "WT=C:\Users\pc\AppData\Local\Microsoft\WindowsApps\wt.exe"

%WT% ^
new-tab --tabColor "#00AAFF" --suppressApplicationTitle --title "Gateway" cmd /k "cd /d C:\Users\pc\OneDrive\Desktop\proyecto\FOODSCROLL\gateway && npm run start" ^
; new-tab --tabColor "#FFAA00" --suppressApplicationTitle --title "Customer Service" cmd /k "cd /d C:\Users\pc\OneDrive\Desktop\proyecto\FOODSCROLL\customer-service && npm run start:dev" ^
; new-tab --tabColor "#00FF66" --suppressApplicationTitle --title "Delivery Service" cmd /k "cd /d C:\Users\pc\OneDrive\Desktop\proyecto\FOODSCROLL\delivery-service && npm run start:dev" ^
; new-tab --tabColor "#FF0066" --suppressApplicationTitle --title "Identity Service" cmd /k "cd /d C:\Users\pc\OneDrive\Desktop\proyecto\FOODSCROLL\identity-service && npm run start:dev" ^
; new-tab --tabColor "#AA00FF" --suppressApplicationTitle --title "Location Service" cmd /k "cd /d C:\Users\pc\OneDrive\Desktop\proyecto\FOODSCROLL\location-service && npm run start:dev" ^
; new-tab --tabColor "#00FFFF" --suppressApplicationTitle --title "Python Scraper" cmd /k "cd /d C:\Users\pc\OneDrive\Desktop\proyecto\FOODSCROLL\python-scraper && python main.py" ^
; new-tab --tabColor "#FFD700" --suppressApplicationTitle --title "Python License Scraper" cmd /k "cd /d C:\Users\pc\OneDrive\Desktop\proyecto\FOODSCROLL\python-license-scraper && python main.py"

pause