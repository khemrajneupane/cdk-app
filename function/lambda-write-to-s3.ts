import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({});

export const handler = async () => {
  const bucket = process.env.BUCKET_NAME!;
  const key = "hello.txt";

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: "Hello from Lambda via cross-stack!",
    })
  );

  return {
    statusCode: 200,
    body: "Lambda wrote to S3: " + key,
  };
};
