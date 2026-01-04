import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-selector.component.html',
  styleUrls: ['./file-selector.component.scss']
})
export class FileSelectorComponent {
  @Input() id: string = 'fileInput';
  @Input() accept: string = '*/*';
  @Input() multiple: boolean = false;
  @Input() disabled: boolean = false;
  @Input() label: string = 'Selecionar Arquivo';
  @Input() dragDropLabel: string = 'Clique para selecionar ou arraste um arquivo aqui';
  @Input() hint: string = '';
  @Output() fileSelected = new EventEmitter<FileList>();

  public isDragging: boolean = false;

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileSelected.emit(input.files);
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) {
      this.isDragging = true;
    }
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (this.disabled) {
      return;
    }

    if (event.dataTransfer?.files) {
      const files = event.dataTransfer.files;
      this.fileSelected.emit(files);
    }
  }
}

