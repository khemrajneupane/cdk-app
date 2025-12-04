import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as path from "path";

export class CDKApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new Table(this, "ItemsTable", {
      tableName: "Items",
      partitionKey: { name: "id", type: AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Helper to create Lambda handlers
    const makeLambda = (name: string) =>
      new NodejsFunction(this, name, {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, `../function/${name}.ts`),
        handler: "handler",
        environment: {
          TABLE_NAME: table.tableName,
        },
      });

    const createFn = makeLambda("create-todo");
    const getByIdFn = makeLambda("get-todo-by-id");
    const listFn = makeLambda("list-todo");
    const updateFn = makeLambda("put-todo-by-id");
    const deleteFn = makeLambda("delete-todo-by-id");

    // Permissions
    table.grantReadWriteData(createFn);
    table.grantReadWriteData(getByIdFn);
    table.grantReadWriteData(listFn);
    table.grantReadWriteData(updateFn);
    table.grantReadWriteData(deleteFn);

    // API Gateway
    const api = new apigw.RestApi(this, "ItemsApi", {
      restApiName: "Items CRUD API",
      defaultCorsPreflightOptions: { allowOrigins: apigw.Cors.ALL_ORIGINS },
      deployOptions: { stageName: "dev" },
    });

    const items = api.root.addResource("items");

    // POST /items → create item
    items.addMethod("POST", new apigw.LambdaIntegration(createFn));

    // GET /items → list all items
    items.addMethod("GET", new apigw.LambdaIntegration(listFn));

    // /items/{id}
    const item = items.addResource("{id}");

    // GET /items/{id} → get item
    item.addMethod("GET", new apigw.LambdaIntegration(getByIdFn));

    // PUT /items/{id} → update item
    item.addMethod("PUT", new apigw.LambdaIntegration(updateFn));

    // DELETE /items/{id} → delete item
    item.addMethod("DELETE", new apigw.LambdaIntegration(deleteFn));

    new CfnOutput(this, "ApiUrl", {
      value: api.url,
    });

    new CfnOutput(this, "TableName", {
      value: table.tableName,
    });
  }
}
