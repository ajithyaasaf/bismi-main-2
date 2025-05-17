import { useState } from 'react';
import { Customer, Order, Transaction } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet, PDFViewer, Image } from '@react-pdf/renderer';
import { format, differenceInDays, parseISO } from 'date-fns';
import qrCodeImage from "../../assets/qr-code.jpg";

// PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  monoFont: {
    fontFamily: 'Courier',
    fontVariant: 'normal',
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
  const pendingOrders = orders.filter(order => {
    // Check if the order belongs to this customer
    if (order.customerId !== customer.id) return false;
    
    // Consider orders that are not marked as paid
    return order.status !== 'paid';
  });
  
  // Check for overdue orders (older than threshold days)
  const overdueOrders = pendingOrders.filter(order => {
    // Handle different date formats from API or Firestore
    let orderDate: Date;
    if (typeof order.date === 'string') {
      orderDate = parseISO(order.date);
    } else if (order.date instanceof Date) {
      orderDate = order.date;
    } else {
      // Fallback to current date if date is null or invalid
      orderDate = new Date();
    }
    
    const currentDateObj = parseISO(currentDate);
    return differenceInDays(currentDateObj, orderDate) >= overdueThresholdDays;
  });
  
  // Format order items for display with proper currency formatting
  const formatOrderItems = (items: any[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) return "No items";
    
    return items.map(item => {
      const quantity = typeof item.quantity === 'number' ? item.quantity.toFixed(2) : item.quantity;
      const rate = typeof item.rate === 'number' ? item.rate.toFixed(2) : item.rate;
      return `${quantity} kg ${item.type} - ₹${rate}/kg`;
    }).join(', ');
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>INVOICE</Text>
        
        {/* Business Information */}
        <View style={styles.businessInfo}>
          <Text style={styles.subheader}>Bismi Broiler's</Text>
          <Text>Near Busstand, Hayarnisha Hospital</Text>
          <Text>Mudukulathur</Text>
          <Text>Phone: +91 8681087082</Text>
          <Text>GSTIN: 33AADCB1234F1Z5</Text>
        </View>
        
        {/* Invoice Details */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.label}>INVOICE DATE</Text>
              <Text style={styles.value}>{format(parseISO(currentDate), 'dd/MM/yyyy')}</Text>
            </View>
            <View>
              <Text style={styles.label}>INVOICE NUMBER</Text>
              <Text style={styles.value}>INV-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</Text>
            </View>
          </View>
          
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
                // Handle different date formats from API or Firestore
                let orderDate: Date;
                if (typeof order.date === 'string') {
                  orderDate = parseISO(order.date);
                } else if (order.date instanceof Date) {
                  orderDate = order.date;
                } else {
                  // Fallback to current date if date is null or invalid
                  orderDate = new Date();
                }
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
                    <Text style={[styles.tableCol, styles.tableColAmount, styles.monoFont]}>
                      ₹{typeof order.total === 'number' ? order.total.toFixed(2) : order.total}
                    </Text>
                    <Text style={[styles.tableCol, styles.tableColStatus]}>
                      {isOverdue ? `OVERDUE (${daysSincePurchase} days)` : `${daysSincePurchase} days pending`}
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
            <Text style={[styles.totalValue, styles.monoFont]}>₹{typeof totalPending === 'number' ? totalPending.toFixed(2) : totalPending}</Text>
          </View>
          
          {/* Overdue Alert */}
          {overdueOrders.length > 0 && (
            <Text style={styles.overdueNote}>
              * {overdueOrders.length} order(s) are overdue by {overdueThresholdDays}+ days. Please make payment immediately.
            </Text>
          )}
        </View>
        
        {/* Payment Terms */}
        <View style={{marginTop: 20, marginBottom: 10}}>
          <Text style={{fontSize: 12, fontWeight: 'bold'}}>Payment Terms:</Text>
          <Text style={{fontSize: 10, marginBottom: 5}}>1. Please make payment via scanning QR code or using the mentioned Google Pay number</Text>
          <Text style={{fontSize: 10, marginBottom: 5}}>2. Payment is due within 15 days of invoice date</Text>
          <Text style={{fontSize: 10, marginBottom: 5}}>3. Late payments may be subject to interest charges</Text>
        </View>
        
        {/* Payment Details */}
        <View style={{marginBottom: 20}}>
          <Text style={{fontSize: 12, fontWeight: 'bold'}}>Payment Details:</Text>
          <Text style={{fontSize: 10, marginBottom: 3}}>Google Pay Number: +91 9514499968</Text>
          <Text style={{fontSize: 10, marginBottom: 10}}>Please scan the QR code below for instant payment:</Text>
          
          {/* QR Code */}
          <View style={{alignItems: 'center', marginBottom: 10}}>
            <Image src={qrCodeImage} style={{width: 120, height: 120}} />
          </View>
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