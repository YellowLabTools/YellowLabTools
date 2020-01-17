FROM    node:10
WORKDIR /app
ENV     VERSION=master
EXPOSE  8383
RUN     git clone --branch ${VERSION} https://github.com/LumberjackOtters/YellowLabTools ylt && cd ylt && yarn install && yarn build
ENV     NODE_ENV=production
CMD     ["node", "/app/ylt/bin/server.js"]
