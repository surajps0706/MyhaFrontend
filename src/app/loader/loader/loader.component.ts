import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
 standalone: true,          // ✅ make sure this line exists
imports: [CommonModule],   templateUrl: './loader.component.html',
  styleUrl: './loader.component.css'
})
export class LoaderComponent {
  @Input() visible: boolean = false;

}
