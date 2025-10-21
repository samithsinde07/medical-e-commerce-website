import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import OrderTimeline from "@/components/OrderTimeline";
import { Package, FileText, ShoppingCart, User } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { useCart } from "@/contexts/CartContext";

const Dashboard = () => {
  const { user, userRole, loading } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [prescriptionCount, setPrescriptionCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && userRole && userRole !== "user") {
      navigate(userRole === "pharmacist" ? "/pharmacist" : "/admin");
    } else if (user && userRole === "user") {
      fetchOrders();
      fetchPrescriptions();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(() => {
        fetchOrders();
        fetchPrescriptions();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user, userRole, loading, navigate]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            product:products (name, price)
          ),
          prescription:prescriptions (status)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchPrescriptions = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from("prescriptions")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      if (error) throw error;
      setPrescriptionCount(count || 0);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">My Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="hover:shadow-[var(--glow-shadow)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">Total orders placed</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--glow-shadow)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prescriptionCount}</div>
              <p className="text-xs text-muted-foreground">Uploaded prescriptions</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--glow-shadow)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cartItems.length}</div>
              <p className="text-xs text-muted-foreground">Items in cart</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--glow-shadow)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Complete</div>
              <p className="text-xs text-muted-foreground">Profile status</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <p className="text-muted-foreground text-center py-8">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders yet. Start shopping!</p>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id} className="border-2">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Order #{order.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Payment: <span className={`capitalize ${
                              order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'
                            }`}>{order.payment_status}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">
                            {formatINR(order.total_amount)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <OrderTimeline status={order.status} />
                      
                      <div className="space-y-2 pt-4">
                        <p className="font-medium text-sm">Items:</p>
                        {order.order_items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.product.name} x {item.quantity}</span>
                            <span>{formatINR(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {order.prescription && (
                        <div className="pt-2 border-t">
                          <p className="text-sm">
                            <span className="font-medium">Prescription Status: </span>
                            <span className={`capitalize ${
                              order.prescription.status === 'approved' ? 'text-green-600' :
                              order.prescription.status === 'rejected' ? 'text-red-600' :
                              'text-amber-600'
                            }`}>
                              {order.prescription.status}
                            </span>
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Delivery Address:</span>
                          <br />
                          {order.delivery_address}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
