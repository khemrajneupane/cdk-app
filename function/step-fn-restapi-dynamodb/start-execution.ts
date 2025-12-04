import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const client = new SFNClient({});

export const handler = async (event: any) => {
  const body = JSON.parse(event.body);

  const res = await client.send(
    new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN!,
      input: JSON.stringify(body),
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Execution started",
      executionArn: res.executionArn,
    }),
  };
};
