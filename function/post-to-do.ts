import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import { v4 as uuidv4 } from "uuid";

// Create low-level client
const client = new DynamoDBClient({});

// Create DocumentClient (easier JSON use)
const dynamo = DynamoDBDocumentClient.from(client);

const MY_TABLE = process.env.MY_TABLE!;

export async function postToDo(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is required" }),
    };
  }

  const bodyInputs = JSON.parse(event.body);
  const id = uuidv4();

  const params = {
    TableName: MY_TABLE,
    Item: {
      id,
      name: bodyInputs.name,
      location: bodyInputs.location,
      hobby: bodyInputs.hobby,
    },
  };

  await dynamo.send(new PutCommand(params));

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: "Inserted OK", id }),
  };
}
