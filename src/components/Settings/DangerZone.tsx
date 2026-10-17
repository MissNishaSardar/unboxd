"use client";

import { useRouter } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { withMinDelay } from "@/lib/minDelay";
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
import { toast } from "@/components/shadcnui/toast";

const DangerZone = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await withMinDelay(deleteAccount());
      if (!result.ok) {
        const message =
          result.error === "ADMIN_PROTECTED" ?
            "Admin accounts cannot delete their own account."
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
        description: "Your account has been deactivated. Signing out.",
        type: "success",
      });

      // Sign out and redirect to home, clears session cookie
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
      {/* Slim destructive strip, visually isolated from editable data */}
      <div className="border-destructive/40 bg-destructive/[0.06] dark:bg-destructive/10 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3">
        <span className="text-destructive flex items-center gap-2">
          <TriangleAlertIcon
            className="size-4 shrink-0"
            aria-hidden
          />
          <span className="text-sm font-semibold">Danger Zone</span>
        </span>
        <span className="text-muted-foreground min-w-0 flex-1 text-xs">
          Deactivate permanently, sessions revoke, orders retained
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-full px-4">
          Delete account
        </Button>
      </div>

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
              {loading ? "Deleting" : "Yes, delete my account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DangerZone;
