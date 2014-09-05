#!/usr/bin/env bash

# Stop the server
forever stopall

cd /space/YellowLabTools
# Keep the settings.json file
git stash
git pull
git stash pop

# Restart the server
forever start -c "node --stack-size=65500" server.js