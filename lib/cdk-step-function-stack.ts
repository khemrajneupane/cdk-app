import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sf from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class CdkStepFunctionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Step 1
    const step1 = new NodejsFunction(this, "Step1Lambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../function/step-functions/step1.ts"),
      handler: "handler",
    });

    // Lambda Step 2
    const step2 = new NodejsFunction(this, "Step2Lambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../function/step-functions/step2.ts"),
      handler: "handler",
    });

    // Lambda Step 3
    const step3 = new NodejsFunction(this, "Step3Lambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../function/step-functions/step3.ts"),
      handler: "handler",
    });

    // Step Functions tasks
    const task1 = new tasks.LambdaInvoke(this, "Invoke Step1 Lambda", {
      lambdaFunction: step1,
      outputPath: "$.Payload",
    });

    const task2 = new tasks.LambdaInvoke(this, "Invoke Step2 Lambda", {
      lambdaFunction: step2,
      outputPath: "$.Payload",
    });

    const task3 = new tasks.LambdaInvoke(this, "Invoke Step3 Lambda", {
      lambdaFunction: step3,
      outputPath: "$.Payload",
    });

    // Chain tasks
    const definition = task1.next(task2).next(task3);

    // Create state machine
    const machine = new sf.StateMachine(this, "MyStateMachine", {
      definition,
      timeout: cdk.Duration.minutes(5),
    });

    new cdk.CfnOutput(this, "StateMachineArn", {
      value: machine.stateMachineArn,
    });
  }
}
