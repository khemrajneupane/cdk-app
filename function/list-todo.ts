import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async () => {
  try {
    const result = await client.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME!,
      })
    );

    const items =
      result.Items?.map((item) => ({
        id: item.id.S,
        name: item.name?.S,
      })) || [];

    return {
      statusCode: 200,
      body: JSON.stringify(items),
    };
  } catch (err: any) {
    return { statusCode: 500, body: err.message };
  }
};
