import { NgModule, APP_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter, withNavigationErrorHandler, Routes } from '@angular/router';
import { AppComponent } from './app.component';

const routes: Routes = [];

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [
    { provide: APP_ID, useValue: 'migration-sample' },
    provideRouter(routes, withNavigationErrorHandler(error => console.error('Navigation Error:', error)))
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}