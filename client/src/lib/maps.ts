// Link alle mappe per un indirizzo. Si usano come <a href> veri (non window.open)
// perche Google Analytics conta da solo i clic in uscita sui link.
export function mapsLinks(address: string) {
  const query = encodeURIComponent(address);
  return {
    apple: `https://maps.apple.com/?q=${query}`,
    google: `https://www.google.com/maps/search/?api=1&query=${query}`,
  };
}
