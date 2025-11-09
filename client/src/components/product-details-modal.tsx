
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  Trash2,
  Printer,
  FileText,
  Copy,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Phone,
  Mail,
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Download,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  BarChart3,
  Tag,
  History,
  StickyNote,
} from "lucide-react";

interface ProductDetailsModalProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: any) => void;
  onDelete: (productId: number) => void;
}

export default function ProductDetailsModal({
  product,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ProductDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [specifications, setSpecifications] = useState([
    { key: "Display", value: "6.8\" AMOLED" },
    { key: "Processor", value: "Snapdragon 8 Gen 3" },
    { key: "Battery", value: "5000mAh" },
  ]);
  const [internalNotes, setInternalNotes] = useState("");

  if (!product) return null;

  const images = [
    product.imageUrl || "https://via.placeholder.com/400",
    "https://via.placeholder.com/400/0000FF",
    "https://via.placeholder.com/400/00FF00",
  ];

  const profitMargin = product.costPrice
    ? (((product.price - product.costPrice) / product.costPrice) * 100).toFixed(2)
    : "0.00";

  const profitColor =
    parseFloat(profitMargin) < 10
      ? "text-red-600"
      : parseFloat(profitMargin) < 25
      ? "text-yellow-600"
      : "text-green-600";

  const stockLocations = [
    { location: "Main Store", quantity: 8 },
    { location: "Warehouse A", quantity: 15 },
    { location: "Warehouse B", quantity: 5 },
  ];

  const stockHistory = [
    { date: "2025-01-15", type: "Sale", quantity: -2, reference: "INV-1234" },
    { date: "2025-01-14", type: "Purchase", quantity: 20, reference: "PO-5678" },
    { date: "2025-01-10", type: "Adjustment", quantity: -1, reference: "ADJ-001" },
  ];

  const salesHistory = [
    { date: "2025-01-15", customer: "John Doe", quantity: 2, amount: 179998 },
    { date: "2025-01-14", customer: "Jane Smith", quantity: 1, amount: 89999 },
  ];

  const priceHistory = [
    { date: "2025-01-10", costPrice: 75000, sellingPrice: 89999, margin: 20 },
    { date: "2024-12-15", costPrice: 72000, sellingPrice: 85999, margin: 19.4 },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" onClick={() => onEdit(product)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline">
                  <FileText className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => onDelete(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Top Section: Image Gallery + Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Gallery */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Main Image */}
                      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                        <img
                          src={images[currentImageIndex]}
                          alt={product.name}
                          className={`w-full h-full object-cover transition-transform ${
                            isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                          }`}
                          onClick={() => setIsZoomed(!isZoomed)}
                        />
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="secondary" onClick={() => setIsZoomed(!isZoomed)}>
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="secondary">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        {images.length > 1 && (
                          <>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="absolute left-2 top-1/2 -translate-y-1/2"
                              onClick={() =>
                                setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                              }
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="absolute right-2 top-1/2 -translate-y-1/2"
                              onClick={() =>
                                setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                              }
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      {/* Thumbnails */}
                      <div className="flex gap-2">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className={`w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 ${
                              currentImageIndex === idx ? "border-primary" : "border-transparent"
                            }`}
                            onClick={() => setCurrentImageIndex(idx)}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">SKU</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {product.productCode || "N/A"}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(product.productCode || "")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Barcode</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {product.imeiNumber || "N/A"}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(product.imeiNumber || "")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Category</span>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Brand</span>
                        <span className="text-sm">{product.brand || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Model</span>
                        <span className="text-sm">{product.model || "N/A"}</span>
                      </div>
                      {product.color && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Color</span>
                          <span className="text-sm">{product.color}</span>
                        </div>
                      )}
                      {product.storage && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Storage</span>
                          <span className="text-sm">{product.storage}</span>
                        </div>
                      )}
                      {product.ram && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RAM</span>
                          <span className="text-sm">{product.ram}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pricing & Stock Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pricing Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Purchase Price</span>
                      <span className="text-sm font-mono">₹{product.costPrice?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Selling Price</span>
                      <span className="text-sm font-mono font-bold">
                        ₹{product.price?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">MRP</span>
                      <span className="text-sm font-mono">₹{((product.price || 0) * 1.1).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Profit Margin</span>
                      <span className={`text-sm font-bold ${profitColor}`}>{profitMargin}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">GST Rate</span>
                      <span className="text-sm">18%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Stock Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Stock</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            product.stockQuantity < 5
                              ? "destructive"
                              : product.stockQuantity < 10
                              ? "secondary"
                              : "default"
                          }
                        >
                          {product.stockQuantity}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Adjust
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge
                        variant={product.stockQuantity > 10 ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {product.stockQuantity === 0 ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            Out of Stock
                          </>
                        ) : product.stockQuantity < 5 ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            Critical
                          </>
                        ) : product.stockQuantity < 10 ? (
                          "Low Stock"
                        ) : (
                          "In Stock"
                        )}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Min Level</span>
                      <span className="text-sm">{product.minStockLevel || 5}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reorder Point</span>
                      <span className="text-sm">10</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <History className="h-4 w-4 mr-2" />
                      View Stock History
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs Section */}
              <Card>
                <Tabs defaultValue="supplier" className="w-full">
                  <CardHeader>
                    <TabsList className="w-full grid grid-cols-5">
                      <TabsTrigger value="supplier">Supplier</TabsTrigger>
                      <TabsTrigger value="sales">Sales Stats</TabsTrigger>
                      <TabsTrigger value="specs">Specifications</TabsTrigger>
                      <TabsTrigger value="history">Activity</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <CardContent>
                    {/* Supplier Information */}
                    <TabsContent value="supplier" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5" />
                        <h3 className="font-semibold">Primary Supplier Details</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Supplier Name</span>
                          <span className="text-sm font-medium">ABC Electronics Ltd.</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Supplier Code</span>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">SUP-001</code>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Contact</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Lead Time</span>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            3-5 days
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Last Purchase</span>
                          <span className="text-sm">2025-01-14</span>
                        </div>
                        <Button className="w-full mt-4">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Create Purchase Order
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Sales Statistics */}
                    <TabsContent value="sales" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5" />
                        <h3 className="font-semibold">Sales Performance</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold">45</p>
                              <p className="text-xs text-muted-foreground">Total Sold</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold">₹4.05L</p>
                              <p className="text-xs text-muted-foreground">Revenue</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm font-bold">2025-01-15</p>
                              <p className="text-xs text-muted-foreground">Last Sold</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold">3.2</p>
                              <p className="text-xs text-muted-foreground">Avg/Week</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Recent Sales</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {salesHistory.map((sale, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-sm">{sale.date}</TableCell>
                                <TableCell className="text-sm">{sale.customer}</TableCell>
                                <TableCell className="text-sm text-right">{sale.quantity}</TableCell>
                                <TableCell className="text-sm text-right font-mono">
                                  ₹{sale.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Specifications */}
                    <TabsContent value="specs" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Tag className="h-5 w-5" />
                          <h3 className="font-semibold">Product Specifications</h3>
                        </div>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Specification
                        </Button>
                      </div>
                      <Table>
                        <TableBody>
                          {specifications.map((spec, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{spec.key}</TableCell>
                              <TableCell className="text-right">{spec.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {product.warrantyMonths && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Warranty Information</h4>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm">Warranty Period</span>
                              <Badge variant="outline">{product.warrantyMonths} months</Badge>
                            </div>
                          </div>
                        </>
                      )}
                    </TabsContent>

                    {/* Activity History */}
                    <TabsContent value="history" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <History className="h-5 w-5" />
                        <h3 className="font-semibold">Activity History</h3>
                      </div>
                      <Tabs defaultValue="stock" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="stock">Stock</TabsTrigger>
                          <TabsTrigger value="price">Price</TabsTrigger>
                          <TabsTrigger value="sales">Sales</TabsTrigger>
                        </TabsList>
                        <TabsContent value="stock" className="mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead>Reference</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stockHistory.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="text-sm">{item.date}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{item.type}</Badge>
                                  </TableCell>
                                  <TableCell
                                    className={`text-sm text-right font-mono ${
                                      item.quantity > 0 ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    {item.quantity > 0 ? "+" : ""}
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className="text-sm">{item.reference}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TabsContent>
                        <TabsContent value="price" className="mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Cost Price</TableHead>
                                <TableHead className="text-right">Selling Price</TableHead>
                                <TableHead className="text-right">Margin</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {priceHistory.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="text-sm">{item.date}</TableCell>
                                  <TableCell className="text-sm text-right font-mono">
                                    ₹{item.costPrice.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-sm text-right font-mono">
                                    ₹{item.sellingPrice.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-sm text-right text-green-600">
                                    {item.margin}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TabsContent>
                        <TabsContent value="sales" className="mt-4">
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Sales history shown in Sales Stats tab
                          </p>
                        </TabsContent>
                      </Tabs>
                    </TabsContent>

                    {/* Internal Notes */}
                    <TabsContent value="notes" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <StickyNote className="h-5 w-5" />
                        <h3 className="font-semibold">Internal Notes</h3>
                      </div>
                      <Textarea
                        placeholder="Add internal notes about this product..."
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        rows={8}
                      />
                      <Button className="w-full">Save Notes</Button>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>

              {/* Stock by Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Stock by Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockLocations.map((loc, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{loc.location}</TableCell>
                          <TableCell className="text-right font-mono">{loc.quantity}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">
                              {((loc.quantity / product.stockQuantity) * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
