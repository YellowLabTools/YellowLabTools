#!/usr/bin/env bash

# APT-GET
sudo apt-get update
sudo apt-get install lsb-release libfontconfig1 libfreetype6 libjpeg-dev libnss3 libatk1.0-0 libatk-bridge2.0-0 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release libgbm1 xdg-utils wget -y --force-yes > /dev/null 2>&1
sudo apt-get install curl git software-properties-common build-essential make g++ -y --force-yes > /dev/null 2>&1

# Installation of NodeJS
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs > /dev/null 2>&1
source ~/.profile

# Installation of some packages globally
npm install forever grunt-cli -g
source ~/.profile

# Installation of YellowLabTools
sudo chown -R $USER /space
cd /space/YellowLabTools
npm install || exit 1

# Front-end compilation
grunt build

# Start the server
rm server_config/settings.json
cp server_config/settings-prod.json server_config/settings.json
NODE_ENV=production forever start -c "node --stack-size=262000" bin/server.js