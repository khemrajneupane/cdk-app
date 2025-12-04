import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class CdkVpcEc2BastionStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly bastionSecurityGroup: ec2.SecurityGroup;
  public readonly privateInstanceSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Create a VPC with specific IP ranges
    // Using 10.0.0.0/16 gives us 65,536 IP addresses
    this.vpc = new ec2.Vpc(this, "MyVPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2, // Use 2 Availability Zones for high availability

      // Subnet configuration
      subnetConfiguration: [
        {
          name: "PublicSubnet",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24, // Each subnet gets /24 = 256 addresses
        },
        {
          name: "PrivateSubnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],

      // NAT Gateway configuration (one per AZ for high availability)
      natGateways: 1, // Reduced to 1 to save costs (can increase for production)

      // Enable DNS hostnames and support for private DNS
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // 2. Create Security Groups

    // Security Group for Bastion Host
    this.bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      "BastionSecurityGroup",
      {
        vpc: this.vpc,
        description: "Security group for Bastion Host",
        allowAllOutbound: true, // Allow all outbound traffic
      }
    );

    // Allow SSH access to Bastion from anywhere (for testing)
    // In production, restrict this to specific IPs
    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH from anywhere"
    );

    // Security Group for Private EC2 Instance
    this.privateInstanceSecurityGroup = new ec2.SecurityGroup(
      this,
      "PrivateInstanceSecurityGroup",
      {
        vpc: this.vpc,
        description: "Security group for Private EC2 Instance",
        allowAllOutbound: true,
      }
    );

    // Allow SSH access only from the Bastion Security Group
    this.privateInstanceSecurityGroup.addIngressRule(
      ec2.SecurityGroup.fromSecurityGroupId(
        this,
        "BastionSGImport",
        this.bastionSecurityGroup.securityGroupId
      ),
      ec2.Port.tcp(22),
      "Allow SSH only from Bastion Host"
    );

    // 3. IMPORT YOUR EXISTING KEY PAIR
    // This assumes you already have "bastion-key-pair" created in AWS Console/CLI
    // AND you have the .pem file saved locally
    const keyPair = ec2.KeyPair.fromKeyPairName(
      this,
      "ExistingKeyPair",
      "bastion-key-pair" // This must match your existing key pair name in AWS
    );

    // 3. Create IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, "EC2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ), // For SSM Session Manager
      ],
    });

    // 5. Create Bastion Host in Public Subnet
    const bastionHost = new ec2.Instance(this, "BastionHost", {
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.bastionSecurityGroup,
      keyPair: keyPair, // Use the keyPair object here (not keyName)
      role: ec2Role,
      // Assign public IP for internet access
      associatePublicIpAddress: true,
    });

    // 6. Create Private EC2 Instance in Private Subnet
    const privateInstance = new ec2.Instance(this, "PrivateInstance", {
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.privateInstanceSecurityGroup,
      keyPair: keyPair, // Use the keyPair object here (not keyName)
      role: ec2Role,
    });

    // 7. Create a script to install and configure SSH agent forwarding on Bastion
    const bastionUserData = ec2.UserData.forLinux();
    bastionUserData.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y ec2-instance-connect openssh-clients",
      "mkdir -p /home/ec2-user/.ssh",
      "chmod 700 /home/ec2-user/.ssh",
      // Configure SSH to allow agent forwarding (for SSH hopping)
      'echo "ForwardAgent yes" >> /home/ec2-user/.ssh/config',
      'echo "StrictHostKeyChecking no" >> /home/ec2-user/.ssh/config', // Optional: disable host key checking for easier SSH
      "chown -R ec2-user:ec2-user /home/ec2-user/.ssh"
    );

    bastionHost.addUserData(bastionUserData.render());

    // 8. Create a script for Private Instance
    const privateInstanceUserData = ec2.UserData.forLinux();
    privateInstanceUserData.addCommands(
      "#!/bin/bash",
      "yum update -y",
      "yum install -y nginx",
      "systemctl start nginx",
      "systemctl enable nginx",
      'echo "<h1>Hello from Private Instance</h1>" > /usr/share/nginx/html/index.html',
      // Allow passwordless SSH from bastion by adding bastion's public key
      "mkdir -p /home/ec2-user/.ssh",
      "touch /home/ec2-user/.ssh/authorized_keys",
      "chmod 700 /home/ec2-user/.ssh",
      "chmod 600 /home/ec2-user/.ssh/authorized_keys",
      "chown -R ec2-user:ec2-user /home/ec2-user/.ssh"
    );

    privateInstance.addUserData(privateInstanceUserData.render());
    // 9. Output useful information
    new cdk.CfnOutput(this, "BastionPublicIP", {
      value: bastionHost.instancePublicIp,
      description: "Public IP of Bastion Host",
    });

    new cdk.CfnOutput(this, "BastionPublicDNS", {
      value: bastionHost.instancePublicDnsName,
      description: "Public DNS of Bastion Host",
    });

    new cdk.CfnOutput(this, "PrivateInstancePrivateIP", {
      value: privateInstance.instancePrivateIp,
      description: "Private IP of Private Instance",
    });

    new cdk.CfnOutput(this, "VPCId", {
      value: this.vpc.vpcId,
      description: "VPC ID",
    });

    new cdk.CfnOutput(this, "KeyPairName", {
      value: keyPair.keyPairName,
      description: "Name of the EC2 Key Pair being used",
    });

    new cdk.CfnOutput(this, "SSHCommandToBastion", {
      value: `ssh -i "bastion-key-pair.pem" ec2-user@${bastionHost.instancePublicDnsName}`,
      description:
        "Command to SSH into Bastion Host (use your local .pem file)",
    });

    new cdk.CfnOutput(this, "SSHCommandFromBastionToPrivate", {
      value: `ssh -i ~/.ssh/bastion-key-pair.pem ec2-user@${privateInstance.instancePrivateIp}`,
      description:
        "Command to SSH from Bastion to Private Instance (requires key on bastion)",
    });

    new cdk.CfnOutput(this, "SSHWithAgentForwarding", {
      value: `ssh -A -i "bastion-key-pair.pem" ec2-user@${bastionHost.instancePublicDnsName}`,
      description:
        "SSH with agent forwarding (then ssh to private IP without key)",
    });

    new cdk.CfnOutput(this, "OneLineSSHToPrivate", {
      value: `ssh -o "ProxyCommand ssh -W %h:%p -i bastion-key-pair.pem ec2-user@${bastionHost.instancePublicDnsName}" -i bastion-key-pair.pem ec2-user@${privateInstance.instancePrivateIp}`,
      description: "Single command to SSH to private instance via bastion",
    });
  }
}
