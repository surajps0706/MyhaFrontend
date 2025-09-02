import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withInMemoryScrolling } from '@angular/router'; // ✅ added withInMemoryScrolling
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { register } from 'swiper/element/bundle';

register();

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled', // ✅ restores scroll on back
        anchorScrolling: 'enabled'            // ✅ allows anchor # links
      })
    ),
    provideHttpClient(),
  ]
});
