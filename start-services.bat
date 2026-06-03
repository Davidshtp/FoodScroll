@echo off
title FeedGo Starter

:: Definimos las rutas CON comillas integradas en la variable
set "WT="C:\Users\User hp\AppData\Local\Microsoft\WindowsApps\wt.exe""
set "BASE_DIR=C:\Users\User hp\Documents\ITP\7MO SEMESTRE\Proyecto\FoodScroll"

%WT% ^
new-tab --tabColor "#00AAFF" --suppressApplicationTitle --title "Gateway" cmd /k "cd /d """C:\Users\User hp\Documents\ITP\7MO SEMESTRE\Proyecto\FoodScroll\gateway""" && npm run start" ^
; new-tab --tabColor "#FFAA00" --suppressApplicationTitle --title "Customer Service" cmd /k "cd /d """%BASE_DIR%\customer-service""" && npm run start:dev" ^
; new-tab --tabColor "#00FF66" --suppressApplicationTitle --title "Delivery Service" cmd /k "cd /d """%BASE_DIR%\delivery-service""" && npm run start:dev" ^
; new-tab --tabColor "#FF0066" --suppressApplicationTitle --title "Identity Service" cmd /k "cd /d """%BASE_DIR%\identity-service""" && npm run start:dev" ^
; new-tab --tabColor "#AA00FF" --suppressApplicationTitle --title "Location Service" cmd /k "cd /d """%BASE_DIR%\location-service""" && npm run start:dev" ^
; new-tab --tabColor "#FF8C00" --suppressApplicationTitle --title "Restaurant Service" cmd /k "cd /d """%BASE_DIR%\restaurant-service""" && npm run start:dev" ^
; new-tab --tabColor "#FF4500" --suppressApplicationTitle --title "Publications Service" cmd /k "cd /d """%BASE_DIR%\publications-service""" && npm run start:dev" ^
; new-tab --tabColor "#FF69B4" --suppressApplicationTitle --title "Engagement Service" cmd /k "cd /d """%BASE_DIR%\engagement-service""" && npm run start:dev" ^
; new-tab --tabColor "#00FFFF" --suppressApplicationTitle --title "Python Scraper" cmd /k "cd /d """%BASE_DIR%\python-scraper""" && python main.py" ^
; new-tab --tabColor "#FFD700" --suppressApplicationTitle --title "Python License Scraper" cmd /k "cd /d """%BASE_DIR%\python-license-scraper""" && python main.py"

pause