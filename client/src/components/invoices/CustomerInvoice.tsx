import { useState, useEffect, useMemo } from 'react';
import { Customer, Order, Transaction } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PDFDownloadLink, Page, Text, View, Document, StyleSheet, PDFViewer, Image, Font } from '@react-pdf/renderer';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CalendarIcon, SaveIcon, FileTextIcon, PrinterIcon, MailIcon, ShareIcon, InfoIcon, AlertTriangleIcon, CreditCardIcon, CheckCircle2Icon, ClipboardCopyIcon, DownloadIcon, EyeIcon, SearchIcon, TrashIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTransactionsByEntity } from '@/lib/transaction-service';
import qrCodeImage from "../../assets/qr-code.jpg";

// Register custom fonts
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-800.ttf', fontWeight: 800 },
  ]
});

Font.register({
  family: 'Roboto Mono',
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto-mono@4.5.0/files/roboto-mono-latin-400-normal.woff'
});

// PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Open Sans',
  },
  monoFont: {
    fontFamily: 'Roboto Mono',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  headerLeft: {
    width: '60%',
  },
  headerRight: {
    width: '40%',
    alignItems: 'flex-end',
  },
  businessLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  businessAddress: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 1,
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  invoiceSubtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  invoiceDetailsContainer: {
    flexDirection: 'row',
    marginTop: 40,
    marginBottom: 30,
  },
  invoiceDetailsLeft: {
    width: '60%',
  },
  invoiceDetailsRight: {
    width: '40%',
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailsLabel: {
    fontSize: 9,
    width: '40%',
    color: '#6b7280',
  },
  detailsValue: {
    fontSize: 9,
    width: '60%',
    color: '#111827',
  },
  customerInfo: {
    fontSize: 10,
    color: '#111827',
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 28,
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableRowHeader: {
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  tableCol: {
    padding: 8,
    fontSize: 9,
  },
  tableColHeader: {
    fontWeight: 'bold',
    color: '#374151',
  },
  tableColId: {
    width: '15%',
  },
  tableColDate: {
    width: '15%',
  },
  tableColItems: {
    width: '45%',
  },
  tableColAmount: {
    width: '15%',
    textAlign: 'right',
  },
  tableColStatus: {
    width: '10%',
    textAlign: 'center',
  },
  statusBadge: {
    fontSize: 8,
    padding: 3,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#b45309',
    backgroundColor: '#fef3c7',
  },
  statusOverdue: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
  },
  totalSection: {
    flexDirection: 'row',
    marginTop: 10,
  },
  totalLeft: {
    width: '70%',
  },
  totalRight: {
    width: '30%',
  },
  totalTable: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    padding: 5,
  },
  totalLabel: {
    width: '60%',
    textAlign: 'right',
    fontSize: 9,
    color: '#4b5563',
    paddingRight: 10,
  },
  totalValue: {
    width: '40%',
    textAlign: 'right',
    fontSize: 9,
    fontFamily: 'Roboto Mono',
  },
  totalRowFinal: {
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 0,
  },
  totalLabelFinal: {
    color: '#111827',
    fontWeight: 'bold',
  },
  totalValueFinal: {
    fontWeight: 'bold',
  },
  paymentSection: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
  },
  paymentSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  paymentDetailsContainer: {
    flexDirection: 'row',
  },
  paymentDetails: {
    width: '60%',
  },
  paymentQR: {
    width: '40%',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 9,
    marginBottom: 5,
    color: '#4b5563',
  },
  paymentInstruction: {
    fontSize: 8,
    marginBottom: 3,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 2,
  },
  noticeBox: {
    padding: 10,
    marginTop: 15,
    marginBottom: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid',
  },
  noticeBoxWarning: {
    backgroundColor: '#fff7ed',
    borderColor: '#ffedd5',
  },
  noticeBoxInfo: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  noticeText: {
    fontSize: 9,
    color: '#4b5563',
  },
  watermark: {
    position: 'absolute',
    bottom: 250,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#e5e7eb',
    fontSize: 80,
    fontWeight: 'bold',
    transform: 'rotate(-45deg)',
    opacity: 0.3,
  },
  orderNumber: {
    fontSize: 8,
    color: '#6b7280',
  },
});

// Invoice PDF Component
const InvoicePDF = ({ 
  customer,
  orders,
  currentDate,
  invoiceNumber,
  dueDate,
  showPaid = false,
  overdueThresholdDays = 15,
  payments = [],
  businessInfo = {
    name: "Bismi Broiler's",
    address: ["Near Busstand, Hayarnisha Hospital", "Mudukulathur"],
    phone: "+91 8681087082",
    gstin: "33AADCB1234F1Z5",
    email: "bismi.broilers@gmail.com"
  },
  paymentInfo = {
    upiId: "9514499968@ybl",
    phone: "+91 9514499968",
    accountName: "Bismi Broiler's",
    terms: [
      "Payment is due within 15 days of invoice date",
      "Late payments may be subject to 2% monthly interest charges",
      "For queries regarding this invoice, please contact our accounts department"
    ]
  }
}: { 
  customer: Customer; 
  orders: Order[];
  currentDate: string;
  invoiceNumber: string;
  dueDate: string;
  showPaid?: boolean;
  overdueThresholdDays?: number;
  payments?: Transaction[];
  businessInfo?: {
    name: string;
    address: string[];
    phone: string;
    gstin: string;
    email: string;
  };
  paymentInfo?: {
    upiId: string;
    phone: string;
    accountName: string;
    terms: string[];
  };
}) => {
  // Filter orders based on customer and payment status
  const filteredOrders = orders.filter(order => {
    // Check if the order belongs to this customer
    if (order.customerId !== customer.id) return false;
    
    // Include all orders or only unpaid based on showPaid flag
    return showPaid ? true : order.status !== 'paid';
  }).map(order => {
    // Ensure all orders have an items array
    return {
      ...order,
      items: Array.isArray(order.items) ? order.items : []
    } as OrderWithItems;
  });
  
  // Use the customer's current pending amount instead of calculating from orders
  // This ensures we respect any payments made that aren't tied to specific orders
  const totalPending = typeof customer.pendingAmount === 'number' ? customer.pendingAmount : 
    // Fall back to calculating from orders if customer.pendingAmount isn't available
    filteredOrders.reduce((sum, order) => {
      if (order.status === 'paid') return sum;
      return sum + (typeof order.total === 'number' ? order.total : 0);
    }, 0);
  
  // Calculate total paid amount
  const totalPaid = filteredOrders.reduce((sum, order) => {
    if (order.status !== 'paid') return sum;
    return sum + (typeof order.total === 'number' ? order.total : 0);
  }, 0);
  
  // Calculate grand total of all orders (original billed amount)
  const ordersGrandTotal = filteredOrders.reduce((sum, order) => {
    return sum + (typeof order.total === 'number' ? order.total : 0);
  }, 0);
  
  // Calculate amount that has been paid through separate payments
  // This is the difference between the sum of all orders and the current pending amount
  const paidThroughRecordedPayments = Math.max(0, ordersGrandTotal - totalPending - totalPaid);
  
  // Total pending is already set from customer.pendingAmount
  // Total paid includes both paid orders and recorded separate payments
  const adjustedTotalPaid = totalPaid + paidThroughRecordedPayments;
  
  // Grand total remains the same (sum of pending and all paid amounts)
  const grandTotal = totalPending + adjustedTotalPaid;
  
  // Calculate tax amount (assuming 5% GST)
  const taxAmount = grandTotal * 0.05;
  
  // Check for overdue orders
  const overdueOrders = filteredOrders.filter(order => {
    if (order.status === 'paid') return false;
    
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
    
    try {
      return items.map(item => {
        // Handle different item structures from various sources
        const quantity = typeof item.quantity === 'number' ? 
          item.quantity.toFixed(2) : 
          (item.quantity || '0');
          
        const itemType = item.type || (typeof item.itemId === 'string' && item.itemId.length > 0 ? 'item' : 'product');
        
        const rate = typeof item.rate === 'number' ? 
          item.rate.toFixed(2) : 
          (item.rate || '0');
          
        const details = item.details ? ` (${item.details})` : '';
        
        return `${quantity} kg ${itemType}${details} - ₹${rate}/kg`;
      }).join(', ');
    } catch (error) {
      // Fallback for any parsing errors
      console.error("Error formatting order items:", error);
      return "Items information unavailable";
    }
  };
  
  // Generate a unique order identifier
  const getOrderIdentifier = (order: Order, index: number) => {
    const id = typeof order.id === 'string' ? order.id.substring(0, 8) : `ORDER-${index + 1}`;
    return id.toUpperCase();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.businessLogo}>{businessInfo.name}</Text>
            {businessInfo.address.map((line, index) => (
              <Text key={index} style={styles.businessAddress}>{line}</Text>
            ))}
            <Text style={styles.businessAddress}>Phone: {businessInfo.phone}</Text>
            <Text style={styles.businessAddress}>GSTIN: {businessInfo.gstin}</Text>
            <Text style={styles.businessAddress}>Email: {businessInfo.email}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceSubtitle}># {invoiceNumber}</Text>
          </View>
        </View>
        
        {/* Invoice Details Section */}
        <View style={styles.invoiceDetailsContainer}>
          <View style={styles.invoiceDetailsLeft}>
            <Text style={styles.detailsTitle}>BILL TO:</Text>
            <Text style={styles.customerInfo}>{customer.name}</Text>
            <Text style={styles.customerInfo}>Type: {customer.type === 'hotel' ? 'Hotel/Restaurant' : 'Retail Customer'}</Text>
            {customer.contact && <Text style={styles.customerInfo}>Contact: {customer.contact}</Text>}
          </View>
          <View style={styles.invoiceDetailsRight}>
            <Text style={styles.detailsTitle}>INVOICE DETAILS:</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Invoice Date:</Text>
              <Text style={styles.detailsValue}>{format(parseISO(currentDate), 'dd/MM/yyyy')}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Due Date:</Text>
              <Text style={styles.detailsValue}>{format(parseISO(dueDate), 'dd/MM/yyyy')}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Customer ID:</Text>
              <Text style={styles.detailsValue}>{customer.id.substring(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Payment Status:</Text>
              <Text style={styles.detailsValue}>{totalPending > 0 ? 'PENDING' : 'PAID'}</Text>
            </View>
          </View>
        </View>
        
        {/* Orders Table Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={[styles.tableCol, styles.tableColHeader, styles.tableColId]}>Order ID</Text>
              <Text style={[styles.tableCol, styles.tableColHeader, styles.tableColDate]}>Date</Text>
              <Text style={[styles.tableCol, styles.tableColHeader, styles.tableColItems]}>Items</Text>
              <Text style={[styles.tableCol, styles.tableColHeader, styles.tableColAmount]}>Amount</Text>
              <Text style={[styles.tableCol, styles.tableColHeader, styles.tableColStatus]}>Status</Text>
            </View>
            
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => {
                // Handle different date formats
                let orderDate: Date;
                if (typeof order.date === 'string') {
                  orderDate = parseISO(order.date);
                } else if (order.date instanceof Date) {
                  orderDate = order.date;
                } else {
                  orderDate = new Date();
                }
                
                const daysSincePurchase = differenceInDays(parseISO(currentDate), orderDate);
                const isOverdue = daysSincePurchase >= overdueThresholdDays && order.status !== 'paid';
                const isPaid = order.status === 'paid';
                
                return (
                  <View key={index} style={[
                    styles.tableRow, 
                    index % 2 === 1 ? styles.tableRowEven : {}
                  ]}>
                    <View style={[styles.tableCol, styles.tableColId]}>
                      <Text>{getOrderIdentifier(order, index)}</Text>
                      <Text style={styles.orderNumber}>{format(orderDate, 'dd/MM/yy')}</Text>
                    </View>
                    <Text style={[styles.tableCol, styles.tableColDate]}>
                      {format(orderDate, 'dd/MM/yyyy')}
                    </Text>
                    <Text style={[styles.tableCol, styles.tableColItems]}>
                      {formatOrderItems(Array.isArray(order.items) ? order.items : [])}
                    </Text>
                    <Text style={[styles.tableCol, styles.tableColAmount, styles.monoFont]}>
                      {formatCurrency(typeof order.total === 'number' ? order.total : 0)}
                    </Text>
                    <View style={[styles.tableCol, styles.tableColStatus]}>
                      <Text style={[
                        styles.statusBadge,
                        isPaid ? { backgroundColor: '#dcfce7', color: '#166534' } :
                        isOverdue ? styles.statusOverdue : styles.statusPending
                      ]}>
                        {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, { width: '100%', textAlign: 'center' }]}>No orders found</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Notice Box */}
        {overdueOrders.length > 0 && (
          <View style={[styles.noticeBox, styles.noticeBoxWarning]}>
            <Text style={[styles.noticeText, { color: '#9a3412', fontWeight: 'bold' }]}>
              ⚠️ Payment Notice: {overdueOrders.length} order(s) are overdue by {overdueThresholdDays}+ days.
            </Text>
            <Text style={[styles.noticeText, { color: '#9a3412' }]}>
              Please settle your outstanding balance immediately to avoid service interruptions.
            </Text>
          </View>
        )}
        
        {/* Totals Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalLeft}>
            {/* Payment Instructions */}
            <View style={styles.noticeBox}>
              <Text style={[styles.noticeText, { fontWeight: 'bold' }]}>
                Payment Due: {format(parseISO(dueDate), 'dd/MM/yyyy')}
              </Text>
              <Text style={styles.noticeText}>
                Please include the invoice number ({invoiceNumber}) when making payment.
              </Text>
            </View>
          </View>
          <View style={styles.totalRight}>
            <View style={styles.totalTable}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Original Orders Total:</Text>
                <Text style={styles.totalValue}>{formatCurrency(ordersGrandTotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Already Paid:</Text>
                <Text style={styles.totalValue}>{formatCurrency(adjustedTotalPaid)}</Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowFinal]}>
                <Text style={[styles.totalLabel, styles.totalLabelFinal]}>Current Balance Due:</Text>
                <Text style={[styles.totalValue, styles.totalValueFinal, styles.monoFont]}>{formatCurrency(totalPending)}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Payment History Section */}
        {payments && payments.length > 0 && (
          <View style={{marginTop: 20, marginBottom: 15}}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <Text style={[styles.tableCol, styles.tableColHeader, {width: '25%'}]}>Date</Text>
                <Text style={[styles.tableCol, styles.tableColHeader, {width: '50%'}]}>Description</Text>
                <Text style={[styles.tableCol, styles.tableColHeader, {width: '25%', textAlign: 'right'}]}>Amount</Text>
              </View>
              
              {payments.map((payment, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}>
                  <Text style={[styles.tableCol, {width: '25%'}]}>
                    {format(new Date(payment.date || new Date()), 'dd/MM/yyyy')}
                  </Text>
                  <Text style={[styles.tableCol, {width: '50%'}]}>
                    {payment.description || 'Payment received'}
                  </Text>
                  <Text style={[styles.tableCol, {width: '25%', textAlign: 'right', fontFamily: 'Roboto Mono'}]}>
                    {formatCurrency(payment.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Payment Section */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionTitle}>Payment Information</Text>
          <View style={styles.paymentDetailsContainer}>
            <View style={styles.paymentDetails}>
              <Text style={[styles.paymentMethod, { fontWeight: 'bold' }]}>UPI Payment:</Text>
              <Text style={styles.paymentMethod}>UPI ID: {paymentInfo.upiId}</Text>
              <Text style={styles.paymentMethod}>Google Pay: {paymentInfo.phone}</Text>
              <Text style={styles.paymentMethod}>Account Name: {paymentInfo.accountName}</Text>
              
              <Text style={[styles.paymentMethod, { fontWeight: 'bold', marginTop: 10 }]}>Terms & Conditions:</Text>
              {paymentInfo.terms.map((term, index) => (
                <Text key={index} style={styles.paymentInstruction}>• {term}</Text>
              ))}
            </View>
            <View style={styles.paymentQR}>
              <Image src={qrCodeImage} style={{ width: 80, height: 80 }} />
              <Text style={{ fontSize: 8, marginTop: 5, textAlign: 'center' }}>Scan to Pay</Text>
            </View>
          </View>
        </View>
        
        {/* Conditional Watermark */}
        {totalPending === 0 && (
          <Text style={styles.watermark}>PAID</Text>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerText}>Invoice generated on {format(parseISO(currentDate), 'dd/MM/yyyy')} at {format(new Date(), 'HH:mm')}</Text>
          <Text style={styles.footerText}>{businessInfo.name} - {businessInfo.phone} - {businessInfo.email}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Main component interfaces
interface CustomerInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  orders: Order[];
}

// More specific type for order with items
interface OrderWithItems extends Order {
  items: Array<{
    quantity: number;
    type: string;
    rate: number;
    details?: string;
    itemId?: string;
  }>;
}

export default function CustomerInvoice({ 
  isOpen, 
  onClose, 
  customer,
  orders 
}: CustomerInvoiceProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('preview');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 15), 'yyyy-MM-dd'));
  const [includeAllOrders, setIncludeAllOrders] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [customerPayments, setCustomerPayments] = useState<Transaction[]>([]);
  
  // Generate invoice number on component mount
  useEffect(() => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const customerPrefix = customer.name.substring(0, 2).toUpperCase();
    setInvoiceNumber(`INV-${customerPrefix}${timestamp}`);
    
    // Cleanup function to revoke blob URL when component unmounts
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [customer.name]);
  
  // Fetch customer payment transactions
  useEffect(() => {
    const fetchCustomerPayments = async () => {
      try {
        if (customer?.id) {
          // Fetch all transactions for this customer
          const payments = await getTransactionsByEntity(customer.id, 'customer');
          // Filter to only include receipt type transactions (payments received)
          const filteredPayments = payments.filter(payment => payment.type === 'receipt');
          setCustomerPayments(filteredPayments);
        }
      } catch (error) {
        console.error("Error fetching customer payments:", error);
        toast({
          title: "Failed to load payment history",
          description: "Could not retrieve this customer's payment history.",
          variant: "destructive"
        });
      }
    };
    
    fetchCustomerPayments();
  }, [customer?.id, toast]);
  
  // Filter to get only this customer's orders
  const customerOrders = useMemo(() => {
    return orders.filter(order => order.customerId === customer.id);
  }, [orders, customer.id]);
  
  // Get summary statistics
  const totalOrders = customerOrders.length;
  const pendingOrders = customerOrders.filter(order => order.status !== 'paid').length;
  const pendingAmount = customerOrders.reduce((sum, order) => {
    if (order.status === 'paid') return sum;
    return sum + (typeof order.total === 'number' ? order.total : 0);
  }, 0);
  
  // Check for overdue orders (older than 15 days)
  const overdueOrders = customerOrders.filter(order => {
    if (order.status === 'paid') return false;
    
    let orderDate: Date;
    if (typeof order.date === 'string') {
      orderDate = parseISO(order.date);
    } else if (order.date instanceof Date) {
      orderDate = order.date;
    } else {
      orderDate = new Date();
    }
    
    return differenceInDays(new Date(), orderDate) >= 15;
  });
  
  // Copy invoice number to clipboard
  const copyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoiceNumber).then(() => {
      toast({
        title: "Copied to clipboard!",
        description: `Invoice number ${invoiceNumber} has been copied.`
      });
    });
  };
  
  // Reset PDF preview when tabs change
  useEffect(() => {
    if (activeTab !== 'preview') {
      setShowPdfPreview(false);
    }
  }, [activeTab]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden w-[95vw] sm:w-auto">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="text-xl sm:text-2xl">Customer Invoice</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="preview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 sm:px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" className="text-xs sm:text-sm px-1 sm:px-3 py-1 h-auto sm:h-10">
                <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Preview</span> Invoice
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm px-1 sm:px-3 py-1 h-auto sm:h-10">
                <FileTextIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Invoice</span> Settings
              </TabsTrigger>
              <TabsTrigger value="export" className="text-xs sm:text-sm px-1 sm:px-3 py-1 h-auto sm:h-10">
                <DownloadIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Export <span className="hidden xs:inline">Options</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="preview" className="p-4 sm:p-6 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Invoice Preview</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Review the invoice before generating
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-8 sm:h-9 w-full sm:w-auto"
                      onClick={() => setShowPdfPreview(!showPdfPreview)}
                    >
                      {showPdfPreview ? 'Hide PDF Preview' : 'Show PDF Preview'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-5">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  {/* Customer Information */}
                  <div className="w-full md:w-1/2 space-y-2 sm:space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm text-muted-foreground">Customer</Label>
                      <div className="font-medium text-base sm:text-lg">{customer.name}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2">
                      <div>
                        <Label className="text-xs sm:text-sm text-muted-foreground">Type</Label>
                        <div className="text-sm sm:text-base">{customer.type === 'hotel' ? 'Hotel/Restaurant' : 'Retail'}</div>
                      </div>
                      
                      {customer.contact && (
                        <div>
                          <Label className="text-xs sm:text-sm text-muted-foreground">Contact</Label>
                          <div className="text-sm sm:text-base">{customer.contact}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Invoice Summary */}
                  <div className="w-full md:w-1/2 flex flex-col gap-3 sm:gap-4 bg-muted/50 p-3 sm:p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-sm sm:text-base">Invoice Summary</h3>
                      <div className="text-xs sm:text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">
                        #{invoiceNumber}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-1 sm:gap-y-2 text-xs sm:text-sm">
                      <div className="text-muted-foreground">Total Orders:</div>
                      <div className="font-medium">{totalOrders}</div>
                      
                      <div className="text-muted-foreground">Pending Orders:</div>
                      <div className="font-medium">{pendingOrders}</div>
                      
                      <div className="text-muted-foreground">Overdue Orders:</div>
                      <div className="font-medium text-destructive">{overdueOrders.length}</div>
                      
                      <div className="text-muted-foreground">Pending Amount:</div>
                      <div className="font-medium">₹{pendingAmount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                
                {showPdfPreview ? (
                  <div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
                    <PDFViewer width="100%" height="100%" className="border-0">
                      <InvoicePDF 
                        customer={customer} 
                        orders={customerOrders} 
                        currentDate={invoiceDate}
                        invoiceNumber={invoiceNumber}
                        dueDate={dueDate}
                        showPaid={includeAllOrders}
                        payments={customerPayments}
                      />
                    </PDFViewer>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
                    <FileTextIcon className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">PDF Preview Hidden</h3>
                    <p className="text-sm text-gray-500 text-center max-w-md">
                      Click "Show PDF Preview" to view the complete invoice document with all details.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowPdfPreview(true)}
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      Show PDF Preview
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="p-6 pt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
                <CardDescription>
                  Customize your invoice details
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Basic Settings */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <div className="flex">
                      <Input 
                        id="invoiceNumber" 
                        value={invoiceNumber} 
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="ml-2"
                        onClick={copyInvoiceNumber}
                      >
                        <ClipboardCopyIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                    <div className="flex">
                      <Input 
                        id="invoiceDate" 
                        type="date" 
                        value={invoiceDate} 
                        onChange={(e) => setInvoiceDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <div className="flex">
                      <Input 
                        id="dueDate" 
                        type="date" 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Content Options */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Content Options</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeAllOrders" 
                      checked={includeAllOrders}
                      onCheckedChange={(checked) => setIncludeAllOrders(!!checked)}
                    />
                    <label
                      htmlFor="includeAllOrders"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Include paid orders in invoice
                    </label>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start space-x-2">
                    <InfoIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Payment Reminder</p>
                      <p className="mt-1">
                        This invoice will include a payment reminder notice for any orders that are 
                        more than 15 days overdue. Currently, there {overdueOrders.length === 1 ? 'is' : 'are'} <span className="font-semibold">{overdueOrders.length}</span> overdue {overdueOrders.length === 1 ? 'order' : 'orders'}.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="export" className="p-6 pt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Download or share the invoice
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Download PDF */}
                  <Card className="border-2 border-primary/10 hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <DownloadIcon className="w-4 h-4 mr-2 text-primary" />
                        Download PDF
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download the invoice as a PDF file to your device.
                      </p>
                      <PDFDownloadLink
                        document={
                          <InvoicePDF 
                            customer={customer} 
                            orders={customerOrders} 
                            currentDate={invoiceDate}
                            invoiceNumber={invoiceNumber}
                            dueDate={dueDate}
                            showPaid={includeAllOrders}
                          />
                        }
                        fileName={`invoice-${customer.name}-${invoiceNumber}.pdf`}
                        className="w-full"
                      >
                        {({ loading, error }) => (
                          <Button 
                            className="w-full" 
                            disabled={loading}
                          >
                            {loading ? 'Generating PDF...' : 'Download Invoice'}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    </CardContent>
                  </Card>
                  
                  {/* Print Invoice */}
                  <Card className="border-2 border-primary/10 hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <PrinterIcon className="w-4 h-4 mr-2 text-primary" />
                        Print Invoice
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Open a printable view of the invoice for physical copies.
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          setActiveTab('preview');
                          setShowPdfPreview(true);
                          setTimeout(() => {
                            window.print();
                          }, 500);
                        }}
                      >
                        Print Invoice
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <Separator />
                
                {/* Future features section */}
                <div className="space-y-2">
                  <h3 className="font-medium">Coming Soon</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 flex items-center">
                        <MailIcon className="w-4 h-4 mr-3 text-muted-foreground" />
                        <div>
                          <h4 className="text-sm font-medium">Email Invoice</h4>
                          <p className="text-xs text-muted-foreground">Send directly to customer</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 flex items-center">
                        <ShareIcon className="w-4 h-4 mr-3 text-muted-foreground" />
                        <div>
                          <h4 className="text-sm font-medium">Share Invoice</h4>
                          <p className="text-xs text-muted-foreground">Via WhatsApp or SMS</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 flex items-center">
                        <CreditCardIcon className="w-4 h-4 mr-3 text-muted-foreground" />
                        <div>
                          <h4 className="text-sm font-medium">Payment Link</h4>
                          <p className="text-xs text-muted-foreground">Generate payment URL</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center">
            <CheckCircle2Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500 flex-shrink-0" />
            <span>Invoice #{invoiceNumber} is ready</span>
          </div>
          <div className="flex flex-col xs:flex-row w-full sm:w-auto gap-2 xs:space-x-2">
            <Button variant="outline" onClick={onClose} className="text-xs sm:text-sm h-8 sm:h-9 w-full xs:w-auto">Close</Button>
            <PDFDownloadLink
              document={
                <InvoicePDF 
                  customer={customer} 
                  orders={customerOrders} 
                  currentDate={invoiceDate}
                  invoiceNumber={invoiceNumber}
                  dueDate={dueDate}
                  showPaid={includeAllOrders}
                  payments={customerPayments}
                />
              }
              fileName={`invoice-${customer.name}-${invoiceNumber}.pdf`}
              className="w-full xs:w-auto"
            >
              {({ loading }) => (
                <Button disabled={loading} className="text-xs sm:text-sm h-8 sm:h-9 w-full">
                  {loading ? 'Generating...' : 'Download Invoice'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}