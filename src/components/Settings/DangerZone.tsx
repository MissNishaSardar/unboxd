"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { deleteAccount } from "@/server/user/deleteAccount";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { toast } from "@/components/shadcnui/toast";

const DangerZone = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteAccount();
      if (!result.ok) {
        const message =
          result.error === "ADMIN_PROTECTED" ?
            "Admin accounts cannot be deleted from settings."
          : result.error === "FORBIDDEN" ?
            "You must be signed in to delete your account."
          : result.error === "ALREADY_DELETED" ? "Account already deactivated."
          : "Failed to delete account. Try again.";
        toast.add({
          title: "Deletion failed",
          description: message,
          type: "error",
        });
        setLoading(false);
        return;
      }

      toast.add({
        title: "Account deleted",
        description: "Your account has been deactivated. Signing out…",
        type: "success",
      });

      // Sign out and redirect to home — clears session cookie
      try {
        await authClient.signOut();
      } catch {
        // ignore signOut errors, still redirect
      }
      router.push("/");
      router.refresh();
    } catch {
      toast.add({
        title: "Deletion failed",
        description: "An unexpected error occurred.",
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/40 bg-destructive/[0.03] dark:bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <TriangleAlertIcon
              className="size-4"
              aria-hidden="true"
            />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently deactivate your account. This action cannot be undone
            from settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-muted-foreground text-sm">
              Your account will be soft-deleted, sessions revoked, and you will
              be signed out. Orders are retained.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setOpen(true)}
            className="shrink-0 self-start sm:self-auto">
            Delete account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!loading) setOpen(value);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate your account and sign you out immediately.
              You will not be able to sign in again without admin assistance.
              Your orders will remain in our records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}>
              {loading && (
                <Loader2Icon
                  className="animate-spin"
                  data-icon="inline-start"
                  aria-hidden="true"
                />
              )}
              {loading ? "Deleting…" : "Yes, delete my account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DangerZone;
