import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";

type ProfileHeroProps = {
  name: string;
  image: string | null;
  initials: string;
  editHref?: string;
};

const ProfileHero = ({
  name,
  image,
  initials,
  editHref = "/settings/edit",
}: ProfileHeroProps) => {
  return (
    <Card
      withGradient
      className="border-border bg-card">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Avatar, clean, no banner overlap */}
          <div className="bg-muted border-border flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-sm md:size-24">
            {image ?
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={`${name} avatar`}
                width={96}
                height={96}
                className="size-full object-cover"
              />
            : <span className="text-muted-foreground text-lg font-semibold md:text-xl">
                {initials || "?"}
              </span>
            }
          </div>

          {/* User name stacked above the edit action */}
          <h2 className="font-heading max-w-md text-lg font-semibold tracking-tight text-balance md:text-xl">
            {name}
          </h2>
          <Button
            variant="outline"
            size="sm"
            render={
              <Link
                href={editHref as never}
                aria-label="Edit profile"
              />
            }
            nativeButton={false}>
            <PencilIcon
              data-icon="inline-start"
              aria-hidden="true"
            />
            Edit profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHero;
