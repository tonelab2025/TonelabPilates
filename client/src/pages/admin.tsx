import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Calendar, TrendUp, Eye, EyeSlash, SignOut, Image, X, Download, Trash, Gear } from "phosphor-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminStats {
  totalBookings: number;
  totalRevenue: number;
  todayBookings: number;
  pendingPayments: number;
}

export default function Admin() {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // CSV download function
  const downloadCSV = () => {
    if (!bookings || bookings.length === 0) return;
    
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Event', 'Amount', 'Payment Status', 'Receipt Path', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...bookings.map(booking => [
        booking.id || '',
        `"${booking.fullName}"`,
        booking.email,
        booking.telephone,
        '"Pilates Full Body Sculpt & Burn"',
        '890',
        booking.receiptPath ? '"Payment Received"' : '"Pending Payment"',
        booking.receiptPath || '',
        booking.createdAt ? new Date(booking.createdAt).toISOString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tonelab-bookings-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("DELETE", `/api/bookings/${bookingId}`);
      return response.json();
    },
    onSuccess: () => {
      // Refresh the bookings list by invalidating the correct queries
      queryClient.invalidateQueries({ queryKey: ["api-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["auth-check"] });
      queryClient.invalidateQueries({ queryKey: ["api-recent-bookings"] });
      console.log('Booking deleted successfully, queries invalidated');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/admin/logout");
      } catch (error) {
        // Continue with logout even if API call fails
      }
      localStorage.removeItem('adminAuthenticated');
      return Promise.resolve();
    },
    onSuccess: () => {
      setLocation("/admin/login");
    },
    onError: () => {
      setLocation("/admin/login");
    }
  });

  // Check authentication using localStorage fallback for broken API
  const { data: authCheck, isLoading: authLoading, error: authError } = useQuery<any>({
    queryKey: ["auth-check"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/stats");
        return await response.json();
      } catch (error) {
        console.log('Auth API failed, checking localStorage:', error);
        // Fallback to localStorage if API fails
        const isLoggedIn = localStorage.getItem('adminAuthenticated') === 'true';
        if (isLoggedIn) {
          return {
            totalBookings: 0,
            totalRevenue: 0,
            todayBookings: 0,
            pendingPayments: 0,
            apiStatus: 'offline'
          };
        }
        return null;
      }
    },
    retry: false,
  });

  // Redirect to login if authentication fails
  useEffect(() => {
    if (!authLoading && !authCheck) {
      setLocation("/admin/login");
    }
  }, [authCheck, authLoading, setLocation]);

  // Get bookings from backend API (includes Google Sheets data) - with fallback for 502 errors
  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useQuery<any[]>({
    queryKey: ["api-bookings"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/bookings");
        const data = await response.json();
        return data;
      } catch (error) {
        console.log('Bookings API failed, returning empty array:', error);
        return []; // Return empty array for 502 errors
      }
    }
  });

  // Use the auth check data as stats since it's the same endpoint
  const stats = authCheck;
  const statsLoading = authLoading;

  const { data: recentBookings } = useQuery<any[]>({
    queryKey: ["api-recent-bookings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/recent-bookings");
      const data = await response.json();
      return data;
    }
  });

  if (authLoading || statsLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `฿${amount.toLocaleString()}`;

  const maskEmail = (email: string) => {
    if (!email) return '';
    if (!showSensitiveData) {
      const [localPart, domain] = email.split('@');
      if (!localPart || !domain) return email;
      return `${localPart.slice(0, 2)}***@${domain}`;
    }
    return email;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    if (!showSensitiveData) {
      if (phone.length < 5) return phone;
      return phone.slice(0, 3) + '****' + phone.slice(-2);
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Emergency Alert for API Issues */}
        {(bookingsError || authError || !bookings || bookings.length === 0) && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start">
              <div className="text-red-600 dark:text-red-400 mr-3 mt-1">⚠️</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                  API Endpoints Offline - Manual Access Required
                </h3>
                <p className="text-red-700 dark:text-red-400 mb-3">
                  The serverless functions are experiencing 502 errors. Bookings are still working via direct email notifications.
                </p>
                <div className="space-y-2">
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1XNcktdtttVYDnXwCHg_4te51ym60V9XBovU8j_Bo55w/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    📊 Open Google Sheets Dashboard
                  </a>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Check your email at collective.tonelab@gmail.com for new booking notifications with Google Sheets data ready to copy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Tonelab Staff Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your Pilates bookings and payments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/admin/content")}
              className="flex items-center gap-2"
              data-testid="button-content-manager"
            >
              <Gear className="w-4 h-4" />
              Edit Website Content
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="flex items-center gap-2"
              data-testid="button-toggle-sensitive-data"
            >
              {showSensitiveData ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showSensitiveData ? 'Hide' : 'Show'} Details
            </Button>
            <Button
              variant="outline"
              onClick={downloadCSV}
              className="flex items-center gap-2"
              data-testid="button-download-csv"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </Button>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-0 cursor-pointer transition-colors"
              style={{ 
                color: 'white',
                backgroundColor: '#000000',
                fontSize: '14px'
              }}
              data-testid="button-logout"
            >
              <SignOut className="w-4 h-4" />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">All time revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayBookings || 0}</div>
              <p className="text-xs text-muted-foreground">Bookings today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <TrendUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingPayments || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting receipt verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings - Moved to top */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Bookings (Latest First)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{booking.fullName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {maskEmail(booking.email)} • {maskPhone(booking.telephone)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(890)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.createdAt ? format(new Date(booking.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                    </p>
                  </div>
                  <Badge variant={booking.receiptPath ? "default" : "secondary"}>
                    {booking.receiptPath ? "Paid" : "Pending"}
                  </Badge>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-8">No bookings yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* All Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Contact</th>
                    <th className="text-left p-3">Event</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Receipt</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((booking) => (
                    <tr key={booking.id} className="border-b dark:border-gray-700">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{booking.fullName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ID: {booking.id ? booking.id.slice(0, 8) + '...' : 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <p>{maskEmail(booking.email)}</p>
                          <p>{maskPhone(booking.telephone)}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">Pilates Full Body Sculpt & Burn</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{formatCurrency(890)}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant={booking.receiptPath ? "default" : "secondary"}>
                          {booking.receiptPath ? "Payment Received" : "Pending Payment"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {booking.receiptPath ? (
                          <button
                            onClick={() => setSelectedReceipt(booking.receiptPath)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg border-0 cursor-pointer transition-colors hover:opacity-80"
                            style={{
                              backgroundColor: '#000000',
                              color: 'white',
                              fontSize: '12px'
                            }}
                            data-testid={`button-view-receipt-${booking.id}`}
                          >
                            <Image className="w-3 h-3" />
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No receipt</span>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="text-sm">
                          {booking.createdAt ? format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                        </p>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => deleteBookingMutation.mutate(booking.id)}
                          disabled={deleteBookingMutation.isPending}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border-0 cursor-pointer transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            fontSize: '12px'
                          }}
                          data-testid={`button-delete-booking-${booking.id}`}
                        >
                          <Trash className="w-3 h-3" />
                          {deleteBookingMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Modal */}
        {selectedReceipt && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedReceipt(null)}
            data-testid="modal-receipt"
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl max-h-[90vh] overflow-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Payment Receipt
                </h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 rounded-lg border-0 cursor-pointer transition-colors hover:opacity-70"
                  style={{
                    backgroundColor: '#000000',
                    color: 'white'
                  }}
                  data-testid="button-close-receipt"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <img
                  src={selectedReceipt.startsWith('https://storage.googleapis.com') 
                    ? selectedReceipt.replace('https://storage.googleapis.com/replit-objstore-798bdcde-83a6-4d6a-8a3e-1fca29ce500a/.private', '/objects')
                    : selectedReceipt
                  }
                  alt="Payment Receipt"
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '70vh' }}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const nextElement = target.nextElementSibling as HTMLElement;
                    target.style.display = 'none';
                    if (nextElement) nextElement.style.display = 'block';
                  }}
                  data-testid="img-receipt"
                />
                <div 
                  className="text-center py-8 text-gray-500 hidden"
                  data-testid="text-receipt-error"
                >
                  <p>Unable to load receipt image</p>
                  <p className="text-sm mt-2">File path: {selectedReceipt}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}