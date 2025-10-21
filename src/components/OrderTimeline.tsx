import { CheckCircle, Clock, Truck, Package, Home } from "lucide-react";

interface OrderTimelineProps {
  status: "pending" | "approved" | "processing" | "shipped" | "delivered" | "cancelled";
}

const OrderTimeline = ({ status }: OrderTimelineProps) => {
  const steps = [
    { key: "pending", label: "Order Placed", icon: Clock, emoji: "🕒" },
    { key: "approved", label: "Approved", icon: CheckCircle, emoji: "✅" },
    { key: "processing", label: "Processing", icon: Package, emoji: "📦" },
    { key: "shipped", label: "Shipped", icon: Truck, emoji: "🚚" },
    { key: "delivered", label: "Delivered", icon: Home, emoji: "📦" },
  ];

  const statusOrder = ["pending", "approved", "processing", "shipped", "delivered"];
  const currentIndex = statusOrder.indexOf(status);

  if (status === "cancelled") {
    return (
      <div className="flex items-center justify-center p-4 bg-destructive/10 rounded-lg">
        <p className="text-destructive font-medium">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className="relative flex items-center w-full">
                {index > 0 && (
                  <div
                    className={`absolute right-1/2 top-1/2 -translate-y-1/2 h-0.5 w-full ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground shadow-lg"
                      : "border-muted bg-background text-muted-foreground"
                  } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                >
                  <span className="text-xl">{step.emoji}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-1/2 top-1/2 -translate-y-1/2 h-0.5 w-full ${
                      index < currentIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
              <p
                className={`mt-2 text-xs text-center ${
                  isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
