import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
export interface LambdaStackProps extends cdk.StackProps {
  targetBucket: s3.Bucket;
}

export class CdkCrossStackLambda extends cdk.Stack {
  public readonly helloLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    this.helloLambda = new NodejsFunction(this, "HelloLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../function/lambda-write-to-s3.ts"),
      handler: "handler",
      environment: {
        BUCKET_NAME: props.targetBucket.bucketName,
      },
    });
    // Grant permissions
    props.targetBucket.grantReadWrite(this.helloLambda);

    // ✅ Output Lambda function name and ARN
    new cdk.CfnOutput(this, "HelloLambdaName", {
      value: this.helloLambda.functionName,
      description: "Name of Lambda writing to S3",
    });

    new cdk.CfnOutput(this, "HelloLambdaARN", {
      value: this.helloLambda.functionArn,
      description: "ARN of Lambda writing to S3",
    });
  }
}
