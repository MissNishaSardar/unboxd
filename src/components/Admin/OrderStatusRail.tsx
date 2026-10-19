import {
  CheckIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  getEstimatedDelivery,
  getOrderFlowStepStates,
  isOrderStatus,
  type OrderStepState,
} from "@/lib/orders/status";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ADMIN_CANCEL_REASON_LABELS,
  CANCEL_REASON_LABELS,
} from "@/lib/zodSchema";

type OrderStatusRailProps = {
  status: string;
  createdAt: string;
  statusUpdatedAt: string | null;
  deliveryDays: number;
  customerId: string;
  cancellation: {
    adminCancelReason: string | null;
    reason: string | null;
    note: string | null;
    cancelledAt: string | null;
    cancelledBy: string | null;
  } | null;
};

const metaChip =
  "border-border/80 bg-muted/50 text-muted-foreground rounded-full border px-2.5 py-1 text-xs";

const isReached = (step: OrderStepState) => step.completed || step.current;

const stripShell =
  "flex flex-wrap items-center gap-2.5 rounded-2xl border px-4 py-3";

const getCancelReasonLabel = (
  cancellation: NonNullable<OrderStatusRailProps["cancellation"]>,
) => {
  if (
    cancellation.adminCancelReason != null &&
    cancellation.adminCancelReason in ADMIN_CANCEL_REASON_LABELS
  ) {
    return ADMIN_CANCEL_REASON_LABELS[
      cancellation.adminCancelReason as keyof typeof ADMIN_CANCEL_REASON_LABELS
    ];
  }
  if (
    cancellation.reason != null &&
    cancellation.reason in CANCEL_REASON_LABELS
  ) {
    return CANCEL_REASON_LABELS[
      cancellation.reason as keyof typeof CANCEL_REASON_LABELS
    ];
  }
  return "No reason given";
};

const OrderStatusRail = ({
  status,
  createdAt,
  statusUpdatedAt,
  deliveryDays,
  customerId,
  cancellation,
}: OrderStatusRailProps) => {
  const steps = getOrderFlowStepStates(status);
  const showEta = status === "CONFIRMED" || status === "SHIPPED";
  const eta = getEstimatedDelivery(new Date(createdAt), deliveryDays);
  const isUnknown = !isOrderStatus(status);

  const terminalStrip = () => {
    if (status === "CANCELLED" && cancellation) {
      const byCustomer = cancellation.cancelledBy === customerId;
      const reason = getCancelReasonLabel(cancellation);
      const when =
        cancellation.cancelledAt ? formatDate(cancellation.cancelledAt) : null;

      return (
        <div
          className={cn(
            stripShell,
            "border-destructive/40 bg-destructive/[0.06] dark:bg-destructive/10",
          )}>
          <XCircleIcon
            aria-hidden="true"
            className="text-destructive size-4 shrink-0"
          />
          <span className="text-destructive text-sm font-semibold">
            {byCustomer ?
              "Cancelled by the customer"
            : "Cancelled by the store"}
          </span>
          <span className="text-muted-foreground basis-full text-xs sm:min-w-0 sm:flex-1">
            {[reason, when].filter(Boolean).join(" · ")}
          </span>
          {cancellation.note && (
            <span className="text-muted-foreground basis-full text-xs">
              {cancellation.note}
            </span>
          )}
        </div>
      );
    }

    if (status === "RETURNED") {
      return (
        <div
          className={cn(
            stripShell,
            "border-violet-500/40 bg-violet-500/[0.06] dark:bg-violet-500/10",
          )}>
          <RotateCcwIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-violet-600 dark:text-violet-400"
          />
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            Returned
          </span>
          <span className="text-muted-foreground basis-full text-xs sm:min-w-0 sm:flex-1">
            {[
              "Order came back to the store",
              statusUpdatedAt ? `on ${formatDate(statusUpdatedAt)}` : null,
            ]
              .filter(Boolean)
              .join(" ")}
          </span>
        </div>
      );
    }

    if (isUnknown) {
      return (
        <div className={cn(stripShell, "border-border bg-muted/40")}>
          <TriangleAlertIcon
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0"
          />
          <span className="text-sm font-semibold">Unrecognised status</span>
          <span className="text-muted-foreground basis-full text-xs sm:min-w-0 sm:flex-1">
            {status}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order progress</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        <ol
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          }}>
          {steps.map((step, index) => {
            const StepIcon = step.config.icon;
            const reached = isReached(step);
            const previous = index > 0 ? steps[index - 1] : undefined;
            const prevReached = previous ? isReached(previous) : false;
            const connectorClass = (filled: boolean) =>
              cn(
                "h-0.5 flex-1 rounded-full",
                filled ? "bg-primary" : "bg-border",
              );

            return (
              <li
                key={step.step}
                aria-current={step.current ? "step" : undefined}
                className="flex flex-col items-center gap-2">
                <div className="flex w-full items-center">
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className={connectorClass(prevReached)}
                    />
                  )}
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                      step.completed &&
                        "bg-primary text-primary-foreground border-transparent",
                      step.current &&
                        "border-primary bg-primary/10 text-primary ring-primary/20 ring-4",
                      !step.completed &&
                        !step.current &&
                        "border-border bg-card text-muted-foreground",
                    )}>
                    {step.completed ?
                      <CheckIcon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    : <StepIcon
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    }
                  </span>
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={connectorClass(step.completed)}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-center text-[11px] leading-tight sm:text-xs",
                    step.current && "text-primary font-semibold",
                    step.completed && !step.current && "font-medium",
                    !reached && "text-muted-foreground",
                  )}>
                  {step.config.label}
                </span>
              </li>
            );
          })}
        </ol>

        {(showEta || statusUpdatedAt) && (
          <div className="flex flex-wrap items-center gap-2">
            {showEta && (
              <span
                className={cn(metaChip, "text-amber-700 dark:text-amber-400")}>
                Estimated delivery by {formatDate(eta)}
              </span>
            )}
            {statusUpdatedAt && (
              <span className={metaChip}>
                Updated {formatDate(statusUpdatedAt)}
              </span>
            )}
          </div>
        )}

        {terminalStrip()}
      </CardContent>
    </Card>
  );
};

export default OrderStatusRail;
