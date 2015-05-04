#!/usr/bin/env bash

cd /space/YellowLabTools

# Stop the server
forever stopall

# Keep the settings.json file
git stash
git pull
git stash pop

# In case something was added in package.json or bower.json
rm -rf node_modules
npm install
rm -rf bower_components
bower install --config.interactive=false --allow-root

# Front-end compilation
rm -rf front/build
grunt build

# Restart the server
NODE_ENV=production forever start -c "node --stack-size=262000" bin/server.js