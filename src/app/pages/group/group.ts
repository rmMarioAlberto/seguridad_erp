import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-group',
  imports: [CardModule, ProgressBarModule, BadgeModule],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class GroupComponent {}
