export const handler = async (event: any) => {
  console.log("Notifying user about order:", event.orderId);
  return {
    ...event,
    notified: true,
  };
};
