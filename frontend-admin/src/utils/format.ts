export const formatServiceRequestId = (id: string): string => {
  if (!id) return '';
  const upperId = id.toUpperCase();
  if (upperId.startsWith('SR-')) return upperId;
  return `SR-${upperId}`;
};
