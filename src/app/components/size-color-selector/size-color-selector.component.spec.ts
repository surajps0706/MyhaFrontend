import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SizeColorSelectorComponent } from './size-color-selector.component';

describe('SizeColorSelectorComponent', () => {
  let component: SizeColorSelectorComponent;
  let fixture: ComponentFixture<SizeColorSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SizeColorSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SizeColorSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
