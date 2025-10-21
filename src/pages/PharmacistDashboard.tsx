import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Package, CheckCircle, XCircle } from "lucide-react";
import OrderTimeline from "@/components/OrderTimeline";
import { formatINR } from "@/lib/currency";

const PharmacistDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [approvalComments, setApprovalComments] = useState<{ [key: string]: string }>({});
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<{ [key: string]: number }>({});
  const [metrics, setMetrics] = useState({
    approvedThisWeek: 0,
    rejectedThisWeek: 0,
    pendingCount: 0,
    totalProcessed: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && userRole && userRole !== "pharmacist" && userRole !== "admin") {
      navigate("/dashboard");
    } else if (user && (userRole === "pharmacist" || userRole === "admin")) {
      fetchData();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [user, userRole, loading, navigate]);

  const fetchData = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [prescriptionsData, ordersData, productsData, metricsData] = await Promise.all([
        supabase
          .from("prescriptions")
          .select("*, profiles!prescriptions_pharmacist_id_fkey!inner(full_name)")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("*, order_items(*, product:products(name))")
          .neq("status", "delivered")
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("prescriptions")
          .select("status, reviewed_at")
          .gte("reviewed_at", oneWeekAgo.toISOString())
      ]);

      if (prescriptionsData.error) throw prescriptionsData.error;
      if (ordersData.error) throw ordersData.error;
      if (productsData.error) throw productsData.error;

      setPrescriptions(prescriptionsData.data || []);
      setOrders(ordersData.data || []);
      setProducts(productsData.data || []);

      // Calculate metrics
      const approved = metricsData.data?.filter(p => p.status === "approved").length || 0;
      const rejected = metricsData.data?.filter(p => p.status === "rejected").length || 0;

      setMetrics({
        approvedThisWeek: approved,
        rejectedThisWeek: rejected,
        pendingCount: prescriptionsData.data?.length || 0,
        totalProcessed: approved + rejected
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const handlePrescriptionAction = async (
    prescriptionId: string,
    action: "approved" | "rejected"
  ) => {
    try {
      const updateData: any = {
        status: action,
        pharmacist_id: user?.id,
        reviewed_at: new Date().toISOString(),
      };

      if (action === "rejected" && rejectionReason[prescriptionId]) {
        updateData.rejection_reason = rejectionReason[prescriptionId];
      }

      if (action === "approved" && approvalComments[prescriptionId]) {
        updateData.approval_comments = approvalComments[prescriptionId];
      }

      const { error } = await supabase
        .from("prescriptions")
        .update(updateData)
        .eq("id", prescriptionId);

      if (error) throw error;

      // Get pharmacist name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      // Send notification email
      try {
        await supabase.functions.invoke("notify-prescription-update", {
          body: {
            prescriptionId,
            status: action,
            pharmacistName: profile?.full_name || "Pharmacist",
            comments: approvalComments[prescriptionId],
            rejectionReason: rejectionReason[prescriptionId]
          }
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success(`Prescription ${action} and notification sent`);
      fetchData();
      setRejectionReason((prev) => {
        const newState = { ...prev };
        delete newState[prescriptionId];
        return newState;
      });
      setApprovalComments((prev) => {
        const newState = { ...prev };
        delete newState[prescriptionId];
        return newState;
      });
    } catch (error) {
      console.error("Error updating prescription:", error);
      toast.error("Failed to update prescription");
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: "pending" | "approved" | "processing" | "shipped" | "delivered" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order status updated");
      fetchData();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const handleStockUpdate = async (productId: string) => {
    try {
      const stockValue = newStock[productId];
      if (stockValue === undefined || stockValue < 0) {
        toast.error("Please enter a valid stock quantity");
        return;
      }

      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: stockValue })
        .eq("id", productId);

      if (error) throw error;

      toast.success("Stock updated successfully");
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    }
  };

  const viewPrescription = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("prescriptions")
        .createSignedUrl(filePath, 120); // short-lived signed URL

      if (error || !data?.signedUrl) {
        throw error || new Error("No signed URL returned");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error viewing prescription:", error);
      toast.error("Unable to open prescription. Please try again.");
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">Pharmacist Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="hover:shadow-[var(--glow-shadow)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--glow-shadow)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">Orders to process</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--glow-shadow)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved This Week</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.approvedThisWeek}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-[var(--glow-shadow)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rejected This Week</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.rejectedThisWeek}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="prescriptions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prescriptions">
              Prescriptions ({prescriptions.length})
            </TabsTrigger>
            <TabsTrigger value="orders">
              Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="inventory">
              Inventory ({products.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>Pending Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : prescriptions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No pending prescriptions</p>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <Card key={prescription.id} className="border-2">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{prescription.profiles.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(prescription.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewPrescription(prescription.file_url)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Approval Comments (optional)</label>
                            <Textarea
                              placeholder="Add comments about the prescription approval..."
                              value={approvalComments[prescription.id] || ""}
                              onChange={(e) =>
                                setApprovalComments((prev) => ({
                                  ...prev,
                                  [prescription.id]: e.target.value,
                                }))
                              }
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={rejectionReason[prescription.id] || ""}
                              onChange={(e) =>
                                setRejectionReason((prev) => ({
                                  ...prev,
                                  [prescription.id]: e.target.value,
                                }))
                              }
                              rows={2}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                handlePrescriptionAction(prescription.id, "approved")
                              }
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() =>
                                handlePrescriptionAction(prescription.id, "rejected")
                              }
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-6">
              {loadingData ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active orders</p>
              ) : (
                orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-bold text-primary">{formatINR(order.total_amount)}</p>
                      </div>

                      <OrderTimeline status={order.status} />

                      <div className="space-y-2">
                        <p className="font-medium text-sm">Items:</p>
                        <ul className="space-y-1">
                          {order.order_items.map((item: any) => (
                            <li key={item.id} className="text-sm">
                              {item.product.name} x {item.quantity} - {formatINR(item.price * item.quantity)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm mb-2">
                          <span className="font-medium">Payment Status: </span>
                          <span className={`capitalize ${
                            order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'
                          }`}>
                            {order.payment_status}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Delivery Address:</span>
                          <br />
                          {order.delivery_address}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <label className="text-sm font-medium">Update Status:</label>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleOrderStatusUpdate(order.id, value as "pending" | "approved" | "processing" | "shipped" | "delivered" | "cancelled")}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : products.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No products found</p>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <Card key={product.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1">
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.brand}</p>
                              <p className="text-sm">
                                Current Stock: 
                                <span className={`ml-2 font-semibold ${
                                  product.stock_quantity < 10 ? 'text-red-600' : 
                                  product.stock_quantity < 50 ? 'text-amber-600' : 
                                  'text-green-600'
                                }`}>
                                  {product.stock_quantity} units
                                </span>
                              </p>
                            </div>

                            {editingProduct === product.id ? (
                              <div className="flex gap-2 items-center w-full sm:w-auto">
                                <input
                                  type="number"
                                  min="0"
                                  className="w-24 px-3 py-2 border rounded-md"
                                  placeholder="Stock"
                                  defaultValue={product.stock_quantity}
                                  onChange={(e) =>
                                    setNewStock((prev) => ({
                                      ...prev,
                                      [product.id]: parseInt(e.target.value) || 0,
                                    }))
                                  }
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleStockUpdate(product.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingProduct(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingProduct(product.id);
                                  setNewStock((prev) => ({
                                    ...prev,
                                    [product.id]: product.stock_quantity,
                                  }));
                                }}
                              >
                                Update Stock
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PharmacistDashboard;