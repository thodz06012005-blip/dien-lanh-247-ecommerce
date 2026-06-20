@echo off
echo.
echo =========================================================
echo ĐANG XÂY DỰNG FRONTEND REACT CHO XAMPP...
echo =========================================================
echo.

echo 1/2: Đang Build Frontend User (Khách hàng)...
cd frontend-user
call npm install
call npm run build
echo Dang copy vao C:\xampp\htdocs\electro_user...
mkdir C:\xampp\htdocs\electro_user 2>nul
xcopy /s /e /y dist\* C:\xampp\htdocs\electro_user\
cd ..
echo Xong Frontend User!
echo.

echo 2/2: Đang Build Frontend Admin (Quản trị)...
cd frontend-admin
call npm install
call npm run build
echo Dang copy vao C:\xampp\htdocs\electro_admin...
mkdir C:\xampp\htdocs\electro_admin 2>nul
xcopy /s /e /y dist\* C:\xampp\htdocs\electro_admin\
cd ..
echo Xong Frontend Admin!
echo.

echo =========================================================
echo THANH CONG! 
echo.
echo Ban da co the xem web tren XAMPP tai:
echo 1. Web Khach hang: http://localhost/electro_user
echo 2. Web Quan tri:   http://localhost/electro_admin
echo.
echo LUU Y QUAN TRONG: Ban van phai chay BACKEND API bang lenh:
echo npm run start:dev (o thu muc backend) de web co du lieu!
echo =========================================================
pause
