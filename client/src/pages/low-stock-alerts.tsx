
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  ShoppingCart,
  FileText,
  Download,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  Package,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function LowStockAlerts() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [reorderProduct, setReorderProduct] = useState<any>(null);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [markedAsOrdered, setMarkedAsOrdered] = useState<Set<number>>(new Set());

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const lowStockProducts = products.filter((p: any) => p.stockQuantity < (p.minStockLevel || 5));

  const criticalProducts = lowStockProducts.filter((p: any) => p.stockQuantity === 0);
  const warningProducts = lowStockProducts.filter(
    (p: any) => p.stockQuantity > 0 && p.stockQuantity < (p.minStockLevel || 5)
  );
  const attentionProducts = products.filter(
    (p: any) =>
      p.stockQuantity >= (p.minStockLevel || 5) && p.stockQuantity < (p.minStockLevel || 5) + 5
  );

  const calculateDaysUntilStockout = (product: any) => {
    const avgDailySales = 2; // Mock data
    if (avgDailySales === 0) return "N/A";
    return Math.floor(product.stockQuantity / avgDailySales);
  };

  const handleReorder = (product: any) => {
    setReorderProduct(product);
  };

  const handleMarkAsOrdered = () => {
    const newMarked = new Set(markedAsOrdered);
    selectedIds.forEach(id => newMarked.add(id));
    setMarkedAsOrdered(newMarked);
    setSelectedIds(new Set());
  };

  const calculateRecommendedQty = (product: any) => {
    const avgMonthlySales = 60; // Mock: 2 per day * 30 days
    const leadTimeDays = 4; // Average of 3-5 days
    const safetyStock = product.minStockLevel || 5;
    const leadTimeDemand = Math.ceil((avgMonthlySales / 30) * leadTimeDays);
    return leadTimeDemand + safetyStock - product.stockQuantity;
  };

  const calculateExpectedDelivery = () => {
    const today = new Date();
    today.setDate(today.getDate() + 4); // 4 days lead time
    return today.toISOString().split('T')[0];
  };

  const ProductsTable = ({ products, priorityColor }: { products: any[]; priorityColor: string }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox />
          </TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Current / Min</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead className="text-right">Lead Time</TableHead>
          <TableHead className="text-right">Days Until Stockout</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.filter(p => !markedAsOrdered.has(p.id)).map((product: any) => (
          <TableRow key={product.id}>
            <TableCell>
              <Checkbox
                checked={selectedIds.has(product.id)}
                onCheckedChange={(checked) => {
                  const newSet = new Set(selectedIds);
                  if (checked) {
                    newSet.add(product.id);
                  } else {
                    newSet.delete(product.id);
                  }
                  setSelectedIds(newSet);
                }}
              />
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.brand} - {product.model}</p>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={product.stockQuantity === 0 ? "destructive" : "secondary"}>
                {product.stockQuantity} / {product.minStockLevel || 5}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <p className="font-medium">ABC Electronics</p>
                <p className="text-xs text-muted-foreground">SUP-001</p>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                3-5 days
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <span className={`font-bold ${priorityColor}`}>
                {calculateDaysUntilStockout(product)} days
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" onClick={() => handleReorder(product)}>
                <ShoppingCart className="h-3 w-3 mr-1" />
                Reorder
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Low Stock Alerts</h1>
          <p className="text-muted-foreground">Monitor and manage low stock products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNotificationSettingsOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{criticalProducts.length}</div>
            <p className="text-xs text-red-600">Out of stock or near zero</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{warningProducts.length}</div>
            <p className="text-xs text-orange-600">Below minimum level</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attention</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{attentionProducts.length}</div>
            <p className="text-xs text-yellow-600">Approaching minimum</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedIds.size} products selected</span>
              <div className="flex gap-2">
                <Button size="sm">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Reorder Selected
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PO
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" variant="outline" onClick={handleMarkAsOrdered}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Ordered
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Tabs */}
      <Card>
        <Tabs defaultValue="critical" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="critical" className="gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Critical ({criticalProducts.length})
              </TabsTrigger>
              <TabsTrigger value="warning" className="gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Warning ({warningProducts.length})
              </TabsTrigger>
              <TabsTrigger value="attention" className="gap-2">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                Attention ({attentionProducts.length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({lowStockProducts.length})</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="critical">
              {criticalProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No critical stock alerts</p>
                </div>
              ) : (
                <ProductsTable products={criticalProducts} priorityColor="text-red-600" />
              )}
            </TabsContent>

            <TabsContent value="warning">
              {warningProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No warning alerts</p>
                </div>
              ) : (
                <ProductsTable products={warningProducts} priorityColor="text-orange-600" />
              )}
            </TabsContent>

            <TabsContent value="attention">
              {attentionProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attention alerts</p>
                </div>
              ) : (
                <ProductsTable products={attentionProducts} priorityColor="text-yellow-600" />
              )}
            </TabsContent>

            <TabsContent value="all">
              <ProductsTable products={lowStockProducts} priorityColor="text-blue-600" />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Notification Settings Dialog */}
      <Dialog open={notificationSettingsOpen} onOpenChange={setNotificationSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive low stock alerts via email</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive low stock alerts via SMS</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            {emailAlerts && (
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="admin@shop.com" />
              </div>
            )}
            {smsAlerts && (
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input type="tel" placeholder="+91 98765 43210" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setNotificationSettingsOpen(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog open={!!reorderProduct} onOpenChange={() => setReorderProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reorder Suggestion - {reorderProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input value={reorderProduct?.stockQuantity || 0} disabled />
              </div>
              <div className="space-y-2">
                <Label>Minimum Level</Label>
                <Input value={reorderProduct?.minStockLevel || 5} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recommended Reorder Quantity</Label>
              <Input type="number" value={reorderProduct ? calculateRecommendedQty(reorderProduct) : 20} />
              <p className="text-xs text-muted-foreground">
                Based on average monthly sales (60 units), lead time (4 days), and safety stock
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preferred Supplier</Label>
              <Input value="ABC Electronics Ltd." disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Last Purchase Price</Label>
                <Input value={`₹${reorderProduct?.costPrice?.toLocaleString() || '75,000'}`} disabled />
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery</Label>
                <Input value={calculateExpectedDelivery()} disabled />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReorderProduct(null)}>
              Cancel
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
