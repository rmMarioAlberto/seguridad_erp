import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Group, GroupMember } from '../../models/group.model';
import { GroupService } from '../../services/group.service';
import { TicketService } from '../../services/ticket.service';
import { AuthPermissionService } from '../../services/auth-permission.service';
import { UserManagementService } from '../../services/user-management.service';
import { RefetchService } from '../../services/refetch.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';

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
    IconFieldModule,
    InputIconModule,
    MultiSelectModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class GroupComponent implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly ticketService = inject(TicketService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly authService = inject(AuthPermissionService);
  private readonly userService = inject(UserManagementService);
  private readonly refetchService = inject(RefetchService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  groups = this.groupService.groups;
  groupDialog = false;
  membersDialog = false;
  group: Partial<Group> = {};
  submitted = false;

  // Member management state
  selectedGroupForMembers: Group | null = null;
  currentMembers = signal<GroupMember[]>([]);
  selectedUserToAdd: number | null = null;

  // All users minus current members for the "add" dropdown
  availableUsers = computed(() => {
    const memberIds = new Set(this.currentMembers().map(m => m.id));
    return this.userService.users()
      .filter(u => !memberIds.has(u.id))
      .map(u => ({ label: u.nombre_completo, value: u.id }));
  });

  availablePermissions = signal<{ label: string, value: string }[]>([]);

  // Granular Permission Signals
  readonly canCreate = computed(() => this.authService.hasPermission('groups:create'));
  readonly canEdit = computed(() => this.authService.hasPermission('groups:edit'));
  readonly canDelete = computed(() => this.authService.hasPermission('groups:delete'));
  readonly canManageMembers = computed(() => this.authService.hasPermission('groups:manage-members'));

  canManageGroups() {
    return this.authService.hasPermission('groups:view') || 
           this.canCreate() || this.canEdit() || this.canDelete() || this.canManageMembers();
  }

  ngOnInit() {
    this.groupService.loadGroups().subscribe();
    if (this.canManageMembers()) {
      this.userService.loadUsers().subscribe();
    }
    this.groupService.getGroupPermissionsCatalog().subscribe({
      next: (perms) => {
        // Filtro de seguridad: solo procesar permisos con alcance GROUP
        const filteredPerms = perms.filter(p => p.scope === 'GROUP');
        this.availablePermissions.set(filteredPerms.map(p => ({
          label: p.descripcion || p.nombre,
          value: p.nombre
        })));
      }
    });

    // Escuchar refrescos globales
    this.refetchService.refetch$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.groupService.loadGroups().subscribe();
        if (this.canManageMembers()) {
          this.userService.loadUsers().subscribe();
        }
      });
  }

  openNew() {
    this.group = {};
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
          this.groupService.deleteGroup(group.id).subscribe({
            next: (success) => {
              if (success) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Exitoso',
                  detail: 'Grupo Eliminado',
                  life: 3000,
                });
              }
            }
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

    if (this.group.nombre?.trim()) {
      const groupData = {
        nombre: this.group.nombre,
        descripcion: this.group.descripcion
      };

      if (this.group.id) {
        this.groupService.updateGroup(this.group.id, groupData).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Grupo Actualizado' });
                this.groupDialog = false;
            }
        });
      } else {
        this.groupService.addGroup(groupData).subscribe({
            next: () => {
                this.groupDialog = false;
            }
        });
      }
    }
  }

  openMembersDialog(group: Group) {
    this.selectedGroupForMembers = group;
    this.selectedUserToAdd = null;
    this.membersDialog = true;

    if (group.id) {
      this.groupService.getGroupDetails(group.id).subscribe({
        next: (detail) => {
          this.currentMembers.set(detail.miembros || []);
        }
      });
    }
  }

  addMember() {
    if (!this.selectedGroupForMembers?.id || !this.selectedUserToAdd) return;

    this.groupService.addMember(this.selectedGroupForMembers.id, this.selectedUserToAdd).subscribe({
      next: () => {
        const user = this.userService.users().find(u => u.id === this.selectedUserToAdd);
        if (user) {
          this.currentMembers.update(members => [...members, {
            id: user.id,
            nombre_completo: user.nombre_completo,
            username: user.username || ''
          }]);
        }
        this.selectedUserToAdd = null;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Miembro agregado al grupo' });
        this.groupService.loadGroups().subscribe();
      },
      error: (err) => {
        const msg = err?.error?.message || 'El usuario ya es miembro del grupo';
        this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: msg });
      }
    });
  }

  removeMember(member: GroupMember) {
    if (!this.selectedGroupForMembers?.id) return;

    this.confirmationService.confirm({
      message: `¿Quitar a ${member.nombre_completo} del grupo?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Quitar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.groupService.removeMember(this.selectedGroupForMembers!.id!, member.id).subscribe({
          next: () => {
            this.currentMembers.update(members => members.filter(m => m.id !== member.id));
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Miembro eliminado del grupo' });
            this.groupService.loadGroups().subscribe();
          }
        });
      }
    });
  }

  updatePermissions(member: GroupMember, selectedPerms: string[]) {
      if (!this.selectedGroupForMembers?.id) return;
      this.groupService.updateMemberPermissions(this.selectedGroupForMembers.id, member.id, selectedPerms).subscribe({
          next: () => {
              this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Permisos actualizados para ${member.nombre_completo}`, life: 2000 });
              // Actualizamos la señal local para que refleje el cambio
              this.currentMembers.update(members => 
                  members.map(m => m.id === member.id ? { ...m, permisos: selectedPerms } : m)
              );
          },
          error: () => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error al actualizar permisos` });
          }
      });
  }

  viewGroupDashboard(group: Group) {
    this.router.navigate(['/tickets'], { queryParams: { group: group.id } });
  }

  canViewGroup(group: Group): boolean {
    if (!group.id) return false;
    
    const userId = this.authService.currentUser()?.id;
    const isMember = this.authService.groups().some(g => g.id === group.id);
    const hasViewPerm = this.authService.hasPermissionForGroup('tickets:view', group.id);

    // 1. Es el creador 
    // 2. Es miembro 
    // 3. Tiene permiso explícito (Global o de Grupo)
    return group.creador_id === userId || isMember || hasViewPerm;
  }
}
