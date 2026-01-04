import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ]
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() id?: string;
  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() rows: number = 8;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() showClearButton: boolean = true;
  @Input() value: string = '';
  @Input() fontFamily: string = 'inherit'; // 'inherit' ou 'monospace'
  @Output() valueChange = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  private onChange = (value: string) => {};
  private onTouched = () => {};

  public onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  public onBlur(): void {
    this.onTouched();
  }

  public clearInput(): void {
    this.value = '';
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.clear.emit();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

