import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsp from "aws-cdk-lib/aws-ecs-patterns";

export class CdkFargateDockerEcsAlb extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //
    // 1. COST-OPTIMIZED VPC (no NAT, only public subnets)
    //
    const vpc = new ec2.Vpc(this, "FargateVpc", {
      maxAzs: 2, // Required for ALB & Fargate
      natGateways: 0, // Cost optimized: disable NAT
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    //
    // 2. ECS Cluster
    //
    const cluster = new ecs.Cluster(this, "FargateCluster", {
      vpc,
      containerInsights: false,
    });

    //
    // 3. Fargate Load Balanced Service using local Dockerfile
    //
    const service = new ecsp.ApplicationLoadBalancedFargateService(
      this,
      "FargateDockerService",
      {
        cluster,
        publicLoadBalancer: true, // ALB accessible over the internet

        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset("docker-for-ecs-tasks"), // path to your Dockerfile
          containerPort: 3000,
        },

        desiredCount: 1,
        cpu: 256, // cheapest
        memoryLimitMiB: 512,
        assignPublicIp: true, // required because no NAT
      }
    );

    //
    // 4. Output ALB DNS so you can open your Hello World
    //
    new cdk.CfnOutput(this, "LoadBalancerURL", {
      value: service.loadBalancer.loadBalancerDnsName,
      description: "Public URL of the Fargate Service",
    });
  }
}
