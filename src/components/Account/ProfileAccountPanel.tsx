"use client";

import { LockIcon, MapPinIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import type { ProfileView } from "@/server/user/profile";
import type { UserAddressData } from "@/server/user/addresses";
import type { AddressMode } from "@/components/Address/AddressesManager";
import AddressesManager from "@/components/Address/AddressesManager";
import ProfileSummary from "@/components/Profile/ProfileSummary";
import ChangePasswordForm from "@/components/Settings/ChangePasswordForm";
import { Card } from "@/components/shadcnui/card";
import { Button } from "@/components/shadcnui/button";
import { cn } from "@/lib/utils";

const EYEBROW =
  "flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

const TABS = [
  { id: "security", label: "Security", icon: LockIcon },
  { id: "addresses", label: "Addresses", icon: MapPinIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

const AddressesTab = ({
  initialAddresses,
}: {
  initialAddresses: UserAddressData[];
}) => {
  const [mode, setMode] = useState<AddressMode>("list");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={EYEBROW}>
          <MapPinIcon
            className="text-primary size-3.5"
            aria-hidden
          />
          Delivery addresses
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setMode("add")}
          className="rounded-full px-3.5 text-xs shadow-xs">
          <PlusIcon
            className="size-3.5"
            aria-hidden
          />
          Add address
        </Button>
      </div>
      <div className="mt-3.5">
        <AddressesManager
          initialAddresses={initialAddresses}
          mode={mode}
          onModeChange={setMode}
          hideInlineAdd
        />
      </div>
    </div>
  );
};

// Merged account card for /myprofile: identity hero, edit save strip, and
// the Security and Addresses zones behind a segmented strip.
const ProfileAccountPanel = ({
  view,
  initialAddresses,
}: {
  view: ProfileView;
  initialAddresses: UserAddressData[];
}) => {
  const [tab, setTab] = useState<TabId>("security");

  return (
    <Card className="border-border relative overflow-hidden py-0">
      <span
        aria-hidden
        className="bg-primary/20 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
      />
      <div className="relative">
        {/* Identity hero, save strip renders inside edit mode */}
        <ProfileSummary
          view={view}
          variant="user"
        />

        {/* Segmented zones */}
        <div className="px-6 pt-4 pb-5 sm:px-10">
          <div
            role="tablist"
            aria-label="Account sections"
            className="border-border bg-muted inline-flex gap-0.5 rounded-full border p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                aria-controls={`account-panel-${item.id}`}
                onClick={() => setTab(item.id)}
                className={cn(
                  "focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
                  tab === item.id ?
                    "bg-card text-foreground ring-border shadow-sm ring-1"
                  : "text-muted-foreground hover:text-foreground",
                )}>
                <item.icon
                  className="size-3.5"
                  aria-hidden
                />
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-4">
            {tab === "security" ?
              <section
                id="account-panel-security"
                aria-label="Security, reset your password">
                <ChangePasswordForm />
              </section>
            : <section
                id="account-panel-addresses"
                aria-label="Delivery addresses">
                <AddressesTab initialAddresses={initialAddresses} />
              </section>
            }
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileAccountPanel;
