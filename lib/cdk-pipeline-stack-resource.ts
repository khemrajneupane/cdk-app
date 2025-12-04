import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";

export class CdkPipelineStackResource extends cdk.Stage {
  public readonly urlOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const websiteBucket = new s3.Bucket(this, "PipelineBucket", {
      bucketName: "bucket-created-via-cdk-pipeline",
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    new cdk.CfnOutput(this, "Pipelinebucketname", {
      value: websiteBucket.bucketName,
      description: "bucket created by cdk pipeline stack",
    });
  }
}
