export const handler = async (event: any) => {
  console.log("Validate event:", event);

  if (!event.orderId) {
    throw new Error("Missing orderId");
  }
  if (!event.amount) {
    throw new Error("Missing amount");
  }

  return {
    isValid: true,
    ...event,
  };
};
