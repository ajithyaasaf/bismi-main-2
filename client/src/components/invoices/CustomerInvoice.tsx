import { useState } from 'react';
import { Customer, Order, Transaction } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format, differenceInDays, parseISO } from 'date-fns';

// PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  businessInfo: {
    marginBottom: 20,
  },
  customerInfo: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  value: {
    fontSize: 12,
    marginBottom: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 25,
  },
  tableRowHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCol: {
    width: '25%',
    textAlign: 'left',
    padding: 5,
    fontSize: 10,
  },
  tableColHeader: {
    fontWeight: 'bold',
  },
  tableColDate: {
    width: '20%',
  },
  tableColItems: {
    width: '40%',
  },
  tableColAmount: {
    width: '20%',
    textAlign: 'right',
  },
  tableColStatus: {
    width: '20%',
  },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#bfbfbf',
    borderTopStyle: 'solid',
    paddingTop: 5,
    marginTop: 10,
  },
  totalLabel: {
    width: '80%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 12,
    padding: 5,
  },
  totalValue: {
    width: '20%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 12,
    padding: 5,
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#bfbfbf',
    borderTopStyle: 'solid',
    paddingTop: 10,
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  overdueNote: {
    color: '#d32f2f',
    marginTop: 15,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// PDF Document Component
const InvoicePDF = ({ 
  customer, 
  orders,
  currentDate,
  overdueThresholdDays = 15
}: { 
  customer: Customer; 
  orders: (Order & { items: any[] })[];
  currentDate: string;
  overdueThresholdDays?: number;
}) => {
  // Calculate total pending amount
  const totalPending = customer.pendingAmount || 0;
  
  // Filter to get orders with pending payments
  const pendingOrders = orders.filter(order => 
    order.status === 'completed' && !order.isPaid
  );
  
  // Check for overdue orders (older than threshold days)
  const overdueOrders = pendingOrders.filter(order => {
    const orderDate = typeof order.date === 'string' 
      ? parseISO(order.date)
      : new Date(order.date);
    const currentDateObj = parseISO(currentDate);
    return differenceInDays(currentDateObj, orderDate) >= overdueThresholdDays;
  });
  
  // Format order items for display
  const formatOrderItems = (items: any[]) => {
    return items.map(item => `${item.quantity} kg ${item.type} - ₹${item.rate}/kg`).join(', ');
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>INVOICE</Text>
        
        {/* Business Information */}
        <View style={styles.businessInfo}>
          <Text style={styles.subheader}>Bismi Chicken Shop</Text>
          <Text>123 Main Street, Coimbatore, Tamil Nadu</Text>
          <Text>Phone: +91 98765 43210</Text>
          <Text>Email: info@bismichicken.com</Text>
          <Text>GSTIN: 33ABCDE1234F1Z5</Text>
        </View>
        
        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.label}>INVOICE DATE</Text>
          <Text style={styles.value}>{currentDate}</Text>
          
          <Text style={styles.label}>INVOICE TO</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.value}>{customer.name}</Text>
            <Text style={styles.value}>Type: {customer.type === 'hotel' ? 'Hotel' : 'Retail'}</Text>
            {customer.contact && <Text style={styles.value}>Contact: {customer.contact}</Text>}
          </View>
          
          {/* Summary */}
          <Text style={styles.subheader}>Payment Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={[styles.tableCol, styles.tableColHeader, styles.tableColDate]}>Date</Text>
              <Text style={[styles.tableCol, styles.tableColHeader, styles.tableColItems]}>Items</Text>
              <Text style={[styles.tableCol, styles.tableColHeader, styles.tableColAmount]}>Amount</Text>
              <Text style={[styles.tableCol, styles.tableColHeader, styles.tableColStatus]}>Status</Text>
            </View>
            
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order, index) => {
                const orderDate = typeof order.date === 'string' 
                  ? parseISO(order.date) 
                  : new Date(order.date);
                const daysSincePurchase = differenceInDays(parseISO(currentDate), orderDate);
                const isOverdue = daysSincePurchase >= overdueThresholdDays;
                
                return (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCol, styles.tableColDate]}>
                      {format(orderDate, 'dd/MM/yyyy')}
                    </Text>
                    <Text style={[styles.tableCol, styles.tableColItems]}>
                      {formatOrderItems(order.items)}
                    </Text>
                    <Text style={[styles.tableCol, styles.tableColAmount]}>
                      ₹{order.total.toFixed(2)}
                    </Text>
                    <Text style={[styles.tableCol, styles.tableColStatus]}>
                      {isOverdue ? 'OVERDUE' : `${daysSincePurchase} days pending`}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, { width: '100%' }]}>No pending orders found</Text>
              </View>
            )}
          </View>
          
          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Pending Amount:</Text>
            <Text style={styles.totalValue}>₹{totalPending.toFixed(2)}</Text>
          </View>
          
          {/* Overdue Alert */}
          {overdueOrders.length > 0 && (
            <Text style={styles.overdueNote}>
              * {overdueOrders.length} order(s) are overdue by {overdueThresholdDays}+ days. Please make payment immediately.
            </Text>
          )}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>For any queries regarding this invoice, please contact us.</Text>
        </View>
      </Page>
    </Document>
  );
};

interface CustomerInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  orders: Order[];
}

export default function CustomerInvoice({ 
  isOpen, 
  onClose, 
  customer,
  orders 
}: CustomerInvoiceProps) {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  
  // Filter to get only this customer's orders
  const customerOrders = orders.filter(order => order.customerId === customer.id);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Customer Invoice</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{customer.name}</h3>
                <p className="text-sm text-gray-500">
                  Type: {customer.type === 'hotel' ? 'Hotel' : 'Retail'}
                </p>
                {customer.contact && (
                  <p className="text-sm text-gray-500">
                    Contact: {customer.contact}
                  </p>
                )}
                {customer.pendingAmount > 0 && (
                  <p className="text-sm font-medium text-red-600 mt-2">
                    Pending Amount: ₹{customer.pendingAmount.toFixed(2)}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPdfPreview(!showPdfPreview)}
                >
                  {showPdfPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                
                <PDFDownloadLink
                  document={
                    <InvoicePDF 
                      customer={customer} 
                      orders={customerOrders as any} 
                      currentDate={currentDate}
                    />
                  }
                  fileName={`invoice-${customer.name}-${currentDate}.pdf`}
                  className="inline-block"
                >
                  {({ loading }) => (
                    <Button disabled={loading}>
                      {loading ? 'Generating PDF...' : 'Download Invoice'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </CardContent>
          </Card>
          
          {showPdfPreview && (
            <div className="border rounded-md overflow-hidden" style={{ height: '70vh' }}>
              <PDFViewer width="100%" height="100%" className="border-0">
                <InvoicePDF 
                  customer={customer} 
                  orders={customerOrders as any} 
                  currentDate={currentDate}
                />
              </PDFViewer>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}