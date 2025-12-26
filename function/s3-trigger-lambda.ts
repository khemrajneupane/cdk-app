import { S3Event } from "aws-lambda";
// It provides TypeScript types for the S3 event payload received by Lambda.

// lets import aws-sdk so that our lambda function can talk to AWS services like SNS
import * as AWS from "aws-sdk";

// Lets initialise SNS object from AWS service.
const sns = new AWS.SNS();

// Lets create actual lambda, this time in handler way:
export const handler = async (event: S3Event) => {
  // This event will be the event emitted by s3 bucket. This event will be a JSON object with Records.

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

  // We can actually log this entire event for your understanding.
  console.log("Incoming event:", JSON.stringify(event, null, 2));
  //Lets print out some of the event values like eventName, bucket name, etc.
  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;
    const eventName = record.eventName;

    console.log("Event name:", eventName);
    console.log("Bucket:", bucketName);
    console.log("Object key:", objectKey);

    // Lets prepare a message for the sending to the subscriber email.
    const message = `S3 Event: ${eventName}\nBucket: ${bucketName}\nObject: ${objectKey}`;
    // Now using the instance of sns, lets publish send or publish email.
    await sns
      .publish({
        TopicArn: process.env.TOPIC_ARN!,
        Message: message,
        Subject: "New S3 File Uploaded",
      })
      .promise();
  }

  return {
    statusCode: 200,
    message: "S3 event processed and notification sent",
  };
};
