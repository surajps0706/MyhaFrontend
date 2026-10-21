import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  orderId: string | null = null;
  order: any = null;
  token: string | null = null;
  isDownloading = false;
  baseUrl: string = environment.apiUrl;
  objectKeys = Object.keys;

  // Order navigation
orderIds: string[] = [];
currentOrderIndex: number = -1;
isNavigating: boolean = false;

  // 🔹 New: status-related properties
  statusOptions: string[] = ['Ordered', 'Preparing', 'Packed'];
  selectedStatus: string = '';

  constructor(private route: ActivatedRoute, private http: HttpClient,  private router: Router,) {}

 ngOnInit(): void {
  this.token = localStorage.getItem('admin_token');

  if (!this.token) {
    console.error('Admin token not found');
    return;
  }

  // Load order IDs for navigation
  this.loadOrderIds();

  // Listen for order ID changes in the URL
  this.route.paramMap.subscribe(params => {
    this.orderId = params.get('orderId');

    if (this.orderId) {
      this.loadOrder();
    }
  });
}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: 'Bearer ' + this.token });
  }

  private formatCurrency(value: number): string {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

private getOrderItems(): any[] {
  return Array.isArray(this.order?.cartItems)
    ? this.order.cartItems
    : [];
}

private getCustomerAddress(): string {
  const data = this.order?.checkoutData || {};

  return [
    data.addressLine1,
    data.addressLine2,
    data.city,
    data.state,
    data.pincode
  ]
    .filter((value: any) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    )
    .join(', ');
}

private getShippingCharge(): number {
  return Number(
    this.order?.shippingCost ??
    this.order?.shippingCharges ??
    0
  );
}

private getSubtotal(): number {
  const items = this.getOrderItems();

  // Prefer a stored subtotal only if your backend's
  // field is confirmed to represent the item subtotal.
  if (this.order?.subtotal != null) {
    return Number(this.order.subtotal);
  }

  return items.reduce((sum: number, item: any) => {
    const lineTotal = item.lineTotal != null
      ? Number(item.lineTotal)
      : Number(item.price || 0) * Number(item.quantity || 1);

    return sum + lineTotal;
  }, 0);
}

private getGrandTotal(): number {
  if (this.order?.grandTotal != null) {
    return Number(this.order.grandTotal);
  }

  if (this.order?.totalAmount != null) {
    return Number(this.order.totalAmount);
  }

  return this.getSubtotal() + this.getShippingCharge();
}

  private loadOrderIds(): void {
  this.http.get<any[]>(`${this.baseUrl}/orders`, {
    headers: this.authHeaders()
  }).subscribe({
    next: (orders: any) => {

      // Support either a direct array or an object containing orders
      const orderList = Array.isArray(orders)
        ? orders
        : orders?.orders || [];

      this.orderIds = orderList
        .map((o: any) => o.orderId)
        .filter((id: string) => !!id);

      this.updateCurrentOrderIndex();

    },
    error: (err) => {
      console.error('Failed to load order list for navigation', err);
    }
  });
}

private updateCurrentOrderIndex(): void {
  if (!this.orderId) {
    this.currentOrderIndex = -1;
    return;
  }

  this.currentOrderIndex = this.orderIds.indexOf(this.orderId);
}

downloadDetails(): void {
  if (!this.order) {
    alert('Order details are not available.');
    return;
  }

  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MYHA COUTURE', margin, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ORDER DETAILS', margin, 26);

  doc.setFontSize(11);

  let y = 38;

  const customer = this.order.checkoutData || {};

  const addLine = (label: string, value: any) => {
    const text = `${label}: ${value || '-'}`;

    const lines = doc.splitTextToSize(
      text,
      pageWidth - margin * 2
    );

    doc.text(lines, margin, y);

    y += lines.length * 6;
  };

  addLine('Order ID', this.order.orderId);
  addLine('Order Date', this.order.createdAt
    ? new Date(this.order.createdAt).toLocaleDateString('en-IN')
    : '-');

  addLine('Status', this.order.status);
  addLine('Payment Mode', this.order.paymentMode);
  addLine('Customer Name', customer.name);
  addLine('Phone', customer.phone);
  addLine('Email', customer.email);
  addLine('Delivery Address', this.getCustomerAddress());
  addLine('AWB', this.order.awb);

  y += 5;

  const rows = this.getOrderItems().map((item: any) => {
    const measurements = Object.entries(item.measurements || {})
      .filter(([_, value]) =>
        value != null && String(value).trim() !== ''
      )
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const customizations = [
      item.selectedSize ? `Size: ${item.selectedSize}` : '',
      measurements,
      item.sleeveType ? `Sleeve: ${item.sleeveType}` : '',
      item.preferredHeight
        ? `Height: ${item.preferredHeight} inches`
        : '',
      item.customizationNotes
        ? `Notes: ${item.customizationNotes}`
        : ''
    ].filter(Boolean).join('\n');

    const lineTotal = item.lineTotal != null
      ? Number(item.lineTotal)
      : Number(item.price || 0) * Number(item.quantity || 1);

    return [
      item.name || '-',
      customizations || '-',
      String(item.quantity || 1),
      this.formatCurrency(lineTotal)
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Product', 'Customizations', 'Qty', 'Total']],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [55, 71, 79]
    },
    columnStyles: {
      0: { cellWidth: 43 },
      1: { cellWidth: 85 },
      2: { cellWidth: 15 },
      3: { cellWidth: 35 }
    },
    margin: {
      left: margin,
      right: margin
    }
  });

  const finalY =
    (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(10);

  doc.text(
    `Subtotal: ${this.formatCurrency(this.getSubtotal())}`,
    margin,
    finalY
  );

  doc.text(
    `Shipping: ${this.formatCurrency(this.getShippingCharge())}`,
    margin,
    finalY + 7
  );

  doc.setFont('helvetica', 'bold');

  doc.text(
    `Grand Total: ${this.formatCurrency(this.getGrandTotal())}`,
    margin,
    finalY + 14
  );

  doc.save(`Order-Details-${this.order.orderId}.pdf`);
}

downloadInvoice(): void {
  if (!this.order) {
    alert('Order details are not available.');
    return;
  }

  const doc = new jsPDF();

  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  const invoiceNumber = `INV-${this.order.orderId}`;

  const customer = this.order.checkoutData || {};

  const items = this.getOrderItems();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);

  doc.text('TAX INVOICE', margin, 20);

  doc.setFontSize(11);

  doc.text('From:', margin, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const sellerDetails = [
    'Myha Couture',
    'No 1, Karunkuzhi Road, Thirukalukundram - 603109, Tamil Nadu, India',
    'Contact: +91 9344539530',
    'Email: coutur emyha@email.com',
    'GSTIN: 33BSFPT8227C1ZR'
  ];

  let y = 38;

  sellerDetails.forEach(line => {
    doc.text(line, margin, y);
    y += 5;
  });

  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', margin, y);

  y += 6;

  doc.setFont('helvetica', 'normal');

  const invoiceDate = this.order.invoiceDate
    ? new Date(this.order.invoiceDate)
    : this.order.createdAt
      ? new Date(this.order.createdAt)
      : new Date();

  const invoiceDetails = [
    `Invoice Number: ${invoiceNumber}`,
    `Invoice Date: ${invoiceDate.toLocaleDateString('en-IN')}`,
    `Place of Supply: ${customer.state || 'Tamil Nadu'}`,
    `Payment Mode: ${this.order.paymentMode || 'Prepaid'}`
  ];

  invoiceDetails.forEach(line => {
    doc.text(line, margin + 5, y);
    y += 5;
  });

  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', margin, y);

  y += 6;

  doc.setFont('helvetica', 'normal');

  const billedTo = [
    `Customer Name: ${customer.name || '-'}`,
    `Delivery Address: ${this.getCustomerAddress() || '-'}`,
    `Contact Number: ${customer.phone || '-'}`
  ];

  billedTo.forEach(line => {
    const wrapped = doc.splitTextToSize(
      line,
      pageWidth - margin * 2
    );

    doc.text(wrapped, margin + 5, y);
    y += wrapped.length * 5;
  });

  y += 5;

  const rows = items.map((item: any, index: number) => {
    const quantity = Number(item.quantity || 1);

    const lineTotal = item.lineTotal != null
      ? Number(item.lineTotal)
      : Number(item.price || 0) * quantity;

    // Derive the displayed rate from the actual line total.
    const rate = quantity ? lineTotal / quantity : 0;

    return [
      String(index + 1),
      item.name || 'Product',
      String(quantity),
      this.formatCurrency(rate),
      this.formatCurrency(lineTotal)
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [[
      'S.No.',
      'Description',
      'Qty',
      'Rate',
      'Total'
    ]],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0]
    },
    margin: {
      left: margin,
      right: margin
    }
  });

  let finalY =
    (doc as any).lastAutoTable.finalY + 10;

  const subtotal = this.getSubtotal();
  const shipping = this.getShippingCharge();
  const grandTotal = this.getGrandTotal();

  doc.setFontSize(10);

  doc.setFont('helvetica', 'bold');
  doc.text('Summary:', margin, finalY);

  finalY += 7;

  doc.setFont('helvetica', 'normal');

  doc.text(
    `Subtotal: ${this.formatCurrency(subtotal)}`,
    margin + 5,
    finalY
  );

  finalY += 6;

  doc.text(
    `Shipping Charges: ${this.formatCurrency(shipping)}`,
    margin + 5,
    finalY
  );

  finalY += 6;

  doc.setFont('helvetica', 'bold');

  doc.text(
    `Grand Total: ${this.formatCurrency(grandTotal)}`,
    margin + 5,
    finalY
  );

  finalY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  doc.text(
    `Amount in Words: ${this.amountInWords(grandTotal)}`,
    margin,
    finalY
  );

  finalY += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', margin, finalY);

  finalY += 6;

  doc.setFont('helvetica', 'normal');

  doc.text(
    '1. Goods once sold are subject to the applicable return and exchange policy.',
    margin + 3,
    finalY
  );

  finalY += 6;

  doc.text(
    '2. This invoice is mapped against the shipping logistics tracking ID.',
    margin + 3,
    finalY
  );

  finalY += 6;

doc.text(
  '3. Delivery timelines may vary depending on the courier/logistics provider.',
  margin + 3,
  finalY
);

  finalY += 12;
  

  doc.text('For Myha Couture', margin, finalY);

  finalY += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Signatory', margin, finalY);

  doc.save(`Invoice-${invoiceNumber}.pdf`);
}

private amountInWords(amount: number): string {
  const wholeAmount = Math.floor(Number(amount) || 0);

  if (wholeAmount === 0) {
    return 'Rupees Zero Only.';
  }

  const belowTwenty = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen'
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety'
  ];

  const convert = (n: number): string => {
    if (n < 20) {
      return belowTwenty[n];
    }

    if (n < 100) {
      return tens[Math.floor(n / 10)] +
        (n % 10 ? ' ' + belowTwenty[n % 10] : '');
    }

    if (n < 1000) {
      return belowTwenty[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 ? ' ' + convert(n % 100) : '');
    }

    if (n < 100000) {
      return convert(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 ? ' ' + convert(n % 1000) : '');
    }

    if (n < 10000000) {
      return convert(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 ? ' ' + convert(n % 100000) : '');
    }

    return convert(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  return `Rupees ${convert(wholeAmount)} Only.`;
}

navigateOrder(direction: number): void {

  if (this.isNavigating || this.currentOrderIndex < 0) {
    return;
  }

  const nextIndex = this.currentOrderIndex + direction;

  if (nextIndex < 0 || nextIndex >= this.orderIds.length) {
    return;
  }

  const nextOrderId = this.orderIds[nextIndex];

  this.isNavigating = true;

  this.router.navigate(['../', nextOrderId], {
    relativeTo: this.route
  }).then(success => {
    this.isNavigating = false;

    if (!success) {
      console.error('Navigation to the selected order failed');
    }
  }).catch(err => {
    this.isNavigating = false;
    console.error('Order navigation failed', err);
  });
}

saveAndNext(): void {
  if (!this.orderId || !this.selectedStatus || this.isNavigating) {
    return;
  }

  // No next order exists
  if (this.currentOrderIndex >= this.orderIds.length - 1) {
    alert('This is the last order. The status will be saved.');
    this.saveCurrentStatus();
    return;
  }

  this.isNavigating = true;

  const payload = { status: this.selectedStatus };

  this.http.put(
    `${this.baseUrl}/orders/${this.orderId}/status`,
    payload,
    { headers: this.authHeaders() }
  ).subscribe({
    next: () => {
      // Update the current order locally
      this.order.status = this.selectedStatus;

      // Open the next order only after a successful save
      const nextOrderId = this.orderIds[this.currentOrderIndex + 1];

      this.router.navigate(['../', nextOrderId], {
        relativeTo: this.route
      }).then(success => {
        this.isNavigating = false;

        if (!success) {
          alert('Status saved, but navigation failed.');
        }
      }).catch(err => {
        this.isNavigating = false;
        console.error('Navigation failed:', err);
        alert('Status saved, but navigation failed.');
      });
    },
    error: err => {
      this.isNavigating = false;
      console.error('Failed to save order status:', err);
      alert('Failed to save the order status. You are still on the current order.');
    }
  });
}

saveCurrentStatus(): void {
  if (!this.orderId || !this.selectedStatus || this.isNavigating) {
    return;
  }

  this.isNavigating = true;

  this.http.put(
    `${this.baseUrl}/orders/${this.orderId}/status`,
    { status: this.selectedStatus },
    { headers: this.authHeaders() }
  ).subscribe({
    next: () => {
      this.order.status = this.selectedStatus;
      this.isNavigating = false;
      alert('Order status saved successfully.');
    },
    error: err => {
      this.isNavigating = false;
      console.error('Failed to save order status:', err);
      alert('Failed to save the order status.');
    }
  });
}

closeOrder(): void {
  if (this.isNavigating) {
    return;
  }

  this.router.navigate(['/admin/orders']);
}

  loadOrder() {
    this.http.get(`${this.baseUrl}/orders/${this.orderId}`, {
      headers: this.authHeaders()
    }).subscribe({
      next: (res: any) => {
        this.order = res;
        this.selectedStatus = res.status || ''; // preselect current
        this.updateCurrentOrderIndex();

      },
      error: (err) => console.error('❌ Failed to load order details', err)
    });
  }

  // 🔹 New: update order status
updateStatus(): void {
  if (!this.selectedStatus) {
    alert('Please select a status');
    return;
  }

  if (this.isNavigating) {
    return;
  }

  if (!this.orderId) {
    alert('Order ID is missing');
    return;
  }

  this.isNavigating = true;

  const payload = { status: this.selectedStatus };

  this.http.put(
    `${this.baseUrl}/orders/${this.orderId}/status`,
    payload,
    { headers: this.authHeaders() }
  ).subscribe({
    next: (res: any) => {
      this.order.status = this.selectedStatus;
      this.isNavigating = false;

      alert(`✅ Status updated to ${this.selectedStatus}`);
    },
    error: (err) => {
      console.error('❌ Failed to update status', err);
      this.isNavigating = false;
      alert('Failed to update status');
    }
  });
}
}
