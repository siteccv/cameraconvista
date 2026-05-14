export function formatPrice(price: number): string {
  if (Number.isInteger(price)) return `€ ${price}`;
  return `€ ${price.toFixed(1).replace(".", ",")}`;
}

export function formatDecimal(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(".", ",");
}

export function formatProducer(producer?: string | null): string | null {
  if (!producer) return null;
  return producer.charAt(0).toUpperCase() + producer.slice(1).toLowerCase();
}
