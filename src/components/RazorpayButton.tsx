import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RazorpayButtonProps {
  amount: number;
  orderId: string;
  onSuccess: (paymentId: string, razorpayOrderId: string) => void;
  onError: () => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayButton = ({ amount, orderId, onSuccess, onError, disabled }: RazorpayButtonProps) => {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway");
        onError();
        return;
      }

      // Note: For production, you would create a Razorpay order via backend
      // and get razorpay_order_id. For now, we'll simulate the flow.
      
      const options = {
        key: "rzp_test_key", // Replace with actual Razorpay key
        amount: amount * 100, // Convert to paise
        currency: "INR",
        name: "MediStore",
        description: `Order #${orderId.slice(0, 8)}`,
        order_id: orderId, // This should be Razorpay order ID from backend
        handler: function (response: any) {
          onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
          toast.success("Payment successful!");
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#0EA5E9",
        },
        modal: {
          ondismiss: function() {
            onError();
            toast.error("Payment cancelled");
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed");
      onError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className="w-full"
      size="lg"
    >
      {loading ? "Processing..." : "Pay with Razorpay"}
    </Button>
  );
};

export default RazorpayButton;
