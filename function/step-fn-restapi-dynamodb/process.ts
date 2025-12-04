export const handler = async (event: any) => {
  console.log("Process event:", event);

  return {
    ...event,
    processedAt: new Date().toISOString(),
    status: "PROCESSED",
  };
};
