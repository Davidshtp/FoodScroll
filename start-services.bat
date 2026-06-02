@echo off
title FeedGo Starter

set "WT=C:\Users\pc\AppData\Local\Microsoft\WindowsApps\wt.exe"

%WT% ^
new-tab --tabColor "#00AAFF" --suppressApplicationTitle --title "Gateway" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\gateway && npm run start" ^
; new-tab --tabColor "#FFAA00" --suppressApplicationTitle --title "Customer Service" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\customer-service && npm run start:dev" ^
; new-tab --tabColor "#00FF66" --suppressApplicationTitle --title "Delivery Service" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\delivery-service && npm run start:dev" ^
; new-tab --tabColor "#FF0066" --suppressApplicationTitle --title "Identity Service" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\identity-service && npm run start:dev" ^
; new-tab --tabColor "#AA00FF" --suppressApplicationTitle --title "Location Service" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\location-service && npm run start:dev" ^
; new-tab --tabColor "#FF8C00" --suppressApplicationTitle --title "Restaurant Service" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\restaurant-service && npm run start:dev" ^
; new-tab --tabColor "#FF4500" --suppressApplicationTitle --title "Publications Service" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\publications-service && npm run start:dev" ^
; new-tab --tabColor "#FF69B4" --suppressApplicationTitle --title "Engagement Service" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\engagement-service && npm run start:dev" ^
; new-tab --tabColor "#00FFFF" --suppressApplicationTitle --title "Python Scraper" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\python-scraper && python main.py" ^
; new-tab --tabColor "#FFD700" --suppressApplicationTitle --title "Python License Scraper" cmd /k "cd /d C:\Users\USUARIO\Desktop\FeedGo\python-license-scraper && python main.py"

pause