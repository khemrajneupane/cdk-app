import { Stack, StackProps, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

import { RestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";

import { StateMachine, TaskInput } from "aws-cdk-lib/aws-stepfunctions";

import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as cdk from "aws-cdk-lib";
export class CdkStepFnRestApiDynamoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //
    // 1️⃣ DynamoDB Table
    //
    const table = new dynamodb.Table(this, "OrdersTable", {
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "OrdersTable",
    });

    //
    // 2️⃣ Create Lambdas
    //
    const validate = new NodejsFunction(this, "ValidateLambda", {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        "../function/step-fn-restapi-dynamodb/validate.ts"
      ),
      bundling: {
        minify: true,
        //externalModules: ["aws-sdk"],
        externalModules: [],
        //forceDockerBundling: false,
      },
    });

    const process = new NodejsFunction(this, "ProcessLambda", {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        "../function/step-fn-restapi-dynamodb/process.ts"
      ),
    });

    const save = new NodejsFunction(this, "SaveLambda", {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        "../function/step-fn-restapi-dynamodb/save.ts"
      ),
      bundling: {
        minify: true,
        //externalModules: ["aws-sdk"],
        externalModules: [],
        //forceDockerBundling: false,
      },
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const notify = new NodejsFunction(this, "NotifyLambda", {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        "../function/step-fn-restapi-dynamodb/notify.ts"
      ),
      bundling: {
        minify: true,
        //externalModules: ["aws-sdk"],
        externalModules: [],
        //forceDockerBundling: false,
      },
    });

    table.grantWriteData(save);

    //
    // 3️⃣ Step Function Tasks
    //
    const validateStep = new LambdaInvoke(this, "Validate Step", {
      lambdaFunction: validate,
      outputPath: "$.Payload",
    });

    const processStep = new LambdaInvoke(this, "Process Step", {
      lambdaFunction: process,
      outputPath: "$.Payload",
    });

    const saveStep = new LambdaInvoke(this, "Save Step", {
      lambdaFunction: save,
      outputPath: "$.Payload",
    });

    const notifyStep = new LambdaInvoke(this, "Notify Step", {
      lambdaFunction: notify,
      outputPath: "$.Payload",
    });

    validateStep.addCatch(
      notifyStep, // fallback
      { resultPath: "$.error" }
    );

    const definition = validateStep
      .next(processStep)
      .next(saveStep)
      .next(notifyStep);

    //
    // 4️⃣ Create State Machine
    //
    const machine = new StateMachine(this, "OrderWorkflow", {
      definition,
      timeout: Duration.minutes(2),
    });

    //
    // 5️⃣ API Gateway to start execution
    //
    const api = new RestApi(this, "OrderApi", {
      restApiName: "Order Service",
    });

    const startLambda = new NodejsFunction(this, "StartExecutionLambda", {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        "../function/step-fn-restapi-dynamodb/start-execution.ts"
      ),
      bundling: {
        minify: true,
        //externalModules: ["aws-sdk"],
        externalModules: [],
        //forceDockerBundling: false,
      },
      environment: {
        STATE_MACHINE_ARN: machine.stateMachineArn,
      },
    });

    machine.grantStartExecution(startLambda);

    api.root
      .addResource("orders")
      .addMethod("POST", new LambdaIntegration(startLambda));

    //
    // Outputs
    //
    new CfnOutput(this, "ApiUrl", { value: api.url! });
    new CfnOutput(this, "StateMachineArn", { value: machine.stateMachineArn });
    new CfnOutput(this, "DynamoDBTable", { value: table.tableName });
  }
}
