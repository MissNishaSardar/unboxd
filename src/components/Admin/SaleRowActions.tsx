"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CircleStopIcon, CopyIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { toast } from "@/components/shadcnui/toast";
import {
  deleteSale,
  duplicateSale,
  endSaleNow,
  importLegacyBanner,
} from "@/server/deals";

const SaleRowActions = ({ id, name }: { id: string; name: string }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<{ ok: boolean }>, done: string) => {
    setBusy(true);
    try {
      const result = await fn();
      toast.add({
        title: result.ok ? done : "Something went wrong",
        type: result.ok ? "success" : "error",
      });
    } catch {
      toast.add({ title: "Something went wrong", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          render={<Link href={`/admin/deals/${id}/edit` as Route} />}
          nativeButton={false}
          variant="ghost"
          size="sm"
          aria-label={`Edit ${name}`}>
          <PencilIcon
            data-icon="inline-start"
            aria-hidden="true"
          />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => void run(() => endSaleNow(id), "Sale ended")}>
          <CircleStopIcon
            data-icon="inline-start"
            aria-hidden="true"
          />
          End now
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => void run(() => duplicateSale(id), "Sale duplicated")}>
          <CopyIcon
            data-icon="inline-start"
            aria-hidden="true"
          />
          Duplicate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}>
          <Trash2Icon
            data-icon="inline-start"
            aria-hidden="true"
          />
          Delete
        </Button>
      </div>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Past orders keep their prices. This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                void run(() => deleteSale(id), "Sale deleted");
              }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const ImportLegacyButton = () => {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        importLegacyBanner()
          .then((result) => {
            toast.add({
              title: result.ok ? "Banner moved to deals" : "Nothing to move",
              type: result.ok ? "success" : "error",
            });
          })
          .catch(() => {
            toast.add({ title: "Something went wrong", type: "error" });
          })
          .finally(() => setBusy(false));
      }}>
      Move current banner here
    </Button>
  );
};

export default SaleRowActions;
