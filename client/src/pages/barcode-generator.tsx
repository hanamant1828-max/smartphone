
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Download, Plus, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function BarcodeGenerator() {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [barcodeFormat, setBarcodeFormat] = useState("CODE128");
  const [labelSize, setLabelSize] = useState("medium");
  const [labelsPerRow, setLabelsPerRow] = useState(3);
  const [copiesPerProduct, setCopiesPerProduct] = useState(1);
  const [includePrice, setIncludePrice] = useState(true);
  const [includeName, setIncludeName] = useState(true);
  const [includeSKU, setIncludeSKU] = useState(true);
  const [includeModel, setIncludeModel] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(false);
  const [paperSize, setPaperSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const addProduct = (product: any) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert("PDF download functionality would be implemented here");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Barcode Generator</h1>
          <p className="text-muted-foreground">Generate and print product barcodes</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Configuration Panel */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Barcode Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Barcode Format</Label>
              <Select value={barcodeFormat} onValueChange={setBarcodeFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CODE128">CODE128</SelectItem>
                  <SelectItem value="EAN13">EAN13</SelectItem>
                  <SelectItem value="UPC">UPC</SelectItem>
                  <SelectItem value="QR">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label Size</Label>
              <Select value={labelSize} onValueChange={setLabelSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (30x20mm)</SelectItem>
                  <SelectItem value="medium">Medium (50x30mm)</SelectItem>
                  <SelectItem value="large">Large (70x50mm)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Paper Size</Label>
              <Select value={paperSize} onValueChange={setPaperSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Label">Label Sheet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Orientation</Label>
              <Select value={orientation} onValueChange={setOrientation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Labels Per Row</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={labelsPerRow}
                onChange={(e) => setLabelsPerRow(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Copies Per Product</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={copiesPerProduct}
                onChange={(e) => setCopiesPerProduct(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-3">
              <Label>Include on Label</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={includeName} onCheckedChange={setIncludeName} />
                  <span className="text-sm">Product Name</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={includeModel} onCheckedChange={setIncludeModel} />
                  <span className="text-sm">Model/Variant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={includeSKU} onCheckedChange={setIncludeSKU} />
                  <span className="text-sm">SKU</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={includePrice} onCheckedChange={setIncludePrice} />
                  <span className="text-sm">Price</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={includeLogo} onCheckedChange={setIncludeLogo} />
                  <span className="text-sm">Company Logo</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Selection & Selected Products */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Select Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.slice(0, 10).map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.productCode}</TableCell>
                      <TableCell className="font-mono text-sm">{product.imeiNumber || product.barcode || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => addProduct(product)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedProducts.length > 0 && (
              <>
                <div className="pt-4">
                  <h4 className="font-semibold mb-2">Selected Products ({selectedProducts.length})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Copies</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.productCode}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{copiesPerProduct}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => removeProduct(product.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handlePrint} className="flex-1">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Labels
                  </Button>
                  <Button onClick={handleDownloadPDF} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Barcode Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div className="grid grid-cols-3 gap-4">
              {selectedProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="border rounded p-3 text-center space-y-2">
                  {includeName && <p className="text-xs font-medium truncate">{product.name}</p>}
                  {includeModel && <p className="text-xs text-muted-foreground">{product.model}</p>}
                  <div className="bg-gray-100 h-16 flex items-center justify-center">
                    <div className="space-y-1">
                      <div className="h-12 bg-black" style={{ width: '120px', backgroundImage: 'repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px)' }}></div>
                      {includeSKU && <p className="text-xs font-mono">{product.productCode}</p>}
                    </div>
                  </div>
                  {includePrice && <p className="text-sm font-bold">₹{product.price?.toLocaleString()}</p>}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => { setPreviewOpen(false); handlePrint(); }}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
