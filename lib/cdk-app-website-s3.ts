import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

export class CdkAppWebsiteS3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // below commented is another way to create s3 bucket for website hosting:
    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: "helloworld-static-website",
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      destinationBucket: websiteBucket,
      sources: [s3deploy.Source.asset(path.join(__dirname, "../website"))],
    });

    new cdk.CfnOutput(this, "WebsiteURL", {
      value: websiteBucket.bucketWebsiteUrl,
      description: "Static website URL",
    });
  }
}
