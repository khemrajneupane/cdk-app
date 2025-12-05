# CDK-App Project

## Overview

This repository contains multiple AWS infrastructure stacks defined with AWS CDK (TypeScript).  
It demonstrates a variety of AWS services and CDK features, including: IAM, S3, VPC, EC2, API Gateway / Lambda, Step Functions, SQS, and optionally a CI/CD pipeline.

The goal is to showcase real-world infrastructure design, best practices (least privilege, clean teardown), and CDK fluency.

### Included Stacks

| Stack name                                                                 | Purpose / Resources                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CdkIAMgroupPolicyAccessS3`                                                | IAM users & groups example: custom policies, S3 bucket permissions (read-only and full-access buckets), user-group management.                                                                                                                                                                                                                                                                                                                                                                       |
| `CdkVpcEc2BastionStack`                                                    | This stack provisions a complete VPC networking environment including a Bastion Host and a Private EC2 Instance. It demonstrates secure access patterns, SSH tunneling via a Bastion, private subnet isolation, NAT routing, SSM integration, and EC2 user-data automation for real-world infrastructure setups. / Resources: VPC, Subnets, NAT Gateway, Bastion EC2 Instance, Private EC2 Instance, Security Groups, IAM Role, Key Pair (imported), User Data scripts, SSM permissions, VPC Outputs |
| `CdkAppStack`                                                              | Implements a fully serverless TODO-style application backend using AWS Lambda, API Gateway, and DynamoDB.                                                                                                                                                                                                                                                                                                                                                                                            |
| `CdkAppWebsiteS3Stack`                                                     | Provide a simple, low-cost static website hosting solution using Amazon S3. The stack demonstrates how to serve a static website, automate asset deployment, and expose the public website URL. Ideal for showcasing S3 website hosting basics and deployment workflows.                                                                                                                                                                                                                             |
| `CdkCrossStackReferenceS3`, `CdkCrossStackLambda`, `S3TriggerStack`, etc.  | Demonstrate cross-stack references, event-driven architecture (S3 events → Lambda), and modular design.                                                                                                                                                                                                                                                                                                                                                                                              |
| `CDKApiStack`                                                              | API backend (e.g. Lambda + API Gateway) architecture example.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `CdkSqsFanoutStack`, `CdkStepFunctionStack`, `CdkStepFnRestApiDynamoStack` | Examples of messaging, fan-out patterns (SQS), serverless workflows (Step Functions, DynamoDB, REST APIs).                                                                                                                                                                                                                                                                                                                                                                                           |
| `CdkPipelineStack`                                                         | CI/CD pipeline using CDK Pipelines / CodePipeline / GitHub (with CodeStar connection or Secrets Manager) to automate deployment when code is pushed.                                                                                                                                                                                                                                                                                                                                                 |

> **Note:** You might not deploy all stacks at once — you can pick relevant stacks (for testing or demonstration) to avoid excessive AWS resource usage or cost. If using the pipeline: deploy only the pipeline stack:
>
> ```bash
> cdk deploy CdkPipelineStack
> ```

```

This modular structure helps separate concerns (networking, IAM, compute, pipeline), enabling maintainability and reuse. :contentReference[oaicite:1]{index=1}
```

## How to Deploy / Test Locally

Assuming you already have AWS credentials configured (e.g., via AWS CLI or environment variables):

```bash
# 1. Install dependencies
npm install

# 2. (One-time) Bootstrap your AWS environment if not done before
cdk bootstrap

# 3. List all stacks
cdk ls

# 4. Synth — generates CloudFormation templates
cdk synth

# 5. Deploy a stack (example: IAM + S3)
cdk deploy CdkIAMgroupPolicyAccessS3

# 6. When done — destroy to clean up resources
cdk destroy CdkIAMgroupPolicyAccessS3



## 🔁 CI/CD Pipeline

If you enable the pipeline stack:

Use a CodeStar connection ARN or GitHub token in Secrets Manager — do not commit secrets.

Once connected and deployed, any push to the configured branch (e.g. main) triggers cdk synth → cdk deploy automatically.

AWS resources created by pipeline are manageable and removable — pipeline and its deployed stacks can be torn down using `cdk destroy CdkPipelineStack `.
```
