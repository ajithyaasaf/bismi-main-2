import { IStorage } from './storage';
import { Customer, Supplier, Order, Transaction } from '../shared/schema';

interface BalanceReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalCustomers: number;
    totalSuppliers: number;
    totalOrders: number;
    totalTransactions: number;
    calculatedCustomerBalances: Record<string, number>;
    calculatedSupplierBalances: Record<string, number>;
    actualCustomerBalances: Record<string, number>;
    actualSupplierBalances: Record<string, number>;
    discrepancies: {
      customers: Array<{ id: string; name: string; calculated: number; actual: number; difference: number }>;
      suppliers: Array<{ id: string; name: string; calculated: number; actual: number; difference: number }>;
    };
  };
}

export class BalanceValidator {
  constructor(private storage: IStorage) {}

  async validateAllBalances(): Promise<BalanceReport> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Fetch all data
    const customers = await this.storage.getAllCustomers();
    const suppliers = await this.storage.getAllSuppliers();
    const orders = await this.storage.getAllOrders();
    const transactions = await this.storage.getAllTransactions();

    console.log('\n=== COMPREHENSIVE BALANCE VALIDATION ===');
    console.log(`Found ${customers.length} customers`);
    console.log(`Found ${suppliers.length} suppliers`);
    console.log(`Found ${orders.length} orders`);
    console.log(`Found ${transactions.length} transactions`);

    // Calculate expected balances
    const calculatedCustomerBalances = this.calculateCustomerBalances(customers, orders, transactions);
    const calculatedSupplierBalances = this.calculateSupplierBalances(suppliers, transactions);

    // Get actual balances
    const actualCustomerBalances: Record<string, number> = {};
    const actualSupplierBalances: Record<string, number> = {};

    customers.forEach(customer => {
      actualCustomerBalances[customer.id] = customer.pendingAmount || 0;
    });

    suppliers.forEach(supplier => {
      actualSupplierBalances[supplier.id] = supplier.debt || 0;
    });

    // Find discrepancies
    const customerDiscrepancies = this.findCustomerDiscrepancies(
      customers, calculatedCustomerBalances, actualCustomerBalances
    );
    const supplierDiscrepancies = this.findSupplierDiscrepancies(
      suppliers, calculatedSupplierBalances, actualSupplierBalances
    );

    // Log detailed findings
    this.logDetailedFindings(
      customers, suppliers, orders, transactions,
      calculatedCustomerBalances, calculatedSupplierBalances,
      actualCustomerBalances, actualSupplierBalances,
      customerDiscrepancies, supplierDiscrepancies
    );

    // Generate errors and warnings
    customerDiscrepancies.forEach(disc => {
      if (Math.abs(disc.difference) > 0.01) {
        errors.push(`Customer ${disc.name} (${disc.id}): Expected balance ₹${disc.calculated.toFixed(2)}, actual ₹${disc.actual.toFixed(2)}, difference ₹${disc.difference.toFixed(2)}`);
      }
    });

    supplierDiscrepancies.forEach(disc => {
      if (Math.abs(disc.difference) > 0.01) {
        errors.push(`Supplier ${disc.name} (${disc.id}): Expected debt ₹${disc.calculated.toFixed(2)}, actual ₹${disc.actual.toFixed(2)}, difference ₹${disc.difference.toFixed(2)}`);
      }
    });

    // Check for orphaned records
    const orphanedOrders = orders.filter(order => 
      !customers.find(customer => customer.id === order.customerId)
    );
    
    orphanedOrders.forEach(order => {
      errors.push(`Orphaned order ${order.id}: references non-existent customer ${order.customerId}`);
    });

    const orphanedTransactions = transactions.filter(transaction =>
      (transaction.entityType === 'customer' && !customers.find(c => c.id === transaction.entityId)) ||
      (transaction.entityType === 'supplier' && !suppliers.find(s => s.id === transaction.entityId))
    );

    orphanedTransactions.forEach(transaction => {
      errors.push(`Orphaned transaction ${transaction.id}: references non-existent ${transaction.entityType} ${transaction.entityId}`);
    });

    // Check for duplicate IDs
    const customerIds = customers.map(c => c.id);
    const duplicateCustomerIds = customerIds.filter((id, index) => customerIds.indexOf(id) !== index);
    duplicateCustomerIds.forEach(id => {
      errors.push(`Duplicate customer ID found: ${id}`);
    });

    const supplierIds = suppliers.map(s => s.id);
    const duplicateSupplierIds = supplierIds.filter((id, index) => supplierIds.indexOf(id) !== index);
    duplicateSupplierIds.forEach(id => {
      errors.push(`Duplicate supplier ID found: ${id}`);
    });

    const orderIds = orders.map(o => o.id);
    const duplicateOrderIds = orderIds.filter((id, index) => orderIds.indexOf(id) !== index);
    duplicateOrderIds.forEach(id => {
      errors.push(`Duplicate order ID found: ${id}`);
    });

    const transactionIds = transactions.map(t => t.id);
    const duplicateTransactionIds = transactionIds.filter((id, index) => transactionIds.indexOf(id) !== index);
    duplicateTransactionIds.forEach(id => {
      errors.push(`Duplicate transaction ID found: ${id}`);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length,
        totalOrders: orders.length,
        totalTransactions: transactions.length,
        calculatedCustomerBalances,
        calculatedSupplierBalances,
        actualCustomerBalances,
        actualSupplierBalances,
        discrepancies: {
          customers: customerDiscrepancies,
          suppliers: supplierDiscrepancies
        }
      }
    };
  }

  private calculateCustomerBalances(
    customers: Customer[], 
    orders: Order[], 
    transactions: Transaction[]
  ): Record<string, number> {
    const balances: Record<string, number> = {};

    // Initialize all customer balances to 0
    customers.forEach(customer => {
      balances[customer.id] = 0;
    });

    // Add order amounts for unpaid orders
    orders.forEach(order => {
      if (order.status !== 'paid' && balances.hasOwnProperty(order.customerId)) {
        balances[order.customerId] += order.total || 0;
      }
    });

    // Subtract customer payments (receipt transactions)
    transactions.forEach(transaction => {
      if (transaction.entityType === 'customer' && transaction.type === 'receipt') {
        if (balances.hasOwnProperty(transaction.entityId)) {
          balances[transaction.entityId] -= transaction.amount;
        }
      }
    });

    return balances;
  }

  private calculateSupplierBalances(
    suppliers: Supplier[], 
    transactions: Transaction[]
  ): Record<string, number> {
    const balances: Record<string, number> = {};

    // Initialize all supplier balances to 0
    suppliers.forEach(supplier => {
      balances[supplier.id] = 0;
    });

    // Process supplier transactions
    transactions.forEach(transaction => {
      if (transaction.entityType === 'supplier') {
        if (balances.hasOwnProperty(transaction.entityId)) {
          if (transaction.type === 'expense') {
            // Expense increases debt
            balances[transaction.entityId] += transaction.amount;
          } else if (transaction.type === 'payment') {
            // Payment reduces debt
            balances[transaction.entityId] -= transaction.amount;
          }
        }
      }
    });

    return balances;
  }

  private findCustomerDiscrepancies(
    customers: Customer[],
    calculated: Record<string, number>,
    actual: Record<string, number>
  ) {
    return customers.map(customer => {
      const calculatedBalance = calculated[customer.id] || 0;
      const actualBalance = actual[customer.id] || 0;
      return {
        id: customer.id,
        name: customer.name,
        calculated: calculatedBalance,
        actual: actualBalance,
        difference: actualBalance - calculatedBalance
      };
    }).filter(disc => Math.abs(disc.difference) > 0.01);
  }

  private findSupplierDiscrepancies(
    suppliers: Supplier[],
    calculated: Record<string, number>,
    actual: Record<string, number>
  ) {
    return suppliers.map(supplier => {
      const calculatedDebt = calculated[supplier.id] || 0;
      const actualDebt = actual[supplier.id] || 0;
      return {
        id: supplier.id,
        name: supplier.name,
        calculated: calculatedDebt,
        actual: actualDebt,
        difference: actualDebt - calculatedDebt
      };
    }).filter(disc => Math.abs(disc.difference) > 0.01);
  }

  private logDetailedFindings(
    customers: Customer[],
    suppliers: Supplier[],
    orders: Order[],
    transactions: Transaction[],
    calculatedCustomerBalances: Record<string, number>,
    calculatedSupplierBalances: Record<string, number>,
    actualCustomerBalances: Record<string, number>,
    actualSupplierBalances: Record<string, number>,
    customerDiscrepancies: any[],
    supplierDiscrepancies: any[]
  ) {
    console.log('\n=== CUSTOMER BALANCE ANALYSIS ===');
    customers.forEach(customer => {
      const customerOrders = orders.filter(o => o.customerId === customer.id);
      const unpaidOrders = customerOrders.filter(o => o.status !== 'paid');
      const customerPayments = transactions.filter(t => 
        t.entityType === 'customer' && t.entityId === customer.id && t.type === 'receipt'
      );

      console.log(`\nCustomer: ${customer.name} (${customer.id})`);
      console.log(`  Total Orders: ${customerOrders.length}`);
      console.log(`  Unpaid Orders: ${unpaidOrders.length}`);
      console.log(`  Unpaid Amount: ₹${unpaidOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}`);
      console.log(`  Payments Received: ${customerPayments.length}`);
      console.log(`  Total Payments: ₹${customerPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`);
      console.log(`  Calculated Balance: ₹${calculatedCustomerBalances[customer.id]?.toFixed(2) || '0.00'}`);
      console.log(`  Actual Balance: ₹${actualCustomerBalances[customer.id]?.toFixed(2) || '0.00'}`);
    });

    console.log('\n=== SUPPLIER BALANCE ANALYSIS ===');
    suppliers.forEach(supplier => {
      const supplierTransactions = transactions.filter(t => 
        t.entityType === 'supplier' && t.entityId === supplier.id
      );
      const expenses = supplierTransactions.filter(t => t.type === 'expense');
      const payments = supplierTransactions.filter(t => t.type === 'payment');

      console.log(`\nSupplier: ${supplier.name} (${supplier.id})`);
      console.log(`  Total Transactions: ${supplierTransactions.length}`);
      console.log(`  Expenses: ${expenses.length}`);
      console.log(`  Total Expenses: ₹${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}`);
      console.log(`  Payments: ${payments.length}`);
      console.log(`  Total Payments: ₹${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`);
      console.log(`  Calculated Debt: ₹${calculatedSupplierBalances[supplier.id]?.toFixed(2) || '0.00'}`);
      console.log(`  Actual Debt: ₹${actualSupplierBalances[supplier.id]?.toFixed(2) || '0.00'}`);
    });

    if (customerDiscrepancies.length > 0) {
      console.log('\n=== CUSTOMER BALANCE DISCREPANCIES ===');
      customerDiscrepancies.forEach(disc => {
        console.log(`${disc.name}: Expected ₹${disc.calculated.toFixed(2)}, Actual ₹${disc.actual.toFixed(2)}, Difference ₹${disc.difference.toFixed(2)}`);
      });
    }

    if (supplierDiscrepancies.length > 0) {
      console.log('\n=== SUPPLIER BALANCE DISCREPANCIES ===');
      supplierDiscrepancies.forEach(disc => {
        console.log(`${disc.name}: Expected ₹${disc.calculated.toFixed(2)}, Actual ₹${disc.actual.toFixed(2)}, Difference ₹${disc.difference.toFixed(2)}`);
      });
    }

    console.log('\n=== TRANSACTION SUMMARY ===');
    const receiptTransactions = transactions.filter(t => t.type === 'receipt');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const paymentTransactions = transactions.filter(t => t.type === 'payment');

    console.log(`Total Receipts: ${receiptTransactions.length} = ₹${receiptTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
    console.log(`Total Expenses: ${expenseTransactions.length} = ₹${expenseTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
    console.log(`Total Payments: ${paymentTransactions.length} = ₹${paymentTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
  }

  async fixDiscrepancies(): Promise<void> {
    const report = await this.validateAllBalances();
    
    console.log('\n=== FIXING BALANCE DISCREPANCIES ===');
    
    // Fix customer balance discrepancies
    for (const disc of report.summary.discrepancies.customers) {
      if (Math.abs(disc.difference) > 0.01) {
        console.log(`Fixing customer ${disc.name}: ${disc.actual} -> ${disc.calculated}`);
        await this.storage.updateCustomer(disc.id, { 
          pendingAmount: disc.calculated 
        });
      }
    }

    // Fix supplier balance discrepancies
    for (const disc of report.summary.discrepancies.suppliers) {
      if (Math.abs(disc.difference) > 0.01) {
        console.log(`Fixing supplier ${disc.name}: ${disc.actual} -> ${disc.calculated}`);
        await this.storage.updateSupplier(disc.id, { 
          debt: disc.calculated 
        });
      }
    }

    console.log('Balance discrepancies fixed.');
  }
}