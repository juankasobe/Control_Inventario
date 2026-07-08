import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

export const appConfig: ApplicationConfig = {
  providers: [
    provideToastr(),
    importProvidersFrom([SweetAlert2Module.forRoot()]), // SweetAlert2 providers
    provideAnimations(), // Toastr providers
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'inventario-9863a',
        appId: '1:624254624987:web:12728b139156e386b698fe',
        storageBucket: 'inventario-9863a.firebasestorage.app',
        apiKey: 'AIzaSyDYPvP1y3M6UoWn4Cl78KWLxNJOP5Pr5YI',
        authDomain: 'inventario-9863a.firebaseapp.com',
        messagingSenderId: '624254624987',
      })
    ),
    provideFirestore(() => getFirestore()),
  ],
};
