import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({});

export const handler = async (event: any) => {
  console.log("S3 Event received:", JSON.stringify(event, null, 2));

  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  console.log(`Processing file: ${key}`);

  // Optionally read the file (just for testing)
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  console.log("File metadata:", response.Metadata);

  return {
    statusCode: 200,
    message: `Processed file ${key}`,
  };
};
