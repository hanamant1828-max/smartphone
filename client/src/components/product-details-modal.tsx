
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Edit, Trash2, Printer, FileText, Copy, Package, TrendingUp,
  Calendar, Phone, Mail, MapPin, Clock, DollarSign, Barcode,
  ZoomIn, ChevronLeft, ChevronRight, Plus, History, Tag,
  AlertCircle, CheckCircle, XCircle, ShoppingCart, FileBarChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Product = {
  id: number;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  productCode?: string;
  imeiNumber?: string;
  costPrice: number;
  price: number;
  salesDiscount?: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  hsnCode?: string;
  warrantyMonths?: number;
  color?: string;
  storage?: string;
  ram?: string;
  description?: string;
  isActive: boolean;
  supplierId?: number;
  supplierProductCode?: string;
  leadTime?: number;
  tags?: string[];
  images?: string[];
};

type Supplier = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

type StockHistory = {
  id: number;
  date: string;
  type: "sale" | "purchase" | "adjustment";
  quantity: number;
  reason?: string;
  user: string;
};

type SalesStats = {
  totalSold: number;
  revenue: number;
  lastSoldDate?: string;
  averageMonthlySales: number;
};

type ProductDetailsModalProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: number) => void;
};

export default function ProductDetailsModal({
  product,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ProductDetailsModalProps) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");

  if (!product) return null;

  // Mock data - replace with actual API calls
  const mockSupplier: Supplier = {
    id: 1,
    name: "Tech Distributors Ltd",
    email: "sales@techdist.com",
    phone: "+91 98765 43210",
    address: "123 Market Street, Mumbai",
  };

  const mockStockHistory: StockHistory[] = [
    { id: 1, date: "2024-01-07", type: "sale", quantity: -2, user: "John Doe" },
    { id: 2, date: "2024-01-06", type: "purchase", quantity: 10, reason: "Restock", user: "Admin" },
    { id: 3, date: "2024-01-05", type: "adjustment", quantity: -1, reason: "Damaged", user: "Admin" },
  ];

  const mockSalesStats: SalesStats = {
    totalSold: 45,
    revenue: 4049955,
    lastSoldDate: "2024-01-07",
    averageMonthlySales: 15,
  };

  const mockSpecifications = [
    { key: "Display", value: "6.8 inch AMOLED" },
    { key: "Processor", value: "Snapdragon 8 Gen 3" },
    { key: "Camera", value: "200MP + 50MP + 12MP + 10MP" },
    { key: "Battery", value: "5000mAh" },
    { key: "OS", value: "Android 14" },
  ];

  const images = product.images || ["/placeholder-product.jpg"];
  const profitMargin = product.price && product.costPrice 
    ? ((product.price - product.costPrice) / product.price * 100).toFixed(2)
    : "0";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const getStockStatus = () => {
    if (product.stockQuantity === 0) return { label: "Out of Stock", color: "destructive" };
    if (product.stockQuantity <= product.minStockLevel) return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{product.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {product.brand} {product.model && `• ${product.model}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => onEdit?.(product)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => onDelete?.(product.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-80px)]">
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Image Gallery */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-4">
                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden mb-4">
                      <img
                        src={images[selectedImage]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                      {images.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setSelectedImage(prev => (prev - 1 + images.length) % images.length)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setSelectedImage(prev => (prev + 1) % images.length)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                              selectedImage === idx ? "border-primary" : "border-transparent"
                            }`}
                            onClick={() => setSelectedImage(idx)}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">SKU</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm font-mono">{product.productCode || "N/A"}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(product.productCode || "", "SKU")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {product.imeiNumber && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Barcode/IMEI</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm font-mono">{product.imeiNumber}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(product.imeiNumber || "", "Barcode")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <p className="text-sm mt-1">{product.category}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge variant={product.isActive ? "success" : "secondary"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Details Tabs */}
              <div className="lg:col-span-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="stock">Stock</TabsTrigger>
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* Pricing Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Pricing Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Purchase Price</Label>
                            <p className="text-lg font-semibold">₹{product.costPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Selling Price</Label>
                            <p className="text-lg font-semibold">₹{product.price.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Profit Margin</Label>
                            <Badge
                              variant={parseFloat(profitMargin) > 20 ? "success" : parseFloat(profitMargin) > 10 ? "warning" : "destructive"}
                              className="mt-1"
                            >
                              {profitMargin}%
                            </Badge>
                          </div>
                          {product.hsnCode && (
                            <div>
                              <Label className="text-xs text-muted-foreground">HSN/GST Code</Label>
                              <p className="text-sm mt-1">{product.hsnCode}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Supplier Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Supplier Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Supplier Name</Label>
                            <p className="text-sm font-medium mt-1">{mockSupplier.name}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Supplier Code</Label>
                              <p className="text-sm mt-1">{product.supplierProductCode || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Lead Time</Label>
                              <p className="text-sm mt-1">{product.leadTime || 7} days</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Phone className="h-3 w-3 mr-2" />
                              Call
                            </Button>
                            <Button variant="outline" size="sm">
                              <Mail className="h-3 w-3 mr-2" />
                              Email
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Specifications */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Specifications</CardTitle>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            {mockSpecifications.map((spec, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{spec.key}</TableCell>
                                <TableCell>{spec.value}</TableCell>
                              </TableRow>
                            ))}
                            {product.color && (
                              <TableRow>
                                <TableCell className="font-medium">Color</TableCell>
                                <TableCell>{product.color}</TableCell>
                              </TableRow>
                            )}
                            {product.storage && (
                              <TableRow>
                                <TableCell className="font-medium">Storage</TableCell>
                                <TableCell>{product.storage}</TableCell>
                              </TableRow>
                            )}
                            {product.ram && (
                              <TableRow>
                                <TableCell className="font-medium">RAM</TableCell>
                                <TableCell>{product.ram}</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Warranty & Tags */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Warranty</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-semibold">{product.warrantyMonths || 12} months</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Tags
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {product.tags?.map((tag, idx) => (
                              <Badge key={idx} variant="outline">{tag}</Badge>
                            )) || <p className="text-sm text-muted-foreground">No tags</p>}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="stock" className="space-y-4 mt-4">
                    {/* Stock Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Stock Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Current Stock</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-2xl font-bold">{product.stockQuantity}</p>
                              <Button variant="outline" size="sm">Adjust</Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <div className="mt-1">
                              <Badge variant={stockStatus.color as any}>{stockStatus.label}</Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Min Level</Label>
                            <p className="text-lg font-semibold mt-1">{product.minStockLevel}</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Max Stock Level</Label>
                            <p className="text-sm mt-1">{product.maxStockLevel || "Not set"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Reorder Point</Label>
                            <p className="text-sm mt-1">{product.reorderPoint || product.minStockLevel}</p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full">
                          <History className="h-4 w-4 mr-2" />
                          View Stock History
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Stock by Location */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Stock by Location
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Location</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Main Warehouse</TableCell>
                              <TableCell className="text-right font-medium">{Math.floor(product.stockQuantity * 0.7)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Store Floor</TableCell>
                              <TableCell className="text-right font-medium">{Math.floor(product.stockQuantity * 0.3)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="sales" className="space-y-4 mt-4">
                    {/* Sales Statistics */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Total Sold
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold">{mockSalesStats.totalSold}</p>
                          <p className="text-xs text-muted-foreground mt-1">units</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Revenue Generated
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold">₹{mockSalesStats.revenue.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Last Sold
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold">{mockSalesStats.lastSoldDate || "N/A"}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Sales Velocity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold">{mockSalesStats.averageMonthlySales} units/month</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4 mt-4">
                    {/* Activity History */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Activity History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>User</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockStockHistory.map((history) => (
                              <TableRow key={history.id}>
                                <TableCell className="font-mono text-sm">{history.date}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    history.type === "sale" ? "default" :
                                    history.type === "purchase" ? "success" : "secondary"
                                  }>
                                    {history.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${
                                  history.quantity > 0 ? "text-green-600" : "text-red-600"
                                }`}>
                                  {history.quantity > 0 ? "+" : ""}{history.quantity}
                                </TableCell>
                                <TableCell className="text-sm">{history.reason || "-"}</TableCell>
                                <TableCell className="text-sm">{history.user}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Internal Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Internal Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          placeholder="Add internal notes about this product..."
                          className="min-h-[100px]"
                          defaultValue={product.description}
                        />
                        <Button className="mt-2" size="sm">Save Notes</Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
