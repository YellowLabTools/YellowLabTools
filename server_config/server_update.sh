#!/usr/bin/env bash

cd /space/YellowLabTools

# Stop the server and start the maintenance mode
forever stopall
forever start server_config/maintenance.js

# Keep the settings.json file
git stash
git pull
git stash pop

# In case something was added in package.json
rm -rf node_modules
npm install || exit 1

# Front-end compilation
rm -rf front/build
grunt build

# Stop the maintenance mode and restart the server
forever stopall
NODE_ENV=production forever start -c "node --stack-size=262000" bin/server.js