import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";

export class CdkIAMgroupPolicyAccessS3 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //
    // 0. Two S3 Buckets
    //
    const readOnlyBucket = new s3.Bucket(this, "ReadOnlyBucket", {
      bucketName: "my-readonly-bucket-example-khem",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const fullAccessBucket = new s3.Bucket(this, "FullAccessBucket", {
      bucketName: "my-fullaccess-bucket-example-khem",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    //
    // 1. IAM Groups
    //
    const developerGroup = new iam.Group(this, "DeveloperGroup", {
      groupName: "developer-group",
    });

    const testerGroup = new iam.Group(this, "TesterGroup", {
      groupName: "tester-group",
    });

    //
    // 2. Policy for Tester: Can see bucket names but NOT contents
    //
    const testerBucketViewPolicy = new iam.ManagedPolicy(
      this,
      "TesterBucketViewPolicy",
      {
        managedPolicyName: "TesterBucketViewPolicy",
        statements: [
          // Can list ALL buckets in account (see bucket names only)
          new iam.PolicyStatement({
            actions: ["s3:ListAllMyBuckets"],
            resources: ["*"], // Required to be "*" for ListAllMyBuckets
          }),

          // Remove this if you don't want tester to see bucket contents list
          /* new iam.PolicyStatement({
            actions: ["s3:ListBucket"],
            resources: [
              readOnlyBucket.bucketArn,
              fullAccessBucket.bucketArn
            ],
          }),*/
        ],
      }
    );

    //
    // 3. Policy for Developer: FULL ACCESS to both buckets
    //
    const developerFullAccessPolicy = new iam.ManagedPolicy(
      this,
      "DeveloperFullAccessPolicy",
      {
        managedPolicyName: "DeveloperFullAccessPolicy",
        statements: [
          // List permissions for both buckets
          new iam.PolicyStatement({
            actions: ["s3:ListBucket"],
            resources: [readOnlyBucket.bucketArn, fullAccessBucket.bucketArn],
          }),
          // Full object access for both buckets
          new iam.PolicyStatement({
            actions: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
              "s3:GetObjectVersion",
              "s3:DeleteObjectVersion",
              "s3:PutObjectAcl",
              "s3:GetObjectAcl",
              "s3:PutObjectTagging",
              "s3:GetObjectTagging",
              "s3:DeleteObjectTagging",
            ],
            resources: [
              `${readOnlyBucket.bucketArn}/*`,
              `${fullAccessBucket.bucketArn}/*`,
            ],
          }),
          // Also allow listing all buckets (optional)
          new iam.PolicyStatement({
            actions: ["s3:ListAllMyBuckets"],
            resources: ["*"],
          }),
        ],
      }
    );

    //
    // Attach policies to groups
    //
    testerGroup.addManagedPolicy(testerBucketViewPolicy);
    developerGroup.addManagedPolicy(developerFullAccessPolicy);

    //
    // 4. IAM Users
    //
    const developerUser = new iam.User(this, "DeveloperUser", {
      userName: "developer-user",
      password: cdk.SecretValue.unsafePlainText("DevloperUser#1234"),
      passwordResetRequired: false,
    });

    const testerUser = new iam.User(this, "TesterUser", {
      userName: "tester-user",
      password: cdk.SecretValue.unsafePlainText("TestUser#1234"),
      passwordResetRequired: false,
    });

    //
    // 5. Assign Users to Groups
    //
    developerUser.addToGroup(developerGroup);
    testerUser.addToGroup(testerGroup);

    //
    // 6. Access Keys and Outputs (keep as is)
    //
    const developerAccessKey = new iam.CfnAccessKey(
      this,
      "DeveloperAccessKey",
      {
        userName: developerUser.userName,
      }
    );

    const testerAccessKey = new iam.CfnAccessKey(this, "TesterAccessKey", {
      userName: testerUser.userName,
    });

    new cdk.CfnOutput(this, "DeveloperAccessKeyId", {
      value: developerAccessKey.ref,
    });

    new cdk.CfnOutput(this, "DeveloperSecretAccessKey", {
      value: developerAccessKey.attrSecretAccessKey,
    });

    new cdk.CfnOutput(this, "TesterAccessKeyId", {
      value: testerAccessKey.ref,
    });

    new cdk.CfnOutput(this, "TesterSecretAccessKey", {
      value: testerAccessKey.attrSecretAccessKey,
    });
  }
}
