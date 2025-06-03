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

// Register custom fonts for PDF
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

interface OrderWithItems extends Order {
  items: any[];
}

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
    if (order.customerId !== customer.id) return false;
    return showPaid ? true : order.status !== 'paid';
  }).map(order => ({
    ...order,
    items: Array.isArray(order.items) ? order.items : []
  } as OrderWithItems));
  
  // Calculate totals
  const totalPending = typeof customer.pendingAmount === 'number' ? customer.pendingAmount : 
    filteredOrders.reduce((sum, order) => {
      if (order.status === 'paid') return sum;
      return sum + (typeof order.total === 'number' ? order.total : 0);
    }, 0);
  
  const totalPaid = filteredOrders.reduce((sum, order) => {
    if (order.status !== 'paid') return sum;
    return sum + (typeof order.total === 'number' ? order.total : 0);
  }, 0);
  
  const ordersGrandTotal = filteredOrders.reduce((sum, order) => {
    return sum + (typeof order.total === 'number' ? order.total : 0);
  }, 0);
  
  const paidThroughRecordedPayments = Math.max(0, ordersGrandTotal - totalPending - totalPaid);
  const adjustedTotalPaid = totalPaid + paidThroughRecordedPayments;
  const grandTotal = totalPending + adjustedTotalPaid;
  const taxAmount = grandTotal * 0.05;
  
  // Check for overdue orders
  const overdueOrders = filteredOrders.filter(order => {
    if (order.status === 'paid') return false;
    
    let orderDate: Date;
    if (typeof order.date === 'string') {
      orderDate = parseISO(order.date);
    } else if (order.date instanceof Date) {
      orderDate = order.date;
    } else {
      orderDate = new Date();
    }
    
    const currentDateObj = parseISO(currentDate);
    return differenceInDays(currentDateObj, orderDate) >= overdueThresholdDays;
  });
  
  // Format order items for display
  const formatOrderItems = (items: any[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) return "No items";
    
    try {
      return items.map(item => {
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
      console.error("Error formatting order items:", error);
      return "Items information unavailable";
    }
  };
  
  const getOrderIdentifier = (order: Order, index: number) => {
    const id = typeof order.id === 'string' ? order.id.substring(0, 8) : `ORDER-${index + 1}`;
    return id.toUpperCase();
  };
  
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
            
            {filteredOrders.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, { width: '100%', textAlign: 'center' }]}>
                  No orders found for this customer
                </Text>
              </View>
            ) : (
              filteredOrders.map((order, index) => {
                const isOverdue = overdueOrders.some(o => o.id === order.id);
                const orderDate = typeof order.date === 'string' ? parseISO(order.date) : 
                                 order.date instanceof Date ? order.date : new Date();
                
                return (
                  <View key={order.id} style={[styles.tableRow, index % 2 === 0 ? {} : styles.tableRowEven]}>
                    <View style={[styles.tableCol, styles.tableColId]}>
                      <Text style={styles.orderNumber}>
                        {getOrderIdentifier(order, index)}
                      </Text>
                    </View>
                    <Text style={[styles.tableCol, styles.tableColDate]}>
                      {format(orderDate, 'dd/MM/yyyy')}
                    </Text>
                    <Text style={[styles.tableCol, styles.tableColItems]}>
                      {formatOrderItems(order.items)}
                    </Text>
                    <Text style={[styles.tableCol, styles.tableColAmount, styles.monoFont]}>
                      {formatCurrency(order.total)}
                    </Text>
                    <View style={[styles.tableCol, styles.tableColStatus]}>
                      <Text style={[
                        styles.statusBadge, 
                        order.status === 'paid' 
                          ? { color: '#065f46', backgroundColor: '#d1fae5' }
                          : isOverdue 
                            ? styles.statusOverdue 
                            : styles.statusPending
                      ]}>
                        {order.status === 'paid' ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Totals Section */}
          <View style={styles.totalSection}>
            <View style={styles.totalLeft}>
              {overdueOrders.length > 0 && (
                <View style={[styles.noticeBox, styles.noticeBoxWarning]}>
                  <Text style={styles.noticeText}>
                    ⚠ {overdueOrders.length} order(s) are overdue by more than {overdueThresholdDays} days
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.totalRight}>
              <View style={styles.totalTable}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={[styles.totalValue, styles.monoFont]}>{formatCurrency(ordersGrandTotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax (5% GST):</Text>
                  <Text style={[styles.totalValue, styles.monoFont]}>{formatCurrency(taxAmount)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Paid:</Text>
                  <Text style={[styles.totalValue, styles.monoFont, { color: '#065f46' }]}>
                    -{formatCurrency(adjustedTotalPaid)}
                  </Text>
                </View>
                <View style={[styles.totalRow, styles.totalRowFinal]}>
                  <Text style={[styles.totalLabel, styles.totalLabelFinal]}>Amount Due:</Text>
                  <Text style={[styles.totalValue, styles.totalValueFinal, styles.monoFont]}>
                    {formatCurrency(totalPending)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Information Section */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionTitle}>Payment Information</Text>
          <View style={styles.paymentDetailsContainer}>
            <View style={styles.paymentDetails}>
              <Text style={[styles.paymentMethod, { fontWeight: 'bold' }]}>Payment Methods:</Text>
              <Text style={styles.paymentMethod}>UPI ID: {paymentInfo.upiId}</Text>
              <Text style={styles.paymentMethod}>Phone: {paymentInfo.phone}</Text>
              <Text style={styles.paymentMethod}>Account Name: {paymentInfo.accountName}</Text>
              
              <Text style={[styles.paymentMethod, { fontWeight: 'bold', marginTop: 10 }]}>Payment Terms:</Text>
              {paymentInfo.terms.map((term, index) => (
                <Text key={index} style={styles.paymentInstruction}>• {term}</Text>
              ))}
            </View>
            <View style={styles.paymentQR}>
              <Text style={[styles.paymentInstruction, { marginBottom: 5 }]}>Scan QR Code for Payment</Text>
              <Image 
                src={qrCodeImage} 
                style={{ width: 80, height: 80, border: '1px solid #e5e7eb' }}
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {format(parseISO(currentDate), 'dd/MM/yyyy HH:mm')} | Invoice #{invoiceNumber}
          </Text>
          <Text style={styles.footerText}>
            This is a computer-generated invoice and does not require a signature.
          </Text>
        </View>

        {/* Watermark for unpaid invoices */}
        {totalPending > 0 && (
          <Text style={styles.watermark}>PENDING</Text>
        )}
      </Page>
    </Document>
  );
};

interface CustomerInvoiceProps {
  customer: Customer;
  orders: Order[];
  isOpen: boolean;
  onClose: () => void;
  onPaymentMade?: (amount: number) => void;
}

export function CustomerInvoice({ 
  customer, 
  orders, 
  isOpen, 
  onClose, 
  onPaymentMade 
}: CustomerInvoiceProps) {
  const { toast } = useToast();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [overdueThresholdDays, setOverdueThresholdDays] = useState(15);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPaid, setShowPaid] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // Initialize dates and invoice number
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const due = addDays(today, 15);
      setCurrentDate(today.toISOString().split('T')[0]);
      setDueDate(due.toISOString().split('T')[0]);
      setInvoiceNumber(`INV-${format(today, 'yyyyMMdd')}-${customer.id.substring(0, 4).toUpperCase()}`);
      
      // Load transactions for this customer
      loadTransactions();
    }
  }, [isOpen, customer.id]);

  const loadTransactions = async () => {
    try {
      const customerTransactions = await getTransactionsByEntity(customer.id);
      // Transform the Firestore data to match the Transaction type
      const transformedTransactions = customerTransactions.map((tx: any) => ({
        id: tx.id || tx.firebaseId,
        type: tx.type || 'payment',
        entityId: tx.entityId || customer.id,
        entityType: tx.entityType || 'customer',
        amount: tx.amount || 0,
        description: tx.description || null,
        date: tx.date || tx.createdAt || new Date()
      }));
      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    }
  };

  // Filter orders based on customer and settings
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.customerId !== customer.id) return false;
      return showPaid ? true : order.status !== 'paid';
    }).map(order => ({
      ...order,
      items: Array.isArray(order.items) ? order.items : []
    } as OrderWithItems));
  }, [orders, customer.id, showPaid]);

  // Calculate totals
  const calculations = useMemo(() => {
    const totalPending = typeof customer.pendingAmount === 'number' ? customer.pendingAmount : 
      filteredOrders.reduce((sum, order) => {
        if (order.status === 'paid') return sum;
        return sum + (typeof order.total === 'number' ? order.total : 0);
      }, 0);
    
    const totalPaid = filteredOrders.reduce((sum, order) => {
      if (order.status !== 'paid') return sum;
      return sum + (typeof order.total === 'number' ? order.total : 0);
    }, 0);
    
    const ordersGrandTotal = filteredOrders.reduce((sum, order) => {
      return sum + (typeof order.total === 'number' ? order.total : 0);
    }, 0);
    
    const paidThroughRecordedPayments = Math.max(0, ordersGrandTotal - totalPending - totalPaid);
    const adjustedTotalPaid = totalPaid + paidThroughRecordedPayments;
    const grandTotal = totalPending + adjustedTotalPaid;
    const taxAmount = grandTotal * 0.05;

    return {
      totalPending,
      totalPaid,
      adjustedTotalPaid,
      grandTotal,
      taxAmount,
      ordersGrandTotal
    };
  }, [filteredOrders, customer.pendingAmount]);

  // Check for overdue orders
  const overdueOrders = useMemo(() => {
    return filteredOrders.filter(order => {
      if (order.status === 'paid') return false;
      
      let orderDate: Date;
      if (typeof order.date === 'string') {
        orderDate = parseISO(order.date);
      } else if (order.date instanceof Date) {
        orderDate = order.date;
      } else {
        orderDate = new Date();
      }
      
      const currentDateObj = parseISO(currentDate);
      return differenceInDays(currentDateObj, orderDate) >= overdueThresholdDays;
    });
  }, [filteredOrders, currentDate, overdueThresholdDays]);

  const formatOrderItems = (items: any[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) return "No items";
    
    try {
      return items.map(item => {
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
      console.error("Error formatting order items:", error);
      return "Items information unavailable";
    }
  };

  const getOrderIdentifier = (order: Order, index: number) => {
    const id = typeof order.id === 'string' ? order.id.substring(0, 8) : `ORDER-${index + 1}`;
    return id.toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const handleClose = () => {
    setSelectedOrders([]);
    setIncludeHistory(false);
    setShowPDFPreview(false);
    onClose();
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleEmailInvoice = () => {
    toast({
      title: "Email Invoice",
      description: "Email functionality will be implemented with backend integration.",
    });
  };

  const pdfFileName = `Invoice_${invoiceNumber}_${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Invoice for {customer.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Invoice Preview</TabsTrigger>
            <TabsTrigger value="pdf">PDF View</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-6">
            {/* Invoice Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Invoice Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentDate">Invoice Date</Label>
                    <Input
                      id="currentDate"
                      type="date"
                      value={currentDate}
                      onChange={(e) => setCurrentDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPaid"
                      checked={showPaid}
                      onCheckedChange={(checked) => setShowPaid(checked as boolean)}
                    />
                    <Label htmlFor="showPaid">Include paid orders</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-blue-600">Bismi Broiler's</CardTitle>
                    <CardDescription className="mt-2">
                      Near Busstand, Hayarnisha Hospital<br />
                      Mudukulathur<br />
                      Phone: +91 8681087082<br />
                      GSTIN: 33AADCB1234F1Z5<br />
                      Email: bismi.broilers@gmail.com
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-blue-600">INVOICE</h2>
                    <p className="text-sm text-gray-600">#{invoiceNumber}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bill To:</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{customer.name}</p>
                    <p>Type: {customer.type === 'hotel' ? 'Hotel/Restaurant' : 'Retail Customer'}</p>
                    {customer.contact && <p>Contact: {customer.contact}</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details:</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Invoice Date:</span>
                      <span>{format(parseISO(currentDate), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span>{format(parseISO(dueDate), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer ID:</span>
                      <span>{customer.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Status:</span>
                      <span className={calculations.totalPending > 0 ? 'text-orange-600' : 'text-green-600'}>
                        {calculations.totalPending > 0 ? 'PENDING' : 'PAID'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                {overdueOrders.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-800">
                        {overdueOrders.length} order(s) are overdue by more than {overdueThresholdDays} days
                      </span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-2 text-left">Order ID</th>
                        <th className="border border-gray-200 p-2 text-left">Date</th>
                        <th className="border border-gray-200 p-2 text-left">Items</th>
                        <th className="border border-gray-200 p-2 text-right">Amount</th>
                        <th className="border border-gray-200 p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-gray-200 p-4 text-center text-gray-500">
                            No orders found for this customer
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order, index) => {
                          const isOverdue = overdueOrders.some(o => o.id === order.id);
                          const orderDate = typeof order.date === 'string' ? parseISO(order.date) : 
                                           order.date instanceof Date ? order.date : new Date();
                          
                          return (
                            <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-200 p-2">
                                <div className="text-sm">
                                  {getOrderIdentifier(order, index)}
                                </div>
                              </td>
                              <td className="border border-gray-200 p-2">
                                {format(orderDate, 'dd/MM/yyyy')}
                              </td>
                              <td className="border border-gray-200 p-2">
                                <div className="text-sm max-w-xs truncate" title={formatOrderItems(order.items)}>
                                  {formatOrderItems(order.items)}
                                </div>
                              </td>
                              <td className="border border-gray-200 p-2 text-right font-mono">
                                {formatCurrency(order.total)}
                              </td>
                              <td className="border border-gray-200 p-2 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  order.status === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : isOverdue 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {order.status === 'paid' ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-72">
                    <div className="border border-gray-200 rounded">
                      <div className="border-b border-gray-200 p-3 flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-mono">{formatCurrency(calculations.ordersGrandTotal)}</span>
                      </div>
                      <div className="border-b border-gray-200 p-3 flex justify-between">
                        <span>Tax (5% GST):</span>
                        <span className="font-mono">{formatCurrency(calculations.taxAmount)}</span>
                      </div>
                      <div className="border-b border-gray-200 p-3 flex justify-between">
                        <span>Total Paid:</span>
                        <span className="font-mono text-green-600">-{formatCurrency(calculations.adjustedTotalPaid)}</span>
                      </div>
                      <div className="bg-gray-50 p-3 flex justify-between font-bold">
                        <span>Amount Due:</span>
                        <span className="font-mono text-lg">{formatCurrency(calculations.totalPending)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Payment Methods:</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>UPI ID:</strong> 9514499968@ybl</p>
                      <p><strong>Phone:</strong> +91 9514499968</p>
                      <p><strong>Account Name:</strong> Bismi Broiler's</p>
                    </div>
                    
                    <h4 className="font-medium mt-4 mb-2">Payment Terms:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Payment is due within 15 days of invoice date</li>
                      <li>• Late payments may be subject to 2% monthly interest charges</li>
                      <li>• For queries regarding this invoice, please contact our accounts department</li>
                    </ul>
                  </div>
                  <div className="flex justify-center items-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Scan QR Code for Payment</p>
                      <img
                        src={qrCodeImage}
                        alt="Payment QR Code"
                        className="w-32 h-32 border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <PDFViewer width="100%" height="600px" className="border-none">
                <InvoicePDF
                  customer={customer}
                  orders={filteredOrders}
                  currentDate={currentDate}
                  invoiceNumber={invoiceNumber}
                  dueDate={dueDate}
                  showPaid={showPaid}
                  overdueThresholdDays={overdueThresholdDays}
                  payments={transactions}
                />
              </PDFViewer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrintInvoice}>
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print
              </Button>
              <PDFDownloadLink
                document={
                  <InvoicePDF
                    customer={customer}
                    orders={filteredOrders}
                    currentDate={currentDate}
                    invoiceNumber={invoiceNumber}
                    dueDate={dueDate}
                    showPaid={showPaid}
                    overdueThresholdDays={overdueThresholdDays}
                    payments={transactions}
                  />
                }
                fileName={pdfFileName}
              >
                {({ blob, url, loading, error }) => (
                  <Button variant="outline" disabled={loading}>
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    {loading ? 'Generating...' : 'Download PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
              <Button variant="outline" onClick={handleEmailInvoice}>
                <MailIcon className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {onPaymentMade && calculations.totalPending > 0 && (
                <Button onClick={() => onPaymentMade?.(calculations.totalPending)}>
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}