FROM    node:10
WORKDIR /app/ylt
ENV     VERSION=v1.13.3
EXPOSE  8383
RUN     git clone --branch ${VERSION} https://github.com/LumberjackOtters/YellowLabTools && yarn install && yarn build
ENV     NODE_ENV=production
CMD     ["node", "bin/server.js"]
