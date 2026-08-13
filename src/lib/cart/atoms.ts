import { atom } from "jotai";
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
