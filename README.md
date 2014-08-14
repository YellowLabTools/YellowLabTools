# Yellow Lab Tools

Online tool designed to help Front-End developers optimize their website

[![Dependency Status](https://gemnasium.com/gmetais/YellowLabTools.svg)](https://gemnasium.com/gmetais/YellowLabTools)


## How it works

The tool is based on the fabulous [Phantomas](https://github.com/macbre/phantomas) by Maciej Brencz, that loads a page and collects many web performance metrics.
I rewrote some modules to deeper analyse Javascript interactions with the DOM (especially with jQuery).
And then it is wrapped inside a small server (inspired by my favorite tool: [WebPageTest](http://www.webpagetest.org/)).

**There are so many things left to do, your help would be greatly appreciated! Please report bugs, ask for evolutions and come code with me.**


## Install your own instance

### Manual installation

You need this 3 brothers: [Git](http://git-scm.com/downloads), [NodeJS](http://nodejs.org/download/) and [Bower](http://bower.io/#install-bower). Click on the links to know how to install them.

1) Clone this repository somewhere on your computer:
```shell
git clone https://github.com/gmetais/YellowLabTools.git
```

2) Get inside the newly created folder and install the dependencies:
```shell
cd YellowLabTools
npm install
bower install
```

3) Launch the server
```shell
node server.js
```

4) Open you browser to [http://localhost:8383](http://localhost:8383). The default port 8383 can be changed in `server_config/settings.json`.


### In a virtual machine with Vagrant

You need VirtualBox & Vagrant.

1) Clone this repository somewhere on your computer:
```shell
git clone https://github.com/gmetais/YellowLabTools.git
```

2) Get inside the newly created folder and build the virtual machine:
```shell
cd YellowLabTools
vagrant up
```

3) Open your browser to [http://10.10.10.10](http://10.10.10.10).
