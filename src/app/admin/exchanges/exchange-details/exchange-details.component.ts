
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExchangeService } from '../exchanges/admin-exchange.service';

@Component({
  selector: 'app-exchange-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exchange-details.component.html',
  styleUrl: './exchange-details.component.css'
})
export class ExchangeDetailsComponent implements OnInit {

  requestId = '';

  exchange: any = null;

  loading = true;

  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private exchangeService: ExchangeService
  ) {}

  ngOnInit(): void {
    this.requestId =
      this.route.snapshot.paramMap.get('requestId') || '';

    if (!this.requestId) {
      this.errorMessage = 'Exchange request ID is missing.';
      this.loading = false;
      return;
    }

    this.loadExchange();
  }

  // ==========================================
  // LOAD EXCHANGE DETAILS
  // ==========================================

  loadExchange(): void {
    this.loading = true;
    this.errorMessage = '';

    this.exchangeService.getExchanges().subscribe({

      next: (response: any) => {

        const exchanges = response?.exchanges || [];

        this.exchange = exchanges.find(
          (item: any) =>
            String(item.requestId) === String(this.requestId)
        );

        if (!this.exchange) {
          this.errorMessage = 'Exchange request not found.';
          this.loading = false;
          return;
        }

        console.log('Exchange Details:', this.exchange);

        console.log(
          'Exchange Items:',
          this.exchange?.items
        );

        console.log(
          'Exchange Address:',
          this.exchange?.exchangeAddress
        );

        console.log(
          'Order Details:',
          this.exchange?.orderDetails
        );

        console.log(
          'Payment Status:',
          this.exchange?.paymentStatus
        );

        this.loading = false;
      },

      error: (error: any) => {

        console.error('Exchange details error:', error);

        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Unable to load exchange details.';

        this.loading = false;
      }

    });
  }




completing = false;

markAsCompleted(): void {
  if (!this.exchange || this.completing) {
    return;
  }

  const confirmed = confirm(
    'Confirm that the replacement has been delivered and mark this exchange as completed?'
  );

  if (!confirmed) {
    return;
  }

  this.completing = true;

  this.exchangeService
    .completeExchange(String(this.exchange.requestId))
    .subscribe({
      next: () => {
        this.loadExchange();
      },
      error: (error: any) => {
        alert(
          error?.error?.detail ||
          'Unable to complete the exchange.'
        );
        this.completing = false;
      },
      complete: () => {
        this.completing = false;
      }
    });
}



  // ==========================================
  // BACK BUTTON
  // ==========================================

  goBack(): void {
    this.router.navigate(['/admin/exchanges']);
  }

  // ==========================================
  // CUSTOMER
  // ==========================================

  get customer(): any {
    return this.exchange?.customer || {};
  }

  get customerName(): string {
    return (
      this.exchange?.customerName ||
      this.exchange?.exchangeAddress?.name ||
      this.customer?.name ||
      this.customer?.fullName ||
      'Unknown Customer'
    );
  }

  get customerEmail(): string {
    return (
      this.exchange?.customerEmail ||
      this.customer?.email ||
      ''
    );
  }

  get customerPhone(): string {
    return (
      this.exchange?.customerPhone ||
      this.exchange?.exchangeAddress?.phone ||
      this.customer?.phone ||
      ''
    );
  }

  get customerId(): string {
    return (
      this.exchange?.customerId ||
      this.customer?.customerId ||
      this.customer?._id ||
      'N/A'
    );
  }

  // ==========================================
  // ORDER DETAILS
  // ==========================================

  get orderDetails(): any {
    return this.exchange?.orderDetails || {};
  }

  get orderId(): string {
    return (
      this.exchange?.orderId ||
      this.exchange?.order_id ||
      this.orderDetails?.orderId ||
      this.orderDetails?.order_id ||
      'N/A'
    );
  }

  get orderStatus(): string {
    return (
      this.exchange?.orderStatus ||
      this.orderDetails?.status ||
      this.orderDetails?.orderStatus ||
      'N/A'
    );
  }

  get orderDate(): any {
    return (
      this.exchange?.orderDate ||
      this.orderDetails?.createdAt ||
      this.orderDetails?.orderDate ||
      null
    );
  }

  get orderTotal(): any {
    return (
      this.exchange?.orderTotal ??
      this.orderDetails?.total ??
      this.orderDetails?.totalAmount ??
      this.orderDetails?.grandTotal ??
      null
    );
  }

  get orderItems(): any[] {

    const items =
      this.orderDetails?.cartItems ||
      this.orderDetails?.items ||
      this.exchange?.orderItems ||
      [];

    return Array.isArray(items) ? items : [];
  }

  // ==========================================
  // EXCHANGE ITEMS
  // ==========================================

  get exchangeItems(): any[] {

    // New exchange structure
    if (Array.isArray(this.exchange?.items)) {
      return this.exchange.items;
    }

    // Older exchange structure
    if (this.exchange?.exchangeItem) {
      return [this.exchange.exchangeItem];
    }

    // Older single-product structure
    if (
      this.exchange?.productName ||
      this.exchange?.originalSize ||
      this.exchange?.replacementSize
    ) {
      return [
        {
          productName: this.exchange?.productName,
          originalSize: this.exchange?.originalSize,
          replacementSize: this.exchange?.replacementSize,
          reason: this.exchange?.reason,
          status: this.exchange?.status,
          evidence: this.exchange?.evidence
        }
      ];
    }

    return [];
  }

  // Returns first exchange item for existing HTML
  get exchangeItem(): any {
    return this.exchangeItems[0] || {};
  }

  get productName(): string {
    return (
      this.exchange?.productName ||
      this.exchangeItem?.productName ||
      this.exchangeItem?.name ||
      'Product'
    );
  }

  get currentSize(): string {
    return (
      this.exchange?.originalSize ||
      this.exchangeItem?.originalSize ||
      'N/A'
    );
  }

  get requestedSize(): string {
    return (
      this.exchange?.replacementSize ||
      this.exchangeItem?.replacementSize ||
      'N/A'
    );
  }

  get reason(): string {
    return (
      this.exchange?.reason ||
      this.exchangeItem?.reason ||
      'Not provided'
    );
  }

  get itemStatus(): string {
    return (
      this.exchangeItem?.status ||
      this.exchange?.status ||
      'N/A'
    );
  }

  // ==========================================
  // PRODUCT IMAGE
  // ==========================================

  get productImage(): string {

    const item = this.exchangeItem;

    let image =
      this.exchange?.productImage ||
      item?.image ||
      item?.images?.[0] ||
      '';

    // Search original order item using item_index
    if (!image) {

      const cartItems = this.orderItems;

      const itemIndex = Number(
        item?.item_index ??
        this.exchange?.item_index
      );

      if (
        Array.isArray(cartItems) &&
        Number.isInteger(itemIndex) &&
        itemIndex >= 0 &&
        cartItems[itemIndex]
      ) {

        const orderItem = cartItems[itemIndex];

        image =
          orderItem?.image ||
          orderItem?.images?.[0] ||
          '';
      }
    }

    return image;
  }

  // ==========================================
  // EXCHANGE ADDRESS
  // ==========================================


get originalAddress(): any {
  return (
    this.exchange?.originalShippingAddress ||
    this.exchange?.orderDetails?.shippingAddress ||
    this.exchange?.orderDetails?.deliveryAddress ||
    this.exchange?.customer?.shippingAddress ||
    null
  );
}

get exchangeAddress(): any {
  return (
    this.exchange?.exchangeAddress ||
    this.exchange?.shippingAddress ||
    null
  );
}

get shippingAddress(): any {
  // Customer's new exchange address
  if (this.exchange?.sameAsOriginalAddress === false) {
    return this.exchange?.exchangeAddress || null;
  }

  // Original address when customer selected same address
  return this.originalAddress;
}

get billingAddress(): any {
  // Billing always remains the original order billing address
  return (
    this.exchange?.orderDetails?.billingAddress ||
    this.exchange?.orderDetails?.billing_address ||
    this.originalAddress
  );
}


  get sameAsOriginalAddress(): boolean {
    return this.exchange?.sameAsOriginalAddress === true;
  }

  // ==========================================
  // PAYMENT
  // ==========================================

  get paymentStatus(): string {

    return (
      this.exchange?.paymentStatus ||
      this.orderDetails?.paymentStatus ||
      'N/A'
    );
  }

  get paymentAmount(): any {

    return (
      this.exchange?.paymentAmount ??
      this.exchange?.amount ??
      null
    );
  }

  // ==========================================
  // EVIDENCE IMAGES
  // ==========================================

  get evidenceImages(): string[] {

    const allEvidence: string[] = [];

    // Request-level evidence
    const requestEvidence =
      this.exchange?.evidence ||
      this.exchange?.evidenceKeys ||
      [];

    if (Array.isArray(requestEvidence)) {

      allEvidence.push(
        ...requestEvidence.filter(
          (item: any) =>
            typeof item === 'string' &&
            item.trim()
        )
      );

    } else if (
      typeof requestEvidence === 'string' &&
      requestEvidence.trim()
    ) {

      allEvidence.push(requestEvidence);
    }

    // Evidence from every exchange item
    for (const item of this.exchangeItems) {

      const evidence =
        item?.evidence ||
        item?.evidenceKeys ||
        [];

      if (Array.isArray(evidence)) {

        allEvidence.push(
          ...evidence.filter(
            (image: any) =>
              typeof image === 'string' &&
              image.trim()
          )
        );

      } else if (
        typeof evidence === 'string' &&
        evidence.trim()
      ) {

        allEvidence.push(evidence);
      }
    }

    // Remove duplicate images
    return [...new Set(allEvidence)];
  }

  // ==========================================
  // EXCHANGE STATUS
  // ==========================================

  get statusClass(): string {

    const status = String(
      this.exchange?.status || ''
    )
      .toLowerCase()
      .replace(/\s+/g, '-');

    return status || 'unknown';
  }

  // ==========================================
  // ADMIN / RESOLUTION
  // ==========================================

  get adminNotes(): string {

    return (
      this.exchange?.adminNotes ||
      this.exchangeItem?.adminNotes ||
      ''
    );
  }

  get resolution(): string {

    return (
      this.exchange?.resolution ||
      this.exchangeItem?.resolution ||
      ''
    );
  }

  get resolvedBy(): string {

    return (
      this.exchange?.resolvedBy ||
      'N/A'
    );
  }

  get resolvedDate(): any {

    return (
      this.exchange?.resolvedAt ||
      this.exchange?.resolvedDate ||
      null
    );
  }

  // ==========================================
  // ADDRESS FORMATTER
  // ==========================================

  formatAddress(address: any): string[] {

    if (!address) {
      return [];
    }

    if (typeof address === 'string') {

      return address
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean);
    }

    if (typeof address !== 'object') {
      return [String(address)];
    }

    const fields = [
      address.name,
      address.fullName,
      address.address,
      address.addressLine1,
      address.addressLine2,
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.pincode,
      address.zip,
      address.country,
      address.phone
    ];

    return [...new Set(

      fields
        .filter(
          (item: any) =>
            item !== null &&
            item !== undefined
        )
        .map(
          (item: any) =>
            String(item).trim()
        )
        .filter(Boolean)

    )];
  }

  // ==========================================
  // DATE FORMATTER
  // ==========================================

  formatDate(value: any): string {

    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString('en-IN', {

      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'

    });
  }

  // ==========================================
  // CURRENCY FORMATTER
  // ==========================================

  formatCurrency(value: any): string {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 'N/A';
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
      return 'N/A';
    }

    return amount.toLocaleString('en-IN', {

      style: 'currency',
      currency: 'INR'

    });
  }

}
