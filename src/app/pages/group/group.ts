import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Group } from '../../models/group.model';
import { GroupService } from '../../services/group.service';
import { TicketService } from '../../services/ticket.service';
import { AuthPermissionService } from '../../services/auth-permission.service';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';


@Component({
  selector: 'app-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    ToolbarModule,
    CardModule,
    SelectModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class GroupComponent implements OnInit {
  groups: Group[] = [];
  groupDialog: boolean = false;
  group: Group = {} as Group;
  submitted: boolean = false;

  niveles: any[] = [
    { label: 'Alta', value: 'Alta' },
    { label: 'Media', value: 'Media' },
    { label: 'Baja', value: 'Baja' }
  ];

  constructor(
    private readonly groupService: GroupService,
    private readonly ticketService: TicketService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly authService: AuthPermissionService,
    private readonly router: Router
  ) {}

  canAddGroup() {
    return this.authService.hasPermission('group:add');
  }

  canEditGroup() {
    return this.authService.hasPermission('group:edit');
  }

  canDeleteGroup() {
    return this.authService.hasPermission('group:delete');
  }

  ngOnInit() {
    this.groupService.getGroups().subscribe((data) => {
      const user = this.authService.currentUser();
      if (user && user.role !== 'SuperAdmin') {
        this.groups = data.filter(g => user.groups.includes(g.nombre));
      } else {
        this.groups = data;
      }
    });
  }

  openNew() {
    this.group = {} as Group;
    this.submitted = false;
    this.groupDialog = true;
  }

  editGroup(group: Group) {
    this.group = { ...group };
    this.groupDialog = true;
  }

  deleteGroup(group: Group) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + group.nombre + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (group.id) {
          this.groupService.deleteGroup(group.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Exitoso',
            detail: 'Grupo Eliminado',
            life: 3000,
          });
        }
      },
    });
  }

  hideDialog() {
    this.groupDialog = false;
    this.submitted = false;
  }

  saveGroup() {
    this.submitted = true;

    if (this.group.nombre.trim()) {
      if (this.group.id) {
        this.groupService.updateGroup(this.group);
        this.messageService.add({
          severity: 'success',
          summary: 'Exitoso',
          detail: 'Grupo Actualizado',
          life: 3000,
        });
      } else {
        this.groupService.addGroup(this.group);
        this.messageService.add({
          severity: 'success',
          summary: 'Exitoso',
          detail: 'Grupo Creado',
          life: 3000,
        });
      }

      this.groups = [...this.groups];
      this.groupDialog = false;
      this.group = {} as Group;
    }
  }

  viewGroupDashboard(group: Group) {
    this.router.navigate(['/tickets/group'], { queryParams: { group: group.nombre } });
  }

  getTicketCount(groupName: string): number {
    return this.ticketService.tickets().filter(t => t.grupo === groupName).length;
  }

  getSeverity(nivel: string) {
    switch (nivel) {
      case 'Alta':
        return 'danger';
      case 'Media':
        return 'warn';
      case 'Baja':
        return 'success';
      default:
        return 'info';
    }
  }

  canViewGroup(group: Group): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.role === 'SuperAdmin') return true;
    return user.groups.includes(group.nombre);
  }
}

