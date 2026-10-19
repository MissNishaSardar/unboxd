import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserAddresses } from "@/server/user/addresses";
import AddressesManager from "@/components/Address/AddressesManager";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

export const metadata: Metadata = {
  title: "Saved Addresses",
  description: "Manage your saved delivery addresses.",
};

const AddressesPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/auth/login?callbackUrl=/myprofile/addresses");

  const addresses = await getUserAddresses();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Saved addresses
          </h1>
          <p className="text-muted-foreground text-sm">
            Used to prefill checkout, auto-saved from your orders.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/myprofile" />}
          nativeButton={false}
          data-icon="inline-start">
          <ArrowLeftIcon aria-hidden="true" />
          Profile
        </Button>
      </div>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Addresses</CardTitle>
          <CardDescription>
            Add, edit, or remove delivery addresses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddressesManager initialAddresses={addresses} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressesPage;
