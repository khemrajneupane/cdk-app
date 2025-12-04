import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
export class CdkCrossStackReferenceS3 extends cdk.Stack {
  public readonly websiteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    // inside stack constructor
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      destinationBucket: this.websiteBucket,
      sources: [s3deploy.Source.asset(path.join(__dirname, "../website"))],
    });
    // ✅ Output bucket name and website URL
    new cdk.CfnOutput(this, "WebsiteBucketName", {
      value: this.websiteBucket.bucketName,
      description: "S3 Bucket Name for Website",
    });

    new cdk.CfnOutput(this, "WebsiteURL", {
      value: this.websiteBucket.bucketWebsiteUrl,
      description: "Static Website URL",
    });
  }
}
