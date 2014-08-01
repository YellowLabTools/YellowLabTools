#!/usr/bin/env bash

# APT-GET
sudo apt-get update
sudo apt-get install lsb-release -y --force-yes
sudo apt-get install curl git -y --force-yes

# Installation of NodeJS
curl https://raw.githubusercontent.com/creationix/nvm/v0.12.2/install.sh | bash
source ~/.profile
nvm install v0.10.30
nvm use v0.10.30

# Installation of some packages globally
npm install bower -g
npm install forever -g

# Installation of YellowLabTools
sudo mkdir /space
sudo chown $USER /space
cd /space
git clone https://github.com/gmetais/YellowLabTools.git --branch master
cd YellowLabTools
npm install
bower install --config.interactive=false

# Start the server
rm server_config/settings.json
cp server_config/settings-prod.json server_config/settings.json
forever start server.js