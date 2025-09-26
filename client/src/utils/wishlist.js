const STORAGE_KEY = 'lakshmiworld_wishlist';

export function getWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWishlist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToWishlist(product) {
  const items = getWishlist();
  if (!items.find((p) => p.id === product.id)) {
    items.push(product);
    saveWishlist(items);
  }
  return items;
}

export function removeFromWishlist(id) {
  const items = getWishlist().filter((p) => p.id !== id);
  saveWishlist(items);
  return items;
}

export function clearWishlist() {
  saveWishlist([]);
}


