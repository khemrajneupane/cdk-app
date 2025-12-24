import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";

export class CdkFirstS3stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Simple, safe S3 bucket
    const bucket = new Bucket(this, "TutorialBucket", {
      bucketName: `cdk-tutorials-demo-bucket-${cdk.Aws.ACCOUNT_ID}`,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Output the bucket name to terminal after deployment
    new cdk.CfnOutput(this, "BucketNameOutput", {
      value: bucket.bucketName,
      description: "The name of the S3 bucket created by this stack",
      exportName: "TutorialBucketName",
    });

    // Optional: Output the bucket ARN
    new cdk.CfnOutput(this, "BucketArnOutput", {
      value: bucket.bucketArn,
      description: "The ARN of the S3 bucket",
      exportName: "TutorialBucketArn",
    });
  }
}
