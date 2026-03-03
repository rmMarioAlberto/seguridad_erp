import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-user',
  imports: [CardModule, InputTextModule],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserComponent {}
