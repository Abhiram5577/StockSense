@echo off
echo Setting up StockSense Database Schema and Seed Data
echo Enter your MySQL root password if prompted.

mysql -u root -p stocksense < sql\products.sql
mysql -u root -p stocksense < sql\stock.sql
mysql -u root -p stocksense < sql\seed.sql

echo Setup complete!
