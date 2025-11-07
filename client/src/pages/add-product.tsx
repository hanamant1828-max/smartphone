import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";

const productSchema = z.object({
  productCode: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  nameHindi: z.string().optional(),
  nameConvertLatin: z.string().optional(),
  brand: z.string().optional(),
  sizeBrand: z.string().optional(),
  model: z.string().optional(),
  category: z.enum(["smartphone", "feature_phone", "accessory", "spare_part"]),
  imeiNumber: z.string().optional(),
  color: z.string().optional(),
  storage: z.string().optional(),
  ram: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  costPrice: z.number().min(0, "Cost price must be positive"),
  stockQuantity: z.number().int().min(0, "Stock must be non-negative").default(0),
  minStockLevel: z.number().int().min(0).default(5),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  warrantyMonths: z.number().int().min(0).default(12),
  isActive: z.boolean().default(true),
  hsnCode: z.string().optional(),
  partGroup: z.string().optional(),
  unitCategory: z.string().optional(),
  salesDiscount: z.number().min(0).max(100).default(0),
  purchaseUnit: z.string().optional(),
  salesUnit: z.string().optional(),
  alterUnit: z.string().optional(),
  marginPercent1: z.number().min(0).default(0),
  marginPercent2: z.number().min(0).default(0),
  mrp: z.number().min(0).default(0),
  mrp2: z.number().min(0).default(0),
  retailPrice2: z.number().min(0).default(0),
  wholesalePrice: z.number().min(0).default(0),
  wholesalePrice2: z.number().min(0).default(0),
  gst: z.number().min(0).max(100).default(0),
  cgst: z.number().min(0).max(100).default(0),
  sgst: z.number().min(0).max(100).default(0),
  igst: z.number().min(0).max(100).default(0),
  cess: z.number().min(0).default(0),
  barcode: z.string().optional(),
  rack: z.string().optional(),
  defaultQty: z.number().int().min(1).default(1),
  taxTypeSale: z.enum(["inclusive", "exclusive"]).default("inclusive"),
  taxTypePurchase: z.enum(["inclusive", "exclusive"]).default("inclusive"),
  orderPrintHeading: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "smartphone",
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      warrantyMonths: 12,
      isActive: true,
      salesDiscount: 0,
      marginPercent1: 0,
      marginPercent2: 0,
      mrp: 0,
      mrp2: 0,
      retailPrice2: 0,
      wholesalePrice: 0,
      wholesalePrice2: 0,
      gst: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0,
      defaultQty: 1,
      taxTypeSale: "inclusive",
      taxTypePurchase: "inclusive",
    },
  });

  const gstValue = form.watch("gst");

  useEffect(() => {
    const gst = gstValue || 0;
    form.setValue("cgst", Number((gst / 2).toFixed(2)));
    form.setValue("sgst", Number((gst / 2).toFixed(2)));
    form.setValue("igst", 0);
  }, [gstValue, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      setLocation("/inventory");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/inventory")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground">Enter product details to add to inventory</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential product details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., iPhone 15 Pro" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., IP15P-128" {...field} data-testid="input-productCode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Apple" {...field} data-testid="input-brand" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A2890" {...field} data-testid="input-model" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="smartphone">Smartphone</SelectItem>
                        <SelectItem value="feature_phone">Feature Phone</SelectItem>
                        <SelectItem value="accessory">Accessory</SelectItem>
                        <SelectItem value="spare_part">Spare Part</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imeiNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMEI Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123456789012345" {...field} data-testid="input-imeiNumber" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Product specifications and features</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Midnight Black" {...field} data-testid="input-color" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 128GB" {...field} data-testid="input-storage" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RAM</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 8GB" {...field} data-testid="input-ram" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter product description..." {...field} data-testid="input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Price Info */}
          <Card>
            <CardHeader>
              <CardTitle>Price Info (Fill Compulsory)</CardTitle>
              <CardDescription>Product pricing, units, and tax information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-yellow-50"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-costPrice"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="minStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="bg-yellow-50"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-minStockLevel"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="salesDiscount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sales Discount %</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-yellow-50"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-salesDiscount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 items-end">
                    <FormField
                      control={form.control}
                      name="purchaseUnit"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Purchase Main Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-purchaseUnit">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pcs">Pcs (Pieces)</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                              <SelectItem value="dozen">Dozen</SelectItem>
                              <SelectItem value="pack">Pack</SelectItem>
                              <SelectItem value="set">Set</SelectItem>
                              <SelectItem value="unit">Unit</SelectItem>
                              <SelectItem value="kg">Kg (Kilogram)</SelectItem>
                              <SelectItem value="gram">Gram</SelectItem>
                              <SelectItem value="liter">Liter</SelectItem>
                              <SelectItem value="meter">Meter</SelectItem>
                              <SelectItem value="pair">Pair</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold mb-2">!</div>
                  </div>
                  
                  <div className="flex gap-2 items-end">
                    <FormField
                      control={form.control}
                      name="salesUnit"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Sales Main Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-salesUnit">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pcs">Pcs (Pieces)</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                              <SelectItem value="dozen">Dozen</SelectItem>
                              <SelectItem value="pack">Pack</SelectItem>
                              <SelectItem value="set">Set</SelectItem>
                              <SelectItem value="unit">Unit</SelectItem>
                              <SelectItem value="kg">Kg (Kilogram)</SelectItem>
                              <SelectItem value="gram">Gram</SelectItem>
                              <SelectItem value="liter">Liter</SelectItem>
                              <SelectItem value="meter">Meter</SelectItem>
                              <SelectItem value="pair">Pair</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold mb-2">!</div>
                  </div>
                  
                  <div className="flex gap-2 items-end">
                    <FormField
                      control={form.control}
                      name="alterUnit"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Alter Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-alterUnit">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pcs">Pcs (Pieces)</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                              <SelectItem value="dozen">Dozen</SelectItem>
                              <SelectItem value="pack">Pack</SelectItem>
                              <SelectItem value="set">Set</SelectItem>
                              <SelectItem value="unit">Unit</SelectItem>
                              <SelectItem value="kg">Kg (Kilogram)</SelectItem>
                              <SelectItem value="gram">Gram</SelectItem>
                              <SelectItem value="liter">Liter</SelectItem>
                              <SelectItem value="meter">Meter</SelectItem>
                              <SelectItem value="pair">Pair</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold mb-2">!</div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="marginPercent1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Margin %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-yellow-50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-margin-percent-1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="marginPercent2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>&nbsp;</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-yellow-50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-margin-percent-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="mrp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MRP</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-yellow-50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-mrp-1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mrp2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>&nbsp;</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-yellow-50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-mrp-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Retail Sale Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-yellow-50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-price-1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="retailPrice2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>&nbsp;</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-yellow-50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-price-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="wholesalePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wholesale Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-yellow-50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-wholesalePrice-1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="wholesalePrice2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>&nbsp;</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="bg-yellow-50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-wholesalePrice-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <FormField
                      control={form.control}
                      name="gst"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>GST %</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseFloat(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-gst">
                                <SelectValue placeholder="Select GST %" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="12">12%</SelectItem>
                              <SelectItem value="18">18%</SelectItem>
                              <SelectItem value="28">28%</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-1 items-end pb-1">
                      <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">!</div>
                      <Button type="button" size="sm" className="bg-green-500 hover:bg-green-600 h-6 px-2 text-xs" data-testid="button-gst-action">
                        <span>✓</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-blue-600 font-medium">CGST %</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        readOnly
                        className="bg-gray-50 mt-2"
                        value={form.watch("cgst") || 0}
                        data-testid="input-cgst"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-blue-600 font-medium">SGST/UTGST %</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        readOnly
                        className="bg-gray-50 mt-2"
                        value={form.watch("sgst") || 0}
                        data-testid="input-sgst"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-blue-600 font-medium">IGST %</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        readOnly
                        className="bg-gray-50 mt-2"
                        value={form.watch("igst") || 0}
                        data-testid="input-igst"
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="cess"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CESS %</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-yellow-50"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-cess"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 items-end">
                    <Button type="button" size="sm" className="bg-green-500 hover:bg-green-600 h-10 px-3" data-testid="button-add-item">
                      <span className="text-xl">+</span>
                    </Button>
                    <FormField
                      control={form.control}
                      name="defaultQty"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              data-testid="input-defaultQty"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Stock and inventory management</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-stockQuantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rack/Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A-12" {...field} data-testid="input-rack" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warrantyMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="12"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-warrantyMonths"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123456789012" {...field} data-testid="input-barcode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hsnCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 8517" {...field} data-testid="input-hsnCode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/inventory")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-submit"
            >
              <Save className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
