import { NgModule, APP_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';

const routes: Routes = []


@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule.withServerTransition({ appId: 'migration-sample' }),
    RouterModule.forRoot(routes, {
      errorHandler: (error) => {
        console.error('Navigation Error:', error);
      }
    })
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
