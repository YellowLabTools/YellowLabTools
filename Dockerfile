FROM    node:10
# last commit=v1.13.1
ENV     VERSION=master
WORKDIR /usr/src
RUN     git clone --branch ${VERSION} https://github.com/gmetais/YellowLabTools.git ylt \
        && cd ylt \
        && npm install --dev \
        && grunt build \
        && rm -rf node_modules
WORKDIR /usr/src/ylt
EXPOSE  8383
ENV     NODE_ENV=production
CMD     ["bin/server.js"]
