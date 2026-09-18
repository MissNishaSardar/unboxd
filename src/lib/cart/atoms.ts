import { atom, getDefaultStore } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type CartItem = {
  productId: string;
  sku: string;
  slug: string;
  name: string;
  variantName: string;
  price: number;
  mrp: number;
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

export const cartAtom = atomWithStorage<CartItem[]>("cart-v4", [], storage, {
  getOnInit: true,
});

export const cartCountAtom = atom((get) =>
  get(cartAtom).reduce((sum, item) => sum + item.quantity, 0),
);

export const cartTotalAtom = atom((get) =>
  get(cartAtom).reduce((sum, item) => sum + item.price * item.quantity, 0),
);

export const cartSavingsAtom = atom((get) =>
  get(cartAtom).reduce(
    (sum, item) =>
      sum + Math.max(0, (item.mrp ?? item.price) - item.price) * item.quantity,
    0,
  ),
);

export const cartDrawerOpenAtom = atom(false);

const store = getDefaultStore();

export const openCart = () => {
  store.set(cartDrawerOpenAtom, true);
};

export function updateQuantity(
  productId: string,
  sku: string,
  quantity: number,
) {
  store.set(cartAtom, (items) =>
    items.map((item) =>
      item.productId === productId && item.sku === sku ?
        { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock)) }
      : item,
    ),
  );
}

export function removeCartItem(productId: string, sku: string) {
  store.set(cartAtom, (items) =>
    items.filter((item) => item.productId !== productId || item.sku !== sku),
  );
}

export function clearCart() {
  store.set(cartAtom, []);
}

export type AddToCartInput = {
  productId: string;
  sku: string;
  slug: string;
  name: string;
  variantName: string;
  price: number;
  mrp: number;
  image: string;
  maxStock: number;
};

export function addToCart(input: AddToCartInput) {
  store.set(cartAtom, (items) => {
    const existing = items.find(
      (item) => item.productId === input.productId && item.sku === input.sku,
    );
    if (existing) {
      return items.map((item) =>
        item.productId === input.productId && item.sku === input.sku ?
          { ...item, quantity: Math.min(item.quantity + 1, item.maxStock) }
        : item,
      );
    }
    return [...items, { ...input, quantity: 1 }];
  });
  openCart();
}

export function addManyToCart(
  inputs: (AddToCartInput & { quantity?: number })[],
) {
  if (inputs.length === 0) return;
  store.set(cartAtom, (items) => {
    const next = [...items];
    for (const input of inputs) {
      const quantity = Math.min(
        Math.max(1, input.quantity ?? 1),
        input.maxStock,
      );
      const index = next.findIndex(
        (item) => item.productId === input.productId && item.sku === input.sku,
      );
      if (index >= 0) {
        const existing = next[index];
        next[index] = {
          ...existing,
          quantity: Math.min(existing.quantity + quantity, existing.maxStock),
        };
      } else {
        next.push({
          productId: input.productId,
          sku: input.sku,
          slug: input.slug,
          name: input.name,
          variantName: input.variantName,
          price: input.price,
          mrp: input.mrp,
          image: input.image,
          maxStock: input.maxStock,
          quantity,
        });
      }
    }
    return next;
  });
  openCart();
}

export function setManyToCart(
  inputs: (AddToCartInput & { quantity?: number })[],
) {
  if (inputs.length === 0) return;
  store.set(cartAtom, (items) => {
    const next = [...items];
    for (const input of inputs) {
      const quantity = Math.min(
        Math.max(1, input.quantity ?? 1),
        input.maxStock,
      );
      const index = next.findIndex(
        (item) => item.productId === input.productId && item.sku === input.sku,
      );
      if (index >= 0) {
        const existing = next[index];
        next[index] = {
          ...existing,
          price: input.price,
          mrp: input.mrp,
          image: input.image,
          maxStock: input.maxStock,
          quantity: Math.min(quantity, input.maxStock),
        };
      } else {
        next.push({
          productId: input.productId,
          sku: input.sku,
          slug: input.slug,
          name: input.name,
          variantName: input.variantName,
          price: input.price,
          mrp: input.mrp,
          image: input.image,
          maxStock: input.maxStock,
          quantity,
        });
      }
    }
    return next;
  });
}
