type PageProps = {
  params: Promise<{ id: string }>;
};

const page = async ({ params }: PageProps) => {
  const { id } = await params;
  return <div>Order: {id}</div>;
};

export default page;
