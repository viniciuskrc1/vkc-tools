import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalService } from './modal.service';
import { IModalConfig } from './modal-config.interface';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
  public config: IModalConfig | null = null;
  public show: boolean = false;

  private readonly modalService = inject(ModalService);
  private readonly destroyed$ = new Subject<void>();

  @HostListener('document:keydown.escape')
  public onEscapeKey(): void {
    if (this.show) {
      this.cancel();
    }
  }

  public ngOnInit(): void {
    this.modalService.modal$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((config) => {
        this.config = config;
        this.show = config !== null;
      });
  }

  public ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  public confirm(): void {
    if (this.config?.onConfirm) {
      this.config.onConfirm();
    }
    this.close();
  }

  public cancel(): void {
    if (this.config?.onCancel) {
      this.config.onCancel();
    }
    this.close();
  }

  public close(): void {
    this.modalService.hide();
  }
}

