import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {}
