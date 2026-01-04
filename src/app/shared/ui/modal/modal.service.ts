import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { IModalConfig } from './modal-config.interface';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  public modalSubject = new Subject<IModalConfig | null>();
  public modal$: Observable<IModalConfig | null> = this.modalSubject.asObservable();

  public show(config: IModalConfig): void {
    this.modalSubject.next(config);
  }

  public hide(): void {
    this.modalSubject.next(null);
  }
}

