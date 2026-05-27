import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true, // Indica que el componente se gestiona solo
  imports: [CommonModule, RouterModule], // Necesario para routerLink y directivas básicas
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome {
  // Aquí puedes añadir lógica en el futuro, 
  // como verificar si el usuario ya está logueado para redirigirlo.
  
  constructor() {
    console.log('Welcome component loaded ✨');
  }
}