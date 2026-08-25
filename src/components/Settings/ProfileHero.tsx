import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";

type ProfileHeroProps = {
  name: string;
  image: string | null;
  initials: string;
  bio?: string | null;
};

const ProfileHero = ({ name, image, initials, bio }: ProfileHeroProps) => {
  return (
    <Card
      withGradient
      className="border-border bg-card">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Avatar — clean, no banner overlap */}
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

          {/* User info — name + bio */}
          <div className="min-w-0 flex-1">
            <h2 className="font-heading truncate text-lg font-semibold tracking-tight md:text-xl">
              {name}
            </h2>
            {bio?.trim() ?
              <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                {bio.trim()}
              </p>
            : <p className="text-muted-foreground/60 text-sm italic">
                No bio yet — tap pencil to add
              </p>
            }
          </div>

          {/* Edit — top-right header instead of avatar overlay */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            aria-label="Edit profile"
            render={
              <Link
                href={"/settings/edit" as never}
                aria-label="Edit profile"
              />
            }
            nativeButton={false}>
            <PencilIcon
              className="size-4"
              aria-hidden="true"
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHero;
