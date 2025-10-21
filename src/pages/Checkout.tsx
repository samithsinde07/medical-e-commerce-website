import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatINR } from "@/lib/currency";
import RazorpayButton from "@/components/RazorpayButton";
import { CreditCard, Smartphone, Wallet, Banknote, Upload, CheckCircle } from "lucide-react";

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, totalPrice, requiresPrescription, clearCart } = useCart();
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload PDF, JPG, or PNG files only");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setPrescriptionFile(file);
    }
  };

  const handleCheckout = async () => {
    if (!user || !deliveryAddress.trim()) {
      toast.error("Please enter delivery address");
      return;
    }

    if (requiresPrescription && !prescriptionFile) {
      toast.error("Please upload prescription for prescription medicines");
      return;
    }

    setUploading(true);
    try {
      let prescriptionId = null;

      // Upload prescription if provided
      if (prescriptionFile) {
        const fileExt = prescriptionFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('prescriptions')
          .upload(fileName, prescriptionFile);

        if (uploadError) throw uploadError;

        const { data: prescriptionData, error: prescriptionError } = await supabase
          .from('prescriptions')
          .insert({
            user_id: user.id,
            file_url: fileName,
          })
          .select()
          .single();

        if (prescriptionError) throw prescriptionError;
        prescriptionId = prescriptionData.id;
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalPrice,
          delivery_address: deliveryAddress,
          prescription_id: prescriptionId,
          status: 'pending',
          payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Store order ID for payment
      setOrderId(orderData.id);

      // If COD, complete immediately
      if (paymentMethod === 'cod') {
        await clearCart();
        toast.success("Order placed successfully!");
        navigate("/dashboard");
      }
      // For online payment, Razorpay button will handle the flow
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order");
    } finally {
      setUploading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, razorpayOrderId: string) => {
    if (!orderId) return;

    try {
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          razorpay_payment_id: paymentId,
          razorpay_order_id: razorpayOrderId,
        })
        .eq('id', orderId);

      await clearCart();
      toast.success("Payment successful! Order confirmed.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Payment update error:", error);
      toast.error("Payment successful but failed to update order");
    }
  };

  const handlePaymentError = () => {
    toast.error("Payment failed. You can retry from your orders page.");
    navigate("/dashboard");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button onClick={() => navigate("/products")} className="mt-4">
                Browse Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your complete delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {requiresPrescription && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Prescription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Your order contains prescription medicines. Please upload a valid prescription.
                    </p>
                    <Label htmlFor="prescription">Prescription File (PDF/JPG/PNG)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="prescription"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                      {prescriptionFile && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    {prescriptionFile && (
                      <p className="text-sm text-muted-foreground">
                        {prescriptionFile.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3 md:space-y-4">
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <Card className="p-3 md:p-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Banknote className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-sm md:text-base">Cash on Delivery</span>
                    </Label>
                  </div>
                </Card>
                
                <Card className="p-3 md:p-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-sm md:text-base">Credit/Debit Card</span>
                    </Label>
                  </div>
                </Card>

                <Card className="p-3 md:p-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Smartphone className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-sm md:text-base">UPI (GPay, PhonePe, Paytm)</span>
                    </Label>
                  </div>
                </Card>

                <Card className="p-3 md:p-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-sm md:text-base">Wallets</span>
                    </Label>
                  </div>
                </Card>
              </RadioGroup>
            </div>

            {!orderId ? (
              <Button
                onClick={handleCheckout}
                disabled={uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? "Processing..." : paymentMethod === 'cod' ? "Place Order" : "Continue to Payment"}
              </Button>
            ) : paymentMethod !== 'cod' ? (
              <RazorpayButton
                amount={totalPrice}
                orderId={orderId}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                disabled={uploading}
              />
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span className="font-medium">{formatINR(item.product.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatINR(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
