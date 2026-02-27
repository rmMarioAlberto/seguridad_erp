import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  imports: [CardModule, ButtonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
