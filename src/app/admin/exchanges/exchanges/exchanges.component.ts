
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ExchangeService } from './admin-exchange.service';

type ExchangeStatus =
  | 'Pending Review'
  | 'Approved'
  | 'Processing'
  | 'Completed'
  | 'Rejected';

interface ExchangeRequest {
  requestId: string;
  orderId: string;

  customerName: string;
  customerEmail?: string;
  customerPhone?: string;

  productName: string;
exchangeItems?: any[];
  originalSize: string;
  replacementSize: string;

  reason: string;
  status: ExchangeStatus;

  createdAt: string;
}

interface CustomerDetails {
  name?: string;
  email?: string;
  phone?: string;
  shippingAddress?: any;
  billingAddress?: any;
}

interface ExchangeRequest {
  requestId: string;
  orderId: string;

  customerName: string;
  customerEmail?: string;
  customerPhone?: string;

  customer?: CustomerDetails;

  shippingAddress?: any;
  billingAddress?: any;

  orderDetails?: any;

  productName: string;

  originalSize: string;
  replacementSize: string;

  reason: string;
  status: ExchangeStatus;

  createdAt: string;
}

@Component({
  selector: 'app-exchanges',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './exchanges.component.html',
  styleUrl: './exchanges.component.css'
})
export class ExchangesComponent implements OnInit {

  // =========================
  // SEARCH
  // =========================

  searchTerm = '';

  // =========================
  // LOADING / ERROR
  // =========================

  isLoading = false;

  errorMessage = '';

  // =========================
  // STATUS FILTER
  // =========================

  selectedStatus = 'All';

  statusTabs = [
    'All',
    'Pending Review',
    'Approved',
    'Processing',
    'Completed',
    'Rejected'
  ];

  // =========================
  // EXCHANGE DATA
  // =========================

  exchanges: ExchangeRequest[] = [];

  constructor(
    private router: Router,
    private exchangeService: ExchangeService
  ) {}

  // =========================
  // INITIALIZE
  // =========================

  ngOnInit(): void {

    this.loadExchanges();

  }

  // =========================
  // LOAD EXCHANGES
  // =========================

 
loadExchanges(): void {

  this.isLoading = true;
  this.errorMessage = '';

  this.exchangeService.getExchanges(
    this.selectedStatus,
    this.searchTerm
  ).subscribe({

    next: (response: any) => {

      // =============================
      // SUPPORT API RESPONSE FORMATS
      // =============================

      const data = Array.isArray(response)
        ? response
        : response?.exchanges;

      if (!Array.isArray(data)) {

        console.error(
          'Unexpected exchange API response:',
          response
        );

        this.exchanges = [];

        this.errorMessage =
          'Invalid exchange response received from server.';

        this.isLoading = false;

        return;

      }

      // =============================
      // DEBUG API RESPONSE
      // =============================

      console.log(
        'ADMIN EXCHANGE API RESPONSE:',
        response
      );

      console.log(
        'FIRST EXCHANGE:',
        data[0]
      );

      // =============================
      // NORMALIZE EXCHANGE DATA
      // =============================

      this.exchanges = data.map((exchange: any) => {

        // -----------------------------
        // ORDER DETAILS
        // -----------------------------

        const orderDetails =
          exchange.orderDetails ?? {};

        // -----------------------------
        // CUSTOMER OBJECT
        // -----------------------------

        const customer =
          exchange.customer ??
          orderDetails.customer ??
          {};

        // -----------------------------
        // SHIPPING ADDRESS
        // -----------------------------

        const shippingAddress =
          exchange.shippingAddress ??
          customer.shippingAddress ??
          orderDetails.shippingAddress ??
          null;

        // -----------------------------
        // BILLING ADDRESS
        // -----------------------------

        const billingAddress =
          exchange.billingAddress ??
          customer.billingAddress ??
          orderDetails.billingAddress ??
          null;

        // -----------------------------
        // CUSTOMER NAME
        // -----------------------------

        const customerName =
          exchange.customerName ??
          customer.name ??
          customer.fullName ??
          orderDetails.customerName ??
          shippingAddress?.name ??
          shippingAddress?.fullName ??
          'Unknown Customer';

        // -----------------------------
        // CUSTOMER EMAIL
        // -----------------------------

        const customerEmail =
          exchange.customerEmail ??
          customer.email ??
          orderDetails.customerEmail ??
          '';

        // -----------------------------
        // CUSTOMER PHONE
        // -----------------------------

        const customerPhone =
          exchange.customerPhone ??
          customer.phone ??
          customer.mobile ??
          orderDetails.customerPhone ??
          shippingAddress?.phone ??
          '';

        // -----------------------------
        // CUSTOMER ID
        // -----------------------------

        const customerId =
          exchange.customerId ??
          customer._id ??
          customer.id ??
          orderDetails.customerId ??
          orderDetails.userId ??
          '';

        
        // -----------------------------
        // PRODUCT INFORMATION
        // -----------------------------

        // Support multiple exchange items
        const exchangeItems = Array.isArray(exchange.items)
  ? exchange.items
  : Array.isArray(exchange.exchangeItems)
    ? exchange.exchangeItems
    : exchange.exchangeItem
      ? [exchange.exchangeItem]
      : [];

        const exchangeItem = exchangeItems[0] ?? {};

        console.log(
  'EXCHANGE ITEMS:',
  exchange.requestId,
  exchangeItems
);

        // Debug the actual API fields
        console.log('EXCHANGE PRODUCT DEBUG:', {
          requestId: exchange.requestId,
          items: exchange.items,
          exchangeItem: exchange.exchangeItem,
          productName: exchange.productName
        });

      const productName =
  exchange.productName ||
  exchangeItem.productName ||
  exchangeItem.name ||
  exchangeItem.title ||
  exchangeItem.product ||
  'Unknown Product';

        const productImage =
          exchange.productImage ||
          exchangeItem.image ||
          exchangeItem.images?.[0] ||
          '';

        // -----------------------------
        // SIZE INFORMATION
        // -----------------------------

        const currentSize =
          exchange.currentSize ||
          exchange.originalSize ||
          exchangeItem.originalSize ||
          exchangeItem.size ||
          '';

        const requestedSize =
          exchange.requestedSize ||
          exchange.replacementSize ||
          exchangeItem.replacementSize ||
          exchangeItem.newSize ||
          '';



        // =============================
        // RETURN NORMALIZED EXCHANGE
        // =============================

        return {

          ...exchange,

          
     

          // Order
          orderId: String(
            exchange.orderId ??
            exchange.order_id ??
            orderDetails.orderId ??
            orderDetails.order_id ??
            ''
          ),

          orderDetails,

          // Customer
          customer,
          customerId,
          customerName,
          customerEmail,
          customerPhone,

          // Addresses
          shippingAddress,
          billingAddress,

          // Exchange items
          exchangeItems,
          exchangeItem,

          // Product
          productName,
          productImage,

          // Sizes
          currentSize,
          requestedSize,

          originalSize:
            exchange.originalSize ??
            currentSize,

          replacementSize:
            exchange.replacementSize ??
            requestedSize,

          // Request details
          reason:
            exchange.reason ??
            exchangeItem.reason ??
            '',

          status:
            exchange.status ??
            'Pending Review',

          createdAt:
            exchange.createdAt ??
            exchange.created_at ??
            null,

          updatedAt:
            exchange.updatedAt ??
            exchange.updated_at ??
            null
        };


      });

      // =============================
      // DEBUG NORMALIZED DATA
      // =============================

      console.log(
        'NORMALIZED EXCHANGES:',
        this.exchanges
      );

      console.log(
        'NORMALIZED CUSTOMER:',
        this.exchanges[0]?.customer
      );

      // =============================
      // FINISH LOADING
      // =============================

      this.isLoading = false;

    },

    error: (error: any) => {

      console.error(
        'Failed to load exchanges:',
        error
      );

      this.exchanges = [];

      this.errorMessage =
        'Unable to load exchange requests. Please try again.';

      this.isLoading = false;

    }

  });

}


  // =========================
  // STATUS FILTER
  // =========================

  selectStatus(status: string): void {

    this.selectedStatus = status;

    this.loadExchanges();

  }

  // =========================
  // SEARCH
  // =========================

  onSearchChange(): void {

    this.loadExchanges();

  }

  // =========================
  // FILTERED EXCHANGES
  // =========================

  get filteredExchanges(): ExchangeRequest[] {

    const search = this.searchTerm
      .trim()
      .toLowerCase();

    return this.exchanges.filter(exchange => {

      const matchesStatus =
        this.selectedStatus === 'All' ||
        exchange.status === this.selectedStatus;

      const matchesSearch =
        !search ||
        (exchange.requestId || '')
          .toLowerCase()
          .includes(search) ||

        (exchange.orderId || '')
          .toLowerCase()
          .includes(search) ||

        (exchange.customerName || '')
          .toLowerCase()
          .includes(search) ||

        (exchange.productName || '')
          .toLowerCase()
          .includes(search);

      return matchesStatus && matchesSearch;

    });

  }

  // =========================
  // TOTAL EXCHANGES
  // =========================

  get totalExchanges(): number {

    return this.exchanges.length;

  }

  // =========================
  // PENDING REVIEW COUNT
  // =========================

  get pendingCount(): number {

    return this.countByStatus('Pending Review');

  }

  // =========================
  // APPROVED COUNT
  // =========================

  get approvedCount(): number {

    return this.countByStatus('Approved');

  }


  

  // =========================
  // PROCESSING COUNT
  // =========================

  get processingCount(): number {

    return this.countByStatus('Processing');

  }

  // =========================
  // COMPLETED COUNT
  // =========================

  get completedCount(): number {

    return this.countByStatus('Completed');

  }

  // =========================
  // REJECTED COUNT
  // =========================

  get rejectedCount(): number {

    return this.countByStatus('Rejected');

  }

  // =========================
  // COUNT BY STATUS
  // =========================

  countByStatus(status: ExchangeStatus): number {

    return this.exchanges.filter(
      exchange => exchange.status === status
    ).length;

  }

  // =========================
  // VIEW EXCHANGE DETAILS
  // =========================

  viewDetails(exchange: ExchangeRequest): void {

    this.router.navigate([
      '/admin/exchanges',
      exchange.requestId
    ]);

  }

  // =========================
  // RETRY API
  // =========================

  retryLoading(): void {

    this.loadExchanges();

  }

}
