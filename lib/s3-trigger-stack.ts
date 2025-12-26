import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
// aws-sns is used to create an SNS topic where notifications will be published
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
/**a feature that allows you to receive automatic alerts when specific actions occur within an S3 bucket. It enables developers to build event-driven architectures where an S3 activity (like an upload) triggers workflow without the need for manual polling */
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
// aws-sns-subscriptions is equired to send SNS notifications to email addresses

export class S3TriggerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //  Lets create a deletable S3 Bucket, like always.
    const bucket = new s3.Bucket(this, "UploadBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    // Lets create SNS Topic, It creates a message broadcast channel in AWS called an SNS Topic. Think of it as a notification group. We will be able to see this in SNS console later. For now lets just instantiate a sns topic.
    const topic = new sns.Topic(this, "UploadNotificationTopic", {
      displayName: "S3 Upload Notifications",
    });

    //  Like always, lets initialise NodejsFunction instance that will run our actual lambda function.
    const s3TriggerLambda = new NodejsFunction(this, "S3TriggerLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../function/s3-trigger-lambda.ts"),
      handler: "handler",
      environment: {
        TOPIC_ARN: topic.topicArn,
      },
    });
    // Now, let's subscribe email addresses to the SNS topic.
    // If we want to send notifications to multiple emails, we simply add them to an array.
    const emails = ["cdkuserkhem@gmail.com"];
    // we can loop through the email list
    emails.forEach((email) => {
      // add subscription email
      topic.addSubscription(new sns_subscriptions.EmailSubscription(email));
    });
    // Each email address must confirm the subscription once. Once we deploy, this email should receive a subscription confirmation email.

    // Grant Lambda permission to read bucket
    bucket.grantRead(s3TriggerLambda); // s3 is now, allowed to invoke lambda
    // Grant Lambda publish permission to the sns topic.
    topic.grantPublish(s3TriggerLambda);

    // 3️⃣ Add S3 event notification

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(s3TriggerLambda), // here destination for this s3 notification event is, sent to Lambda function, so s3TriggerLambda can capture this notification in it event parameter. So, lambda knows which Bucket, which file, what event, etc.
      //      {
      //   "Records": [
      //     {
      //       "eventSource": "aws:s3",
      //       "eventName": "ObjectCreated:Put",
      //       "s3": {
      //         "bucket": { "name": "upload-bucket" },
      //         "object": { "key": "test.txt", "size": 123 }
      //       }
      //     }
      //   ]
      // }

      { suffix: ".txt" } // “Lambda triggers only when .txt files are uploaded. This is just a filter.”
    );
    // CDK should tell AWS, when an object is created in this S3 bucket and the object key ends with .txt, invoke this Lambda function.

    // Lets create cloud formatioin Output bucket name (for easy testing)
    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });

    // And also, Output Lambda name
    new cdk.CfnOutput(this, "LambdaName", {
      value: s3TriggerLambda.functionName,
    });
  }
}
