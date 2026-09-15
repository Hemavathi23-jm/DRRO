@echo off
cd %~dp0backend
echo Starting DRRO Backend (Spring Boot)...
mvn spring-boot:run
pause
