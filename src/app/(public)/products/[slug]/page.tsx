type PageProps = {
  params: Promise<{ slug: string }>;
};

const page = async ({ params }: PageProps) => {
  const { slug } = await params;
  return <div>Product: {slug}</div>;
};

export default page;
