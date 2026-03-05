import { Component } from '@angular/core';
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
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, BadgeModule, TagModule, ToastModule, ReactiveFormsModule, DialogModule, TooltipModule, InputNumberModule],
  providers: [MessageService],
  templateUrl: './group.html',
  styleUrl: './group.css'
})
export class GroupComponent {
  grupos: { nombre: string; nivel: number; descripcion: string, autor: string, integrantes: string[], tickets: number }[] = [
    { nombre: "Grupo A", nivel: 1, descripcion: "Descripción del Grupo A", autor: "Alan", integrantes: ["Alan", "Juan", "Pedro"], tickets: 10 },
    { nombre: "Grupo B", nivel: 2, descripcion: "Descripción del Grupo B", autor: "Alan", integrantes: ["Alan", "Juan", "Pedro"], tickets: 20 },
    { nombre: "Grupo C", nivel: 3, descripcion: "Descripción del Grupo C", autor: "Alan", integrantes: ["Alan", "Juan", "Pedro"], tickets: 30 }
  ];

  groupForm: FormGroup;
  displayModal: boolean = false;
  isEditing: boolean = false;
  editingIndex: number | null = null;

  constructor(private messageService: MessageService, private fb: FormBuilder) {
    this.groupForm = this.fb.group({
      nombre: ["", Validators.required],
      nivel: [1, [Validators.required, Validators.min(1)]],
      descripcion: ["", Validators.required],
      autor: ["", Validators.required],
      integrantes: ["", Validators.required],
      tickets: [0, [Validators.required, Validators.min(0)]]
    });
  }

  openModal(editing: boolean, index?: number) {
    this.isEditing = editing;
    this.displayModal = true;

    if (editing && index !== undefined) {
      this.editingIndex = index;
      const grupo = this.grupos[index];
      this.groupForm.setValue({
        nombre: grupo.nombre,
        nivel: grupo.nivel,
        descripcion: grupo.descripcion,
        autor: grupo.autor,
        integrantes: grupo.integrantes.join(', '),
        tickets: grupo.tickets
      });
    } else {
      this.editingIndex = null;
      this.groupForm.reset({ nivel: 1 });
    }
  }

  closeModal() {
    this.displayModal = false;
    this.groupForm.reset({ nivel: 1 });
  }

  saveGroup() {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;
      const nuevoGrupo = {
        ...formValue,
        integrantes: typeof formValue.integrantes === 'string'
          ? formValue.integrantes.split(',').map((i: string) => i.trim())
          : formValue.integrantes,
        tickets: formValue.tickets
      };

      if (this.isEditing && this.editingIndex !== null) {
        this.grupos[this.editingIndex] = nuevoGrupo;
        this.messageService.add({ severity: 'info', summary: 'Grupo Editado', detail: `El grupo fue actualizado: ${nuevoGrupo.nombre}` });
      } else {
        this.grupos.push(nuevoGrupo);
        this.messageService.add({ severity: 'success', summary: 'Grupo Creado', detail: `Se creó el grupo: ${nuevoGrupo.nombre}` });
      }

      this.closeModal();
    }
  }

  deleteGroup(index: number) {
    const eliminado = this.grupos.splice(index, 1);
    this.messageService.add({ severity: 'warn', summary: 'Grupo Eliminado', detail: `Se eliminó el grupo: ${eliminado[0].nombre}` });
  }
}