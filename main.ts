import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AzurermProvider } from './.gen/providers/azurerm/provider'; // resource import
import { ResourceGroup } from './.gen/providers/azurerm/resource-group'; // resource import
import { VirtualNetwork } from './.gen/providers/azurerm/virtual-network'; // resource import
import { Subnet } from './.gen/providers/azurerm/subnet'; // resource import
import { NetworkInterface } from './.gen/providers/azurerm/network-interface'; // resource import
import { LinuxVirtualMachine } from './.gen/providers/azurerm/linux-virtual-machine'; // resource import

class VmStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    new AzurermProvider(this, "AzureRm", {
      features: {}
    });

    let rg = new ResourceGroup(this, "rg-terraform-dev-aucentraleast", {
      name: "rg-terraform-dev-aucentraleast",
      location: "australiaeast"
    });

    let vnet = new VirtualNetwork(this, "vnet1", {
      name: "network1",
      location: rg.location,
      addressSpace: ["10.0.0.0/16"],
      resourceGroupName: rg.name
    });

    let subnet = new Subnet(this, "subnet1", {
      name: "subnet1",
      resourceGroupName: rg.name,
      virtualNetworkName: vnet.name,
      addressPrefixes: ["10.0.0.0/24"]
    });

    let network_interface = new NetworkInterface(this, "nic", {
      name: "nic1",
      resourceGroupName: rg.name,
      location: rg.location,
      ipConfiguration: [{
        name: "internal",
        subnetId: subnet.id,
        privateIpAddressAllocation: "Dynamic"
      }]
    });

    new LinuxVirtualMachine(this, 'vm1', {
      name: "vm1",
      resourceGroupName: rg.name,
      adminUsername: "testuser",
      size: "Standard_F2",
      location: rg.location,
      networkInterfaceIds: [
        network_interface.id
      ],
      osDisk: {
        caching: "ReadWrite",
        storageAccountType: "Standard_LRS",
      },
      disablePasswordAuthentication: true,
      sourceImageReference: {
        publisher: "Canonical",
        offer: "UbuntuServer",
        sku: "16.04-LTS",
        version: "latest"
      },
    });
    //Define resources here
  }
}

const app = new App();
new VmStack(app, "azure-vm");
app.synth();
