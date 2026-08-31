import { CheckIcon } from "lucide-react";
import { ORDER_STATUS_FLOW, getOrderStatusConfig } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

const OrderTimeline = ({ status }: { status: string }) => {
  const isTerminal = status === "CANCELLED" || status === "RETURNED";
  const currentIndex = ORDER_STATUS_FLOW.indexOf(
    status as (typeof ORDER_STATUS_FLOW)[number],
  );

  const steps = isTerminal ? [...ORDER_STATUS_FLOW, status] : ORDER_STATUS_FLOW;

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const stepConfig = getOrderStatusConfig(step);
        const StepIcon = stepConfig.icon;
        const isLast = index === steps.length - 1;
        const completed =
          isTerminal ? index < ORDER_STATUS_FLOW.length : index < currentIndex;
        const current =
          isTerminal ?
            index === ORDER_STATUS_FLOW.length
          : index === currentIndex;

        return (
          <li
            key={step}
            className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border",
                  completed &&
                    "bg-primary text-primary-foreground border-transparent",
                  current && "border-primary bg-primary/10 text-primary",
                  !completed &&
                    !current &&
                    "border-border text-muted-foreground",
                )}>
                {completed ?
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
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-px flex-1",
                    completed ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className="flex flex-col gap-0.5 pb-6">
              <p
                className={cn(
                  "text-sm font-medium",
                  current && "text-primary",
                  !completed && !current && "text-muted-foreground",
                )}>
                {stepConfig.label}
              </p>
              {current && (
                <p className="text-muted-foreground text-xs">
                  {isTerminal ? "Order closed" : "Current status"}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTimeline;
