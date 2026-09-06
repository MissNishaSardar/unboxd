import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/shadcnui/accordion";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  PackageIcon,
  RotateCcwIcon,
  TruckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Unboxd, our mission, and why we unbox electronics differently.",
};

const whyItems = [
  {
    icon: BadgeCheckIcon,
    title: "Authentic and warranted",
    description:
      "Genuine products with verified variants. Snapshot pricing keeps orders honest.",
    href: "/policies/warranty",
  },
  {
    icon: TruckIcon,
    title: "Cash on delivery",
    description:
      "Pay when it arrives. Quick dispatch, tracked to your door. Free shipping over threshold.",
    href: "/policies/shipping",
  },
  {
    icon: RotateCcwIcon,
    title: "Easy returns",
    description:
      "If it is not right, returns are simple. Customer first, every time.",
    href: "/policies/returns",
  },
] as const;

const steps = [
  {
    n: "01",
    title: "Place your order",
    description:
      "Choose variant and address. Stock is checked atomically, order is created as CONFIRMED. No prepaid hold.",
  },
  {
    n: "02",
    title: "We dispatch",
    description:
      "Packed within 24 hours. Track the move from CONFIRMED to SHIPPED in Orders with live status.",
  },
  {
    n: "03",
    title: "Inspect at your door",
    description:
      "Open the box with the courier. Check color, storage, build. Snapshot pricing means no last minute surprise.",
  },
  {
    n: "04",
    title: "Pay on delivery",
    description:
      "Happy, hand cash to the courier. That is the whole payment step. Free shipping over threshold.",
  },
] as const;

const faqs = [
  {
    q: "What payment methods do you accept?",
    a: "Cash on Delivery only. Pay when the order arrives at your door. No prepaid step, no gateway fees. Free shipping when your subtotal crosses the threshold.",
  },
  {
    q: "How does Cash on Delivery work?",
    a: "Place your order with a shipping address, we confirm stock inside a transaction and create the order as CONFIRMED. You inspect on delivery, then pay the courier.",
  },
  {
    q: "How much is shipping and how long is delivery?",
    a: "Flat rate below the free shipping threshold, free above it. Most orders ship within 24 hours and arrive in 2 to 5 business days depending on your pincode.",
  },
  {
    q: "Can I return or exchange a product?",
    a: "Yes. If something is not right, request a return from your Orders page. We handle RETURNED status explicitly, restock the variant, and guide you through exchange or refund.",
  },
  {
    q: "Are products genuine and under warranty?",
    a: "All products are genuine and sourced from verified brands. Warranty is as per the brand. Your order snapshots price and name at purchase, so receipts stay accurate.",
  },
  {
    q: "What if something's out of stock?",
    a: "Every product has variants by color, storage, or size. Stock lives on the variant and is decremented atomically at checkout with a WHERE stock >= quantity guard. If a variant is out of stock, checkout stops before the order is created.",
  },
  {
    q: "How do I track my order?",
    a: "Sign in and open Orders, then select your order to see status, timeline, address, items, and totals. Status moves from CONFIRMED to SHIPPED to DELIVERED.",
  },
] as const;

const AboutPage = () => {
  return (
    <div className="flex flex-col gap-20">
      <section className="relative overflow-hidden rounded-3xl border border-white/10">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1920&q=80"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-900/75 to-zinc-900/30"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent"
          />
        </div>
        <div className="relative flex flex-col items-start gap-6 px-6 py-16 md:px-12 md:py-24">
          <Badge
            variant="secondary"
            className="border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/15">
            About Unboxd
          </Badge>
          <h1 className="font-heading max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Delivering Tomorrow&apos;s Tech, Today
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-zinc-200">
            Curated phones, laptops, audio, and accessories with live variant
            stock and cash on delivery. The future, ready to unbox.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              render={<Link href="/products" />}
              nativeButton={false}
              data-icon="inline-end">
              Shop products
              <ArrowRightIcon aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/contact" />}
              nativeButton={false}
              className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white">
              Contact us
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-label="Milestones"
        className="bg-foreground text-background rounded-2xl px-6 py-8 md:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          <div className="text-center">
            <div className="font-heading text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
              12k+
            </div>
            <div className="text-background/60 mt-1 text-xs font-medium tracking-wide uppercase">
              Orders delivered
            </div>
          </div>
          <div className="text-center">
            <div className="font-heading text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
              4.8/5
            </div>
            <div className="text-background/60 mt-1 text-xs font-medium tracking-wide uppercase">
              Average rating
            </div>
          </div>
          <div className="text-center">
            <div className="font-heading text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
              25+
            </div>
            <div className="text-background/60 mt-1 text-xs font-medium tracking-wide uppercase">
              Brands partnered
            </div>
          </div>
          <div className="text-center">
            <div className="font-heading text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
              3+
            </div>
            <div className="text-background/60 mt-1 text-xs font-medium tracking-wide uppercase">
              Years curating tech
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Why Unboxd
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Three values, each links to its policy.
          </p>
        </div>
        <div className="border-border divide-border divide-y border-y">
          {whyItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex items-start gap-4 py-7 md:gap-6 md:py-9">
              <item.icon
                aria-hidden="true"
                className="text-primary mt-0.5 size-6 shrink-0"
              />
              <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-8">
                <h3 className="font-heading shrink-0 text-[15px] leading-tight font-medium md:w-48">
                  {item.title}
                </h3>
                <p className="text-muted-foreground max-w-xl flex-1 text-sm leading-relaxed md:text-right">
                  {item.description}
                </p>
              </div>
              <ArrowRightIcon
                aria-hidden="true"
                className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            What we believe
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Too many stores sell everything. We sell fewer things, better
            chosen. Each product has variants with real stock counts and
            snapshot pricing on orders, so what you buy is what we have.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            COD keeps it honest. You inspect on delivery, then you pay. Free
            shipping over threshold, atomically decremented stock, no oversell.
          </p>
        </div>
        <Card
          withGradient
          className="p-6">
          <CardHeader className="px-0">
            <div className="bg-muted text-primary flex size-10 items-center justify-center rounded-lg">
              <PackageIcon
                aria-hidden="true"
                className="size-5"
              />
            </div>
            <CardTitle>Built for the transaction that matters</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <p className="text-muted-foreground text-sm leading-relaxed">
              From product detail with variant switching to COD checkout inside
              a transaction, the store is built to be correct before it is
              clever.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Built for cash on delivery. Order, dispatch, inspect, then pay.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.n}
              className="border-border bg-card flex flex-col rounded-2xl border p-6">
              <div className="bg-primary text-primary-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
                {step.n}
              </div>
              <h3 className="font-heading mt-4 text-base leading-tight font-medium">
                {step.title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Questions we hear a lot. Still curious, reach out via contact.
          </p>
        </div>
        <Accordion className="border-border bg-card rounded-2xl border px-6">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.q}
              value={faq.q}>
              <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="border-border bg-card relative overflow-hidden rounded-3xl border px-6 py-14 text-center md:py-20">
        <div
          aria-hidden
          className="bg-primary/20 pointer-events-none absolute -bottom-32 left-1/2 size-96 -translate-x-1/2 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to unbox?
          </h2>
          <p className="text-muted-foreground max-w-md">
            Browse the catalog. Pick a variant. Pay on delivery.
          </p>
          <Button
            size="lg"
            render={<Link href="/products" />}
            nativeButton={false}
            data-icon="inline-end">
            Shop the catalog
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
