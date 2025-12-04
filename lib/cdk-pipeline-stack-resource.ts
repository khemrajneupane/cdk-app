import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";

export class CdkPipelineStackResource extends cdk.Stage {
  public readonly bucketNameOutputId = "DeployedBucketName";

  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const stack = new cdk.Stack(this, "AppStack");

    const bucket = new s3.Bucket(stack, "DeployedBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new cdk.CfnOutput(stack, this.bucketNameOutputId, {
      value: bucket.bucketName,
      exportName: `${id}-${this.bucketNameOutputId}`,
    });
  }
}
