import type { Metadata } from "next";
import prisma from "@/lib/dbClient/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findFirst({
    where: { slug, deletedAt: null },
    select: { name: true },
  });
  const name = category?.name ?? slug.replaceAll("-", " ");
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  return {
    title,
    description: `Browse ${title} products on Unboxd.`,
  };
}

const page = async ({ params }: PageProps) => {
  const { slug } = await params;
  return <div>Category: {slug}</div>;
};

export default page;
