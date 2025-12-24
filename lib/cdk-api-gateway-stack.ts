// cdk-api-gateway-stack.ts
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as path from "path";

export class CdkApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //TableV2 could be used as for cli v2.
    const table = new dynamodb.Table(this, "ItemDynoTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "ItemDynoTable",
    });

    // get lambda main function
    const getLambda = new NodejsFunction(this, "ItemGetLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getToDo",
      entry: path.join(__dirname, `../function/get-to-do.ts`),
      environment: {
        MY_TABLE: table.tableName,
      },
      bundling: {
        minify: true,
      },
    });

    //PUT lambda putToDB function
    const postLambda = new NodejsFunction(this, "ItemPostLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "postToDo",
      entry: path.join(__dirname, `../function/post-to-do.ts`),
      environment: {
        MY_TABLE: table.tableName,
      },
      bundling: {
        minify: true,
      },
    });

    table.grantReadData(getLambda);
    table.grantReadWriteData(postLambda);

    // Create REST API Gateway
    const api = new apigw.RestApi(this, "MyTodoApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: ["OPTIONS", "GET", "POST", "DELETE"],
      },
      deployOptions: { stageName: "dev" }, // explicitly set stage
    });

    // Integrate Lambda with API Gateway
    const todoResource = api.root.addResource("todo");
    todoResource.addMethod("GET", new apigw.LambdaIntegration(getLambda));
    todoResource.addMethod("POST", new apigw.LambdaIntegration(postLambda));

    new cdk.CfnOutput(this, "ItemApiUrl", {
      value: api.url ?? "undefined-url",
    });
  }
}
