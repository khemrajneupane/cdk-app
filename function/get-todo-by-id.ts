import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: any) => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return { statusCode: 400, body: "Missing id in path" };
    }

    const result = await client.send(
      new GetItemCommand({
        TableName: process.env.TABLE_NAME!,
        Key: { id: { S: id } },
      })
    );

    if (!result.Item) {
      return { statusCode: 404, body: "Item not found" };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: result.Item.id.S,
        name: result.Item.name?.S,
      }),
    };
  } catch (err: any) {
    return { statusCode: 500, body: err.message };
  }
};
