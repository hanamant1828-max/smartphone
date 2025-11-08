import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddProduct() {
  const [, setLocation] = useLocation();

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
          <p className="text-muted-foreground">Product form cleared - ready for new implementation</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">All form fields have been removed.</p>
            <p className="text-sm text-muted-foreground mt-2">Ready for new form design.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation("/inventory")}
          data-testid="button-cancel"
        >
          Back to Inventory
        </Button>
      </div>
    </div>
  );
}