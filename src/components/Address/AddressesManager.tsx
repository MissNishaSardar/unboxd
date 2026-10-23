"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react";
import AddressCard from "@/components/Address/AddressCard";
import AddressForm from "@/components/Address/AddressForm";
import { Button } from "@/components/shadcnui/button";
import { toast } from "@/components/shadcnui/toast";
import { withMinDelay } from "@/lib/minDelay";
import {
  createUserAddress,
  deleteUserAddress,
  getUserAddresses,
  setDefaultUserAddress,
  updateUserAddress,
  type UserAddressData,
} from "@/server/user/addresses";

export type AddressMode = "list" | "add" | "edit";

type AddressValues = {
  label?: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
};

type AddressesManagerProps = {
  initialAddresses: UserAddressData[];
  mode?: AddressMode;
  onModeChange?: (mode: AddressMode) => void;
  hideInlineAdd?: boolean;
};

const AddressesManager = ({
  initialAddresses,
  mode,
  onModeChange,
  hideInlineAdd,
}: AddressesManagerProps) => {
  const [addresses, setAddresses] =
    useState<UserAddressData[]>(initialAddresses);
  const [innerMode, setInnerMode] = useState<AddressMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const isControlled = mode !== undefined;
  const currentMode = isControlled ? mode : innerMode;

  const changeMode = (next: AddressMode) => {
    if (!isControlled) setInnerMode(next);
    onModeChange?.(next);
  };

  const handleAdd = async (values: AddressValues) => {
    const result = await withMinDelay(createUserAddress(values));
    if (!result.ok) {
      toast.add({
        title: "Couldn't save the address",
        description: "Please check the fields and try again.",
        type: "error",
      });
      return;
    }
    if (result.duplicate) {
      // The save converged to an existing row. When the row is already in
      // local state, show the list directly. Otherwise it came from another
      // tab or session, so refetch to pick it up.
      if (addresses.some((a) => a.id === result.id)) {
        changeMode("list");
        toast.add({ title: "Address already saved", type: "info" });
        return;
      }
      try {
        setAddresses(await getUserAddresses());
        changeMode("list");
        toast.add({ title: "Address already saved", type: "info" });
      } catch {
        // Refresh failed but the twin still exists server side. Stay in add
        // mode so the form keeps the typed values and can be retried.
        toast.add({
          title: "Couldn't refresh addresses",
          description: "Please try again in a moment.",
          type: "error",
        });
      }
      return;
    }
    setAddresses((prev) => [
      {
        id: result.id,
        label: values.label?.trim() ? values.label.trim() : null,
        name: values.name,
        phone: values.phone,
        addressLine: values.addressLine,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        isDefault: prev.length === 0,
      },
      ...prev,
    ]);
    changeMode("list");
    toast.add({ title: "Address saved", type: "success" });
  };

  const handleEdit = async (values: AddressValues) => {
    if (!editingId) return;
    const result = await withMinDelay(updateUserAddress(editingId, values));
    if (!result.ok) {
      if (result.error === "DUPLICATE") {
        // Keep the edit form open so the typed values survive.
        toast.add({
          title: "This matches another saved address",
          description: "Change the details or cancel the edit.",
          type: "info",
        });
        return;
      }
      toast.add({
        title: "Couldn't update the address",
        description: "Please check the fields and try again.",
        type: "error",
      });
      return;
    }
    setAddresses((prev) =>
      prev.map((address) =>
        address.id === editingId ?
          {
            ...address,
            label: values.label?.trim() ? values.label.trim() : null,
            name: values.name,
            phone: values.phone,
            addressLine: values.addressLine,
            city: values.city,
            state: values.state,
            pincode: values.pincode,
          }
        : address,
      ),
    );
    setEditingId(null);
    changeMode("list");
    toast.add({ title: "Address updated", type: "success" });
  };

  const handleDelete = async (id: string) => {
    const snapshot = addresses;
    setAddresses((prev) => {
      const remaining = prev.filter((address) => address.id !== id);
      const removed = prev.find((address) => address.id === id);
      if (removed?.isDefault && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }
      return remaining;
    });
    const result = await deleteUserAddress(id);
    if (!result.ok) {
      setAddresses(snapshot);
      toast.add({
        title: "Couldn't delete the address",
        description: "Please try again.",
        type: "error",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    const snapshot = addresses;
    setAddresses((prev) =>
      prev.map((address) => ({ ...address, isDefault: address.id === id })),
    );
    const result = await setDefaultUserAddress(id);
    if (!result.ok) {
      setAddresses(snapshot);
      toast.add({
        title: "Couldn't set the default address",
        description: "Please try again.",
        type: "error",
      });
    }
  };

  if (currentMode === "add") {
    return (
      <AddressForm
        submitLabel="Save address"
        onSubmit={handleAdd}
        onCancel={() => changeMode("list")}
      />
    );
  }

  if (currentMode === "edit" && editingId) {
    const target = addresses.find((a) => a.id === editingId);
    return (
      <AddressForm
        defaultValues={
          target ? { ...target, label: target.label ?? undefined } : undefined
        }
        submitLabel="Save address"
        onSubmit={handleEdit}
        onCancel={() => {
          setEditingId(null);
          changeMode("list");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {addresses.length === 0 ?
        <p className="text-muted-foreground text-sm">
          No saved addresses yet. Add one to speed up checkout.
        </p>
      : addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            actions={
              <>
                {!address.isDefault && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-icon="inline-start"
                    onClick={() => void handleSetDefault(address.id)}>
                    <StarIcon aria-hidden="true" />
                    Set default
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-icon="inline-start"
                  onClick={() => {
                    setEditingId(address.id);
                    changeMode("edit");
                  }}>
                  <PencilIcon aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-icon="inline-start"
                  className="hover:text-destructive"
                  onClick={() => void handleDelete(address.id)}>
                  <Trash2Icon aria-hidden="true" />
                  Delete
                </Button>
              </>
            }
          />
        ))
      }
      {!hideInlineAdd && (
        <Button
          type="button"
          variant="outline"
          data-icon="inline-start"
          onClick={() => changeMode("add")}
          className="w-fit">
          <PlusIcon aria-hidden="true" />
          Add new address
        </Button>
      )}
    </div>
  );
};

export default AddressesManager;
