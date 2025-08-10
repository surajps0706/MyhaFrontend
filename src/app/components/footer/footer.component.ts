import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./footer.component.css'],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  footerLinks = [
    { label: 'Home', route: '/' },
    { label: 'Shop', route: '/products' },
    { label: 'Track Order', route: '/track' }
  ];

  contactInfo = {
    phone: '+91 9344539530',
    email: 'couturemyha@gmail.com',
    instagram: 'https://www.instagram.com/myha_couture?igsh=MTkxdWNuNHViZnBrOA=='
  };
}
