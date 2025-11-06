
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart, 
  Plus,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/reports/dashboard"],
  });

  const statCards = [
    {
      title: "Today's Sales",
      value: `₹${stats?.todaySales?.toLocaleString() || 0}`,
      icon: DollarSign,
      trend: `+${stats?.salesGrowth || 0}%`,
      trendUp: true,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Monthly Revenue",
      value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`,
      icon: TrendingUp,
      trend: `+${stats?.revenueGrowth || 0}%`,
      trendUp: true,
      color: "text-green-600 bg-green-50",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts?.toLocaleString() || 0,
      icon: Package,
      trend: `${stats?.lowStockCount || 0} low stock`,
      trendUp: false,
      color: "text-orange-600 bg-orange-50",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers?.toLocaleString() || 0,
      icon: Users,
      trend: `${stats?.newCustomers || 0} this month`,
      trendUp: true,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your mobile shop performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
              <p className={`text-xs ${stat.trendUp ? 'text-green-600' : 'text-muted-foreground'} mt-1`}>
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStockCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Low Stock Alert!</strong> {stats.lowStockCount} products are running low on stock.
            <Button variant="link" className="h-auto p-0 ml-2 text-orange-600" onClick={() => window.location.hash = '#inventory'}>
              View Inventory →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button 
            size="lg" 
            className="h-auto py-6 flex-col gap-2"
            onClick={() => window.location.hash = '#pos'}
          >
            <ShoppingCart className="h-6 w-6" />
            <span>New Sale</span>
          </Button>
          <Button 
            size="lg" 
            variant="secondary"
            className="h-auto py-6 flex-col gap-2"
            onClick={() => window.location.hash = '#inventory'}
          >
            <Plus className="h-6 w-6" />
            <span>Add Product</span>
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-auto py-6 flex-col gap-2"
            onClick={() => window.location.hash = '#reports'}
          >
            <BarChart3 className="h-6 w-6" />
            <span>View Reports</span>
          </Button>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Sales chart will be displayed here
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Product performance chart will be displayed here
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
