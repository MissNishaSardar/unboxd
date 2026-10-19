import { CheckIcon } from "lucide-react";
import { getOrderStepStates } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

const OrderTimeline = ({ status }: { status: string }) => {
  const steps = getOrderStepStates(status);

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const stepConfig = step.config;
        const StepIcon = stepConfig.icon;
        const isLast = index === steps.length - 1;
        const isDestructive =
          step.terminal && stepConfig.badgeVariant === "destructive";

        return (
          <li
            key={step.step}
            aria-current={step.current ? "step" : undefined}
            className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border",
                  step.completed &&
                    "bg-primary text-primary-foreground border-transparent",
                  step.current &&
                    !isDestructive &&
                    "border-primary bg-primary/10 text-primary",
                  step.current &&
                    isDestructive &&
                    "border-destructive bg-destructive/10 text-destructive",
                  !step.completed &&
                    !step.current &&
                    "border-border text-muted-foreground",
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
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-px flex-1",
                    step.completed ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className="flex flex-col gap-0.5 pb-6">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.current && !isDestructive && "text-primary",
                  step.current && isDestructive && "text-destructive",
                  !step.completed && !step.current && "text-muted-foreground",
                )}>
                {stepConfig.label}
              </p>
              {step.current && (
                <p className="text-muted-foreground text-xs">
                  {step.terminal ? "Order closed" : "Current status"}
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
