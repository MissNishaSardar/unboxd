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
  ClockIcon,
  HelpCircleIcon,
  MailIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/Contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the Unboxd team. COD questions, order help, or product picks. We reply within 24 hours.",
};

const infoCards = [
  {
    icon: MailIcon,
    title: "Email us",
    detail: "support@unboxd.com",
    hint: "We reply within 24 hours, Mon through Sat.",
  },
  {
    icon: PhoneIcon,
    title: "Call us",
    detail: "+91 90000 00000",
    hint: "Mon through Sat, 10am to 7pm IST.",
  },
  {
    icon: MapPinIcon,
    title: "Find us",
    detail: "Bengaluru, Karnataka",
    hint: "Online only. Quick dispatch from our partner hubs.",
  },
] as const;

const ContactPage = () => {
  return (
    <div className="flex flex-col gap-20">
      <section className="relative overflow-hidden rounded-3xl border border-white/10">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80"
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
            Get in touch
          </Badge>
          <h1 className="font-heading max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            We are here to help
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-zinc-200">
            Cash on delivery questions, order issues, or picking the right
            variant. Real people, no bot queue. We read every message and reply
            within a day.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              render={<a href="#contact-form" />}
              nativeButton={false}
              data-icon="inline-end">
              Send a message
              <ArrowRightIcon aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/about" />}
              nativeButton={false}
              className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white">
              How it works
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {infoCards.map((item) => (
          <Card
            key={item.title}
            withGradient
            className="p-6">
            <CardHeader className="px-0">
              <div className="bg-muted text-primary flex size-10 items-center justify-center rounded-lg">
                <item.icon
                  aria-hidden="true"
                  className="size-5"
                />
              </div>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="text-sm font-medium">{item.detail}</div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.hint}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section
        id="contact-form"
        className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 md:p-8 lg:col-span-3">
          <CardHeader className="px-0">
            <CardTitle className="text-xl">Send us a message</CardTitle>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tell us what you need. Be as detailed as you like. We will get
              back to your inbox within 24 hours, Monday through Saturday.
            </p>
          </CardHeader>
          <CardContent className="px-0">
            <ContactForm />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="p-6">
            <CardHeader className="px-0">
              <div className="bg-muted text-primary flex size-10 items-center justify-center rounded-lg">
                <ClockIcon
                  aria-hidden="true"
                  className="size-5"
                />
              </div>
              <CardTitle>When we reply</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Messages sent before 5pm IST are usually answered the same day.
                After hours, first thing next morning. Weekends, we catch up on
                Monday.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="px-0">
              <div className="bg-muted text-primary flex size-10 items-center justify-center rounded-lg">
                <PackageIcon
                  aria-hidden="true"
                  className="size-5"
                />
              </div>
              <CardTitle>Need order help</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <p className="text-muted-foreground text-sm leading-relaxed">
                For delivery, returns, or exchanges, share your order ID and we
                will trace it end to end.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/orders" />}
                  nativeButton={false}
                  data-icon="inline-end">
                  Go to orders
                  <ArrowRightIcon aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/policies/shipping" />}
                  nativeButton={false}>
                  Shipping policy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="px-0">
              <div className="bg-muted text-primary flex size-10 items-center justify-center rounded-lg">
                <HelpCircleIcon
                  aria-hidden="true"
                  className="size-5"
                />
              </div>
              <CardTitle>Quick answers</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Accordion className="rounded-none border-0 px-0">
                <AccordionItem value="cod">
                  <AccordionTrigger className="text-left text-sm">
                    How does Cash on Delivery work
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Place your order, we check stock inside a transaction and
                    mark it CONFIRMED. You inspect at the door, then pay the
                    courier.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="returns">
                  <AccordionTrigger className="text-left text-sm">
                    Returns and warranty
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Request a return from Orders. We handle RETURNED status,
                    restock the variant, and guide refund or exchange. Warranty
                    is as per the brand.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="stock">
                  <AccordionTrigger className="text-left text-sm">
                    What if a variant is out of stock
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Stock lives on the variant and is decremented atomically
                    with a guard. If stock is not enough, checkout stops before
                    an order is created.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                render={<Link href="/about" />}
                nativeButton={false}
                data-icon="inline-end">
                Read full FAQs
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-border bg-card relative overflow-hidden rounded-3xl border px-6 py-14 text-center md:py-20">
        <div
          aria-hidden
          className="bg-primary/20 pointer-events-none absolute -bottom-32 left-1/2 size-96 -translate-x-1/2 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-4">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Still exploring
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

export default ContactPage;
