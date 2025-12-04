import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class S3TriggerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1️⃣ S3 Bucket
    const bucket = new s3.Bucket(this, "UploadBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 2️⃣ Lambda Function
    const s3TriggerLambda = new NodejsFunction(this, "S3TriggerLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../function/s3-trigger-lambda.ts"),
      handler: "handler",
    });

    // Grant Lambda permission to read from S3
    bucket.grantRead(s3TriggerLambda);

    // 3️⃣ Add S3 event notification
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(s3TriggerLambda)
    );

    // 4️⃣ Output bucket name (for easy testing)
    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });

    // 5️⃣ Output Lambda name
    new cdk.CfnOutput(this, "LambdaName", {
      value: s3TriggerLambda.functionName,
    });
  }
}
