#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";

import { CdkAppWebsiteS3Stack } from "../lib/cdk-app-website-s3";
import { CdkCrossStackReferenceS3 } from "../lib/cdk-cross-stack-reference-s3";
import { CdkCrossStackLambda } from "../lib/cdk-cross-stack-lambda";
import { S3TriggerStack } from "../lib/s3-trigger-stack";
import { CDKApiStack } from "../lib/cdk-api-stack";
import { CdkSqsFanoutStack } from "../lib/cdk-sqs-fanout-stack";
import { CdkStepFunctionStack } from "../lib/cdk-step-function-stack";
import { CdkStepFnRestApiDynamoStack } from "../lib/cdk-step-fn-restapi-dynamodb";
import { CdkVpcEc2BastionStack } from "../lib/cdk-vpc-ec2-bastian-stack";
import { CdkIAMgroupPolicyAccessS3 } from "../lib/cdk-IAM-group-policy-access-s3";
import { CdkPipelineStack } from "../lib/cdk-pipeline-stack";
import { CdkFargateDockerEcsAlb } from "../lib/cdk-fargate-docker-ecs-alb";
import { CdkFirstS3stack } from "../lib/cdk-first-s3-stack";
import { CdkApiGatewayStack } from "../lib/cdk-api-gateway-stack";

const app = new cdk.App();
new CdkApiGatewayStack(app, "CdkApiGatewayStack");
new CdkAppWebsiteS3Stack(app, "CdkAppWebsiteS3Stack");

const websiteStack = new CdkCrossStackReferenceS3(
  app,
  "CdkCrossStackReferenceS3"
);

// 2️⃣ Lambda stack that writes to S3
new CdkCrossStackLambda(app, "CdkCrossStackLambda", {
  targetBucket: websiteStack.websiteBucket,
});
// lambda stack that is triggered by s3 event.
new S3TriggerStack(app, "S3TriggerStack");
// API CRUD stack...
new CDKApiStack(app, "CDKApiStack");
// sqs fanout stack to demonstrate sqs with lambda
new CdkSqsFanoutStack(app, "CdkSqsFanoutStack");

//orchestration with step functions
// AWS Console → Step Functions → MyStateMachine → Start Execution
new CdkStepFunctionStack(app, "CdkStepFunctionStack");

// Production-style microservice stack with step functions, api gateway, dynamodb, sns, sqs, etc.
new CdkStepFnRestApiDynamoStack(app, "CdkStepFnRestApiDynamoStack");

// VPC with EC2 Bastian Host complete infrastructure design.
// first ssh into bastian host ( public subnet ec2 instance) like so:
//ssh -i "bastion-key-pair.pem" ec2-user@ec2-13-53-216-18.eu-north-1.compute.amazonaws.com
//Then from bastian host in order to ssh into private instance ec2, we need to do the following things:
// create a file to hold the private key- touch bastian-key-pair, then paste the private key contents into this file from your local machine where you have saved it:
// vi bastian-key-pair- then paste the entire private key from -----BEGIN RSA PRIVATE KEY----- to end rsa private key---
// :wq to save and exit vi editor
// then do chomod 400 bastian-key-pari
// then ssh -i "bastian-key-pari" ec2-user@<private-ec2-instance-private-ip>

new CdkVpcEc2BastionStack(app, "CdkVpcEc2BastionStack");

// developer-group's users have full access to S3

// Tester group users can only list buckets but not read contents inside buckets..
new CdkIAMgroupPolicyAccessS3(app, "CdkIAMgroupPolicyAccessS3");

// CDK pipeline stack
new CdkPipelineStack(app, "CdkPipelineStack");

//Deploys a simple “Hello World” Node.js web application using a Docker image to
// AWS ECS Fargate. The stack is optimized for cost with no NAT gateways
// and minimal public subnet configuration. Demonstrates containerized
// deployment, serverless compute with ECS, and exposing the service through
// an Application Load Balancer (ALB) for HTTP access.
// Resources: VPC (public subnet), ECS Cluster, Fargate Service, Fargate Task,
// Docker image asset, Application Load Balancer (ALB)
// find the LoadBalancerURL from output or in loadbalancer console in aws and curl response should give you "Hello from ECS Fargate Docker Image!"
// or test it by pulling the ECR image locally and running it like following:
//Pulling from cdk-hnb659fss-container-assets-my-account-id-eu-north-1 -t my-docker-ect-task
// Then run it
//docker run -p 3000:3000 my-docker-ecs-task
// docker-for-ecs-tasks@1.0.0 start
//node server.js
//Server running on port 3000
new CdkFargateDockerEcsAlb(app, "CdkFargateDockerEcsAlb");

//
new CdkFirstS3stack(app, "CdkFirstS3stack");
