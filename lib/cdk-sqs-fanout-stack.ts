import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class CdkSqsFanoutStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1️⃣ SQS Queue
    const queue = new sqs.Queue(this, "TaskQueue", {
      queueName: "TaskQueue",
      visibilityTimeout: Duration.seconds(30),
    });

    // 2️⃣ Worker Lambda (triggered by SQS)
    const workerLambda = new NodejsFunction(this, "WorkerLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../function/sqs/worker.ts"),
      handler: "handler",
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
    });

    // Connect SQS → Worker Lambda
    workerLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, {
        batchSize: 10,
      })
    );

    // 3️⃣ Sender Lambda (sends messages to SQS)
    const senderLambda = new NodejsFunction(this, "SenderLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../function/sqs/sender.ts"),
      handler: "handler",
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
    });

    // Permission for sender to send messages
    queue.grantSendMessages(senderLambda);
  }
}
