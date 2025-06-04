import { firebaseStorage } from './server/firebase-storage';

async function validateBalances() {
  console.log('\n=== COMPREHENSIVE BALANCE VALIDATION ===\n');

  try {
    // Fetch all data
    const customers = await firebaseStorage.getAllCustomers();
    const suppliers = await firebaseStorage.getAllSuppliers();
    const orders = await firebaseStorage.getAllOrders();
    const transactions = await firebaseStorage.getAllTransactions();

    console.log(`Found ${customers.length} customers`);
    console.log(`Found ${suppliers.length} suppliers`);
    console.log(`Found ${orders.length} orders`);
    console.log(`Found ${transactions.length} transactions\n`);

    let totalDiscrepancies = 0;

    // Analyze each customer's balance
    console.log('=== CUSTOMER BALANCE ANALYSIS ===');
    for (const customer of customers) {
      const customerOrders = orders.filter(o => o.customerId === customer.id);
      const unpaidOrders = customerOrders.filter(o => o.status !== 'paid');
      const customerPayments = transactions.filter(t => 
        t.entityType === 'customer' && t.entityId === customer.id && t.type === 'receipt'
      );

      const unpaidAmount = unpaidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalPayments = customerPayments.reduce((sum, p) => sum + p.amount, 0);
      const calculatedBalance = unpaidAmount - totalPayments;
      const actualBalance = customer.pendingAmount || 0;
      const difference = actualBalance - calculatedBalance;

      console.log(`\nCustomer: ${customer.name} (${customer.id})`);
      console.log(`  Total Orders: ${customerOrders.length}`);
      console.log(`  Unpaid Orders: ${unpaidOrders.length} = ₹${unpaidAmount.toFixed(2)}`);
      console.log(`  Payments: ${customerPayments.length} = ₹${totalPayments.toFixed(2)}`);
      console.log(`  Calculated Balance: ₹${calculatedBalance.toFixed(2)}`);
      console.log(`  Actual Balance: ₹${actualBalance.toFixed(2)}`);
      
      if (Math.abs(difference) > 0.01) {
        console.log(`  ⚠️  DISCREPANCY: ₹${difference.toFixed(2)}`);
        totalDiscrepancies++;
      } else {
        console.log(`  ✅ BALANCED`);
      }

      // List order details for discrepancies
      if (Math.abs(difference) > 0.01 && unpaidOrders.length > 0) {
        console.log(`  Unpaid Orders:`);
        unpaidOrders.forEach(order => {
          console.log(`    - Order ${order.id}: ₹${order.total} (${order.date}) - ${order.status}`);
        });
      }

      // List payment details for discrepancies
      if (Math.abs(difference) > 0.01 && customerPayments.length > 0) {
        console.log(`  Payment Records:`);
        customerPayments.forEach(payment => {
          console.log(`    - Payment ${payment.id}: ₹${payment.amount} (${payment.date}) - ${payment.description}`);
        });
      }
    }

    // Analyze each supplier's balance
    console.log('\n\n=== SUPPLIER BALANCE ANALYSIS ===');
    for (const supplier of suppliers) {
      const supplierTransactions = transactions.filter(t => 
        t.entityType === 'supplier' && t.entityId === supplier.id
      );
      const expenses = supplierTransactions.filter(t => t.type === 'expense');
      const payments = supplierTransactions.filter(t => t.type === 'payment');

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      const calculatedDebt = totalExpenses - totalPayments;
      const actualDebt = supplier.debt || 0;
      const difference = actualDebt - calculatedDebt;

      console.log(`\nSupplier: ${supplier.name} (${supplier.id})`);
      console.log(`  Expenses: ${expenses.length} = ₹${totalExpenses.toFixed(2)}`);
      console.log(`  Payments: ${payments.length} = ₹${totalPayments.toFixed(2)}`);
      console.log(`  Calculated Debt: ₹${calculatedDebt.toFixed(2)}`);
      console.log(`  Actual Debt: ₹${actualDebt.toFixed(2)}`);
      
      if (Math.abs(difference) > 0.01) {
        console.log(`  ⚠️  DISCREPANCY: ₹${difference.toFixed(2)}`);
        totalDiscrepancies++;
      } else {
        console.log(`  ✅ BALANCED`);
      }

      // List transaction details for discrepancies
      if (Math.abs(difference) > 0.01) {
        if (expenses.length > 0) {
          console.log(`  Expense Records:`);
          expenses.forEach(expense => {
            console.log(`    - Expense ${expense.id}: ₹${expense.amount} (${expense.date}) - ${expense.description}`);
          });
        }

        if (payments.length > 0) {
          console.log(`  Payment Records:`);
          payments.forEach(payment => {
            console.log(`    - Payment ${payment.id}: ₹${payment.amount} (${payment.date}) - ${payment.description}`);
          });
        }
      }
    }

    // Check for orphaned records
    console.log('\n\n=== ORPHANED RECORDS CHECK ===');
    const orphanedOrders = orders.filter(order => 
      !customers.find(customer => customer.id === order.customerId)
    );
    
    if (orphanedOrders.length > 0) {
      console.log(`Found ${orphanedOrders.length} orphaned orders:`);
      orphanedOrders.forEach(order => {
        console.log(`  - Order ${order.id} references non-existent customer ${order.customerId}`);
      });
      totalDiscrepancies += orphanedOrders.length;
    } else {
      console.log('✅ No orphaned orders found');
    }

    const orphanedTransactions = transactions.filter(transaction =>
      (transaction.entityType === 'customer' && !customers.find(c => c.id === transaction.entityId)) ||
      (transaction.entityType === 'supplier' && !suppliers.find(s => s.id === transaction.entityId))
    );

    if (orphanedTransactions.length > 0) {
      console.log(`Found ${orphanedTransactions.length} orphaned transactions:`);
      orphanedTransactions.forEach(transaction => {
        console.log(`  - Transaction ${transaction.id} references non-existent ${transaction.entityType} ${transaction.entityId}`);
      });
      totalDiscrepancies += orphanedTransactions.length;
    } else {
      console.log('✅ No orphaned transactions found');
    }

    // Check for duplicate IDs
    console.log('\n=== DUPLICATE ID CHECK ===');
    const customerIds = customers.map(c => c.id);
    const duplicateCustomerIds = customerIds.filter((id, index) => customerIds.indexOf(id) !== index);
    if (duplicateCustomerIds.length > 0) {
      console.log(`⚠️  Found duplicate customer IDs: ${duplicateCustomerIds.join(', ')}`);
      totalDiscrepancies += duplicateCustomerIds.length;
    } else {
      console.log('✅ No duplicate customer IDs');
    }

    const supplierIds = suppliers.map(s => s.id);
    const duplicateSupplierIds = supplierIds.filter((id, index) => supplierIds.indexOf(id) !== index);
    if (duplicateSupplierIds.length > 0) {
      console.log(`⚠️  Found duplicate supplier IDs: ${duplicateSupplierIds.join(', ')}`);
      totalDiscrepancies += duplicateSupplierIds.length;
    } else {
      console.log('✅ No duplicate supplier IDs');
    }

    const orderIds = orders.map(o => o.id);
    const duplicateOrderIds = orderIds.filter((id, index) => orderIds.indexOf(id) !== index);
    if (duplicateOrderIds.length > 0) {
      console.log(`⚠️  Found duplicate order IDs: ${duplicateOrderIds.join(', ')}`);
      totalDiscrepancies += duplicateOrderIds.length;
    } else {
      console.log('✅ No duplicate order IDs');
    }

    const transactionIds = transactions.map(t => t.id);
    const duplicateTransactionIds = transactionIds.filter((id, index) => transactionIds.indexOf(id) !== index);
    if (duplicateTransactionIds.length > 0) {
      console.log(`⚠️  Found duplicate transaction IDs: ${duplicateTransactionIds.join(', ')}`);
      totalDiscrepancies += duplicateTransactionIds.length;
    } else {
      console.log('✅ No duplicate transaction IDs');
    }

    // Summary
    console.log('\n=== FINANCIAL SUMMARY ===');
    const totalCustomerPending = customers.reduce((sum, c) => sum + (c.pendingAmount || 0), 0);
    const totalSupplierDebt = suppliers.reduce((sum, s) => sum + (s.debt || 0), 0);
    const totalOrderValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const paidOrderValue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);
    const unpaidOrderValue = orders.filter(o => o.status !== 'paid').reduce((sum, o) => sum + (o.total || 0), 0);

    console.log(`Total Customer Pending: ₹${totalCustomerPending.toFixed(2)}`);
    console.log(`Total Supplier Debt: ₹${totalSupplierDebt.toFixed(2)}`);
    console.log(`Total Order Value: ₹${totalOrderValue.toFixed(2)}`);
    console.log(`Paid Order Value: ₹${paidOrderValue.toFixed(2)}`);
    console.log(`Unpaid Order Value: ₹${unpaidOrderValue.toFixed(2)}`);

    const receiptTransactions = transactions.filter(t => t.type === 'receipt');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const paymentTransactions = transactions.filter(t => t.type === 'payment');

    console.log(`Total Receipts: ₹${receiptTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
    console.log(`Total Expenses: ₹${expenseTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
    console.log(`Total Payments: ₹${paymentTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);

    console.log('\n=== VALIDATION RESULTS ===');
    if (totalDiscrepancies === 0) {
      console.log('🎉 ALL SYSTEMS BALANCED - No discrepancies found!');
    } else {
      console.log(`⚠️  Found ${totalDiscrepancies} total discrepancies that need attention.`);
    }
    console.log('\n=== VALIDATION COMPLETE ===\n');

  } catch (error) {
    console.error('Validation failed:', error);
  }
}

// Run the validation
validateBalances().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Failed to run validation:', error);
  process.exit(1);
});