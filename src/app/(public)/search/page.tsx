import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search the Unboxd catalog for phones, laptops, audio, and accessories.",
};

const page = () => {
  return <div>Search</div>;
};

export default page;
