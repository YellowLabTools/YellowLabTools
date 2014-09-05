#!/usr/bin/env bash

cd /space/YellowLabTools

# Stop the server
forever stopall

# Keep the settings.json file
git stash
git pull
git stash pop

# In case something was added in package.json or bower.json
npm install --production
bower install --config.interactive=false --allow-root

# Restart the server
forever start -c "node --stack-size=65500" server.js