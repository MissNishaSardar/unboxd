import { atomWithStorage, createJSONStorage } from "jotai/utils";

const storage = createJSONStorage<string[]>(() =>
  typeof window !== "undefined" ?
    window.localStorage
  : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
);

export const wishlistAtom = atomWithStorage<string[]>("wishlist", [], storage, {
  getOnInit: true,
});
