export const handler = async (event: any) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  if (!event.Records || !Array.isArray(event.Records)) {
    console.log("No SQS messages found. Exiting.");
    return { statusCode: 200 };
  }

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    console.log("Processing task:", body);
  }

  return { statusCode: 200 };
};
