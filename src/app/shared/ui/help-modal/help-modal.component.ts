import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IHelpItem } from './models';

@Component({
  selector: 'app-help-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss']
})
export class HelpModalComponent {
  @Input() public modalTitle: string = '';
  @Input() public items: IHelpItem[] = [];
  @Input() public show: boolean = false;
  @Input() public icon: string = '💡';
  @Output() public onClose = new EventEmitter<void>();

  public close(): void {
    this.onClose.emit();
  }

  @HostListener('document:keydown.escape')
  public onEscapeKey(): void {
    if (this.show) {
      this.close();
    }
  }
}

