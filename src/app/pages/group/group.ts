import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TicketService } from '../../core/services/ticket.service';
import { Group } from '../../core/models/ticket.model';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, BadgeModule, TagModule, ToastModule, ReactiveFormsModule, DialogModule, TooltipModule, InputNumberModule],
  providers: [MessageService],
  templateUrl: './group.html',
  styleUrl: './group.css'
})
export class GroupComponent implements OnInit {
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);

  // Use Signal directly from the service
  grupos = this.ticketService.groups;

  groupForm: FormGroup<{
    name: FormControl<string | null>;
    level: FormControl<number | null>;
    description: FormControl<string | null>;
    responsible: FormControl<string | null>;
    members: FormControl<string | null>;
  }>;
  displayModal: boolean = false;
  isEditing: boolean = false;
  editingIndex: number | null = null;

  constructor() {

    this.groupForm = this.fb.group({
      name: ["", Validators.required],
      level: [1, [Validators.required, Validators.min(1)]],
      description: ["", Validators.required],
      responsible: ["", Validators.required],
      members: ["", Validators.required]
    });
  }

  ngOnInit() {
    // Signals don't need subscriptions here
  }

  openModal(editing: boolean, index?: number) {
    this.isEditing = editing;
    this.displayModal = true;

    if (editing && index !== undefined) {
      this.editingIndex = index;
      const grupo = this.grupos()[index];
      this.groupForm.setValue({
        name: grupo.name,
        level: grupo.level,
        description: grupo.description,
        responsible: grupo.responsible,
        members: grupo.members.join(', ')
      });
    } else {
      this.editingIndex = null;
      this.groupForm.reset({ level: 1 });
    }
  }

  closeModal() {
    this.displayModal = false;
    this.groupForm.reset({ level: 1 });
  }

  saveGroup() {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;
      const nuevoGrupo: Group = {
        id: this.isEditing && this.editingIndex !== null ? this.grupos()[this.editingIndex].id : Math.random().toString(36).substr(2, 9),
        name: formValue.name ?? '',
        level: formValue.level ?? 1,
        description: formValue.description ?? '',
        responsible: formValue.responsible ?? '',
        tickets: this.isEditing && this.editingIndex !== null ? this.grupos()[this.editingIndex].tickets : 0,
        members: typeof formValue.members === 'string'
          ? formValue.members.split(',').map((i: string) => i.trim())
          : []
      };

      if (this.isEditing && this.editingIndex !== null) {
        this.ticketService.upsertGroup(nuevoGrupo);
        this.messageService.add({ severity: 'info', summary: 'Grupo Editado', detail: `El grupo fue actualizado: ${nuevoGrupo.name}` });
      } else {
        this.ticketService.upsertGroup(nuevoGrupo);
        this.messageService.add({ severity: 'success', summary: 'Grupo Creado', detail: `Se creó el grupo: ${nuevoGrupo.name}` });
      }

      this.closeModal();
    }
  }

  deleteGroup(index: number) {
    const groupId = this.grupos()[index].id;
    const groupName = this.grupos()[index].name;
    this.ticketService.deleteGroup(groupId);
    this.messageService.add({ severity: 'warn', summary: 'Grupo Eliminado', detail: `Se eliminó el grupo: ${groupName}` });
  }
}
