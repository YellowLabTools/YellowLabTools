Vagrant.configure("2") do |config|

  config.vm.box = "ubuntu/precise64"

  config.vm.network :private_network, ip: "10.10.10.10"
  config.ssh.forward_agent = true

  config.vm.provider :virtualbox do |vb|
    vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
    vb.customize ["modifyvm", :id, "--memory", 512]
    vb.customize ["modifyvm", :id, "--cpus", 2]
  end

  config.vm.provision :shell, :path => "server_config/server_install.sh"

end
