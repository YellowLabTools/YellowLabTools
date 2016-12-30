#!/usr/bin/env bash

# APT-GET
sudo apt-get update
sudo apt-get install lsb-release libfontconfig1 libfreetype6 libjpeg-dev -y --force-yes > /dev/null 2>&1
sudo apt-get install curl git software-properties-common build-essential make g++ -y --force-yes > /dev/null 2>&1

# Installation of NodeJS
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
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