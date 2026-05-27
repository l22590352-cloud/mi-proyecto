import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar'; // <--- 1. Importamos el componente

@Component({
  selector: 'app-root',
  standalone: true, // Asegúrate de que diga standalone si usas Angular moderno
  imports: [RouterOutlet, Navbar], // <--- 2. Lo agregamos aquí
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mi-proyecto');
}