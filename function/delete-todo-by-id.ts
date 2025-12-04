import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: any) => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return { statusCode: 400, body: "Missing id" };
    }

    await client.send(
      new DeleteItemCommand({
        TableName: process.env.TABLE_NAME!,
        Key: { id: { S: id } },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Item ${id} deleted` }),
    };
  } catch (err: any) {
    return { statusCode: 500, body: err.message };
  }
};
