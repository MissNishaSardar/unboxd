import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

const SECTIONS = [
  {
    title: "Products",
    description: "Manage catalog, variants, stock",
    href: "/admin/products" as const,
  },
  { title: "Orders", description: "Update order statuses (Day 10)" },
  { title: "Categories", description: "Manage category tree (Day 11)" },
  { title: "Users", description: "Roles, bans, impersonation (Day 11)" },
];

const AdminPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Signed in as {session?.user.email} ({session?.user.role})
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
              {section.href && (
                <CardAction>
                  <Button
                    render={<Link href={section.href} />}
                    nativeButton={false}
                    variant="outline"
                    size="sm">
                    Manage
                  </Button>
                </CardAction>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
