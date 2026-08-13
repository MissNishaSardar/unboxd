import { atom, getDefaultStore } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type CartItem = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantName: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
};

const storage = createJSONStorage<CartItem[]>(() =>
  typeof window !== "undefined" ?
    window.localStorage
  : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
);

export const cartAtom = atomWithStorage<CartItem[]>("cart", [], storage, {
  getOnInit: true,
});

export const cartCountAtom = atom((get) =>
  get(cartAtom).reduce((sum, item) => sum + item.quantity, 0),
);

export const cartTotalAtom = atom((get) =>
  get(cartAtom).reduce((sum, item) => sum + item.price * item.quantity, 0),
);

export const cartDrawerOpenAtom = atom(false);

export const FREE_SHIPPING_THRESHOLD = 999;

const store = getDefaultStore();

export const openCart = () => {
  store.set(cartDrawerOpenAtom, true);
};

export function updateQuantity(
  productId: string,
  variantId: string,
  quantity: number,
) {
  store.set(cartAtom, (items) =>
    items.map((item) =>
      item.productId === productId && item.variantId === variantId ?
        { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock)) }
      : item,
    ),
  );
}

export function removeCartItem(productId: string, variantId: string) {
  store.set(cartAtom, (items) =>
    items.filter(
      (item) => item.productId !== productId || item.variantId !== variantId,
    ),
  );
}

export function clearCart() {
  store.set(cartAtom, []);
}

export type AddToCartInput = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantName: string;
  price: number;
  image: string;
  maxStock: number;
};

export function addToCart(input: AddToCartInput) {
  store.set(cartAtom, (items) => {
    const existing = items.find(
      (item) =>
        item.productId === input.productId &&
        item.variantId === input.variantId,
    );
    if (existing) {
      return items.map((item) =>
        (
          item.productId === input.productId &&
          item.variantId === input.variantId
        ) ?
          { ...item, quantity: Math.min(item.quantity + 1, item.maxStock) }
        : item,
      );
    }
    return [...items, { ...input, quantity: 1 }];
  });
  openCart();
}
