"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BanIcon,
  LockIcon,
  RotateCcwIcon,
  ShieldIcon,
  ShieldOffIcon,
  TriangleAlertIcon,
  UnlockIcon,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  banUser,
  deactivateUser,
  reactivateUser,
  setUserRole,
  unbanUser,
  type AdminUserActionResult,
} from "@/server/admin/user-actions";
import { banUserSchema, banUserInputType, banUserType } from "@/lib/zodSchema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { Button } from "@/components/shadcnui/button";
import { Card } from "@/components/shadcnui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { toast } from "@/components/shadcnui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";

type UserDetailActionsProps = {
  user: {
    id: string;
    name: string;
    role: string;
    banned: boolean;
    deletedAt: string | null;
  };
  currentUserId: string;
  /** Admin identity slot, rendered into the merged card */
  children?: ReactNode;
};

const PILL_BUTTON = "rounded-full px-3.5 text-xs";

const handleResult = (
  result: AdminUserActionResult,
  successTitle: string,
): boolean => {
  if (result.ok) {
    toast.add({ title: successTitle, type: "success" });
    return true;
  }
  const titles: Record<string, string> = {
    SELF_ACTION: "You cannot modify your own account",
    LAST_ADMIN: "At least one active admin required",
    ALREADY_DEACTIVATED: "User already deactivated",
    FORBIDDEN: "Only admins can do that",
    INVALID_INPUT: "Invalid input",
    NOT_FOUND: "No such user",
  };
  toast.add({
    title: titles[result.error] ?? "Something went wrong",
    type: "error",
  });
  return false;
};

// Merged management card on /admin/users/[id]: identity slot on the left,
// account control pills on the right, and an isolated strip for the
// deactivated state. Self view shows the identity alone, per the approved
// design.
const UserDetailActions = ({
  user,
  currentUserId,
  children,
}: UserDetailActionsProps) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const isSelf = user.id === currentUserId;
  const isDeactivated = user.deletedAt !== null;

  const { handleSubmit, control, reset, formState } = useForm<
    banUserInputType,
    undefined,
    banUserType
  >({
    resolver: zodResolver(banUserSchema),
    defaultValues: { reason: "", expiryDays: undefined },
    mode: "all",
  });

  const runAction = async (
    action: () => Promise<AdminUserActionResult>,
    successTitle: string,
  ) => {
    setIsPending(true);
    const result = await action();
    setIsPending(false);
    if (handleResult(result, successTitle)) {
      router.refresh();
    }
  };

  const onBanSubmit = async (values: banUserType) => {
    setIsPending(true);
    const result = await banUser(user.id, {
      ...(values.reason ? { reason: values.reason } : {}),
      ...(values.expiryDays ? { expiryDays: values.expiryDays } : {}),
    });
    setIsPending(false);
    if (handleResult(result, "User banned")) {
      setBanOpen(false);
      reset();
      router.refresh();
    }
  };

  const controls = (
    <div className="min-w-0">
      <span className="text-muted-foreground flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.12em] uppercase">
        <LockIcon
          className="text-primary size-3.5"
          aria-hidden
        />
        Account controls
      </span>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className={PILL_BUTTON}
          disabled={isPending || isSelf}
          onClick={() =>
            runAction(
              () =>
                setUserRole(user.id, user.role === "admin" ? "user" : "admin"),
              user.role === "admin" ?
                "User demoted to customer"
              : "User promoted to admin",
            )
          }>
          {user.role === "admin" ?
            <ShieldOffIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
          : <ShieldIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
          }
          {user.role === "admin" ? "Demote to customer" : "Promote to admin"}
        </Button>

        {user.banned ?
          <Button
            variant="outline"
            size="sm"
            className={PILL_BUTTON}
            disabled={isPending || isSelf}
            onClick={() =>
              runAction(() => unbanUser(user.id), "User unbanned")
            }>
            <UnlockIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
            Unban
          </Button>
        : <Button
            variant="outline"
            size="sm"
            className={PILL_BUTTON}
            disabled={isPending || isSelf}
            onClick={() => setBanOpen(true)}>
            <BanIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
            Ban
          </Button>
        }
      </div>
    </div>
  );

  const strip =
    isDeactivated ?
      <div className="border-border bg-muted/40 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3">
        <RotateCcwIcon
          className="text-primary size-4 shrink-0"
          aria-hidden
        />
        <span className="text-sm font-semibold">Reactivate</span>
        <span className="text-muted-foreground min-w-0 flex-1 text-xs">
          Restores sign in for this account, everything returns as before
          deactivation
        </span>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => setDeactivateOpen(true)}
          className="rounded-full px-4">
          Reactivate account
        </Button>
      </div>
    : <div className="dark:bg-destructive/10 border-destructive/40 bg-destructive/[0.06] flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3">
        <TriangleAlertIcon
          className="text-destructive size-4 shrink-0"
          aria-hidden
        />
        <span className="text-destructive text-sm font-semibold">
          Deactivate
        </span>
        <span className="text-muted-foreground min-w-0 flex-1 text-xs">
          Blocks sign in and revokes sessions, historical orders stay in
          records, reversible later
        </span>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => setDeactivateOpen(true)}
          className="rounded-full px-4">
          Deactivate account
        </Button>
      </div>;

  if (isSelf) {
    return (
      <Card
        className="border-border relative overflow-hidden py-0"
        data-print-hidden>
        <span
          aria-hidden
          className="bg-primary/20 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
        />
        <div className="relative px-6 py-6">{children}</div>
      </Card>
    );
  }

  return (
    <Card
      className="border-border relative overflow-hidden py-0"
      data-print-hidden>
      <span
        aria-hidden
        className="bg-primary/20 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
      />
      <div className="relative">
        <div className="grid gap-6 px-6 pt-6 pb-2 lg:grid-cols-[minmax(280px,420px)_minmax(320px,1fr)] lg:items-center lg:gap-10">
          {children}
          {controls}
        </div>
        <div className="px-6 pt-4 pb-6">{strip}</div>
      </div>

      {/* Ban dialog with optional reason and expiry in days */}
      <Dialog
        open={banOpen}
        onOpenChange={(open) => {
          if (!isPending) {
            setBanOpen(open);
            if (!open) reset();
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban {user.name}</DialogTitle>
            <DialogDescription>
              Blocking sign-in and revoking sessions immediately.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onBanSubmit)}
            noValidate>
            <FieldGroup>
              <Controller
                name="reason"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ban-reason">
                      Reason, optional
                    </FieldLabel>
                    <Input
                      {...field}
                      id="ban-reason"
                      type="text"
                      placeholder="Spamming"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="expiryDays"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ban-expiry">
                      Expiry in days, optional, 1 to 30
                    </FieldLabel>
                    <Input
                      {...field}
                      id="ban-expiry"
                      type="number"
                      value={(field.value as number | string | undefined) ?? ""}
                      min={1}
                      max={30}
                      placeholder="Permanent when empty"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBanOpen(false)}
                disabled={formState.isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={formState.isSubmitting}>
                Ban user
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate and reactivate confirmation */}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          if (!isPending) setDeactivateOpen(open);
        }}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {isDeactivated ? "Reactivate" : "Deactivate"} {user.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeactivated ?
              "This will restore the account and allow login again."
            : "This deactivates the account and blocks login. Historical orders are preserved. You can reactivate later."
            }
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={isDeactivated ? "default" : "destructive"}
              onClick={async () => {
                if (isDeactivated) {
                  await runAction(
                    () => reactivateUser(user.id),
                    "User reactivated",
                  );
                } else {
                  await runAction(
                    () => deactivateUser(user.id),
                    "User deactivated",
                  );
                }
                setDeactivateOpen(false);
              }}
              disabled={isPending}>
              {isDeactivated ? "Reactivate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UserDetailActions;
