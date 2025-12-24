import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";

export class CdkIAMgroupPolicyAccessS3 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Two S3 Buckets
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

    // Two IAM Groups
    const developerGroup = new iam.Group(this, "DeveloperGroup", {
      groupName: "developer-group",
    });

    const visitorGroup = new iam.Group(this, "VisitorGroup", {
      groupName: "visitor-group",
    });

    // 3. Policy for Developer: FULL ACCESS to both buckets
    const developerFullAccessPolicy = new iam.ManagedPolicy(
      this,
      "DeveloperFullAccessPolicy",
      {
        managedPolicyName: "DeveloperFullAccessPolicy",
        statements: [
          // List permissions for both buckets
          new iam.PolicyStatement({
            actions: ["s3:ListBucket"], // bucket-level not AWS Account level so just these 2 buckets but not other buckets if exist
            resources: [readOnlyBucket.bucketArn, fullAccessBucket.bucketArn],
          }),
          // Full object access for these 2 buckets
          new iam.PolicyStatement({
            actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
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
    // Let's create Policy for Visitor: Can see bucket names but NOT contents
    //
    const visitorBucketViewPolicy = new iam.ManagedPolicy(
      this,
      "VisitorBucketViewPolicy",
      {
        managedPolicyName: "VisitorBucketViewPolicy",
        statements: [
          // Can list ALL buckets in account (see bucket names only)
          new iam.PolicyStatement({
            actions: ["s3:ListAllMyBuckets"], // AWS Account level so all buckets
            resources: ["*"], // Required to be "*" for ListAllMyBuckets
          }),
        ],
      }
    );

    //

    //
    // Attach policies to groups
    //
    visitorGroup.addManagedPolicy(visitorBucketViewPolicy);
    developerGroup.addManagedPolicy(developerFullAccessPolicy);

    //
    // 4. IAM Users
    //
    const developerUser = new iam.User(this, "DeveloperUser", {
      userName: "developer-user",
      password: cdk.SecretValue.unsafePlainText("DevloperUser#1234"),
      passwordResetRequired: false,
    });

    const visitorUser = new iam.User(this, "VisitorUser", {
      userName: "visitor-user",
      password: cdk.SecretValue.unsafePlainText("VisitorUser#1234"),
      passwordResetRequired: false,
    });

    //
    // 5. Assign Users to Groups
    //
    developerUser.addToGroup(developerGroup);
    visitorUser.addToGroup(visitorGroup);

    const developerAccessKey = new iam.CfnAccessKey(
      this,
      "DeveloperAccessKey",
      {
        userName: developerUser.userName,
      }
    );

    const visitorAccessKey = new iam.CfnAccessKey(this, "VisitorAccessKey", {
      userName: visitorUser.userName,
    });

    new cdk.CfnOutput(this, "DeveloperAccessKeyId", {
      value: developerAccessKey.ref,
    });

    new cdk.CfnOutput(this, "DeveloperSecretAccessKey", {
      value: developerAccessKey.attrSecretAccessKey,
    });

    new cdk.CfnOutput(this, "VisitorAccessKeyId", {
      value: visitorAccessKey.ref,
    });

    new cdk.CfnOutput(this, "VisitorSecretAccessKey", {
      value: visitorAccessKey.attrSecretAccessKey,
    });
  }
}
