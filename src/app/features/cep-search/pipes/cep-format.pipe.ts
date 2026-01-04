import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cepFormat',
  standalone: true
})
export class CepFormatPipe implements PipeTransform {
  public transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const cleanCep = value.replace(/\D/g, '');

    if (cleanCep.length === 8) {
      return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
    }

    return cleanCep;
  }
}

