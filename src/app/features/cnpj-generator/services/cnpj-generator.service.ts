import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CnpjGeneratorService {
  public generateValidCnpj(): string {
    // Gera os 12 primeiros dígitos aleatoriamente
    const digits: number[] = [];
    for (let i = 0; i < 12; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }

    // Calcula o primeiro dígito verificador
    const firstDigit = this.calculateVerifierDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    digits.push(firstDigit);

    // Calcula o segundo dígito verificador
    const secondDigit = this.calculateVerifierDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    digits.push(secondDigit);

    return digits.join('');
  }

  public formatCnpj(cnpj: string): string {
    // Remove qualquer formatação existente
    const cleanCnpj = cnpj.replace(/\D/g, '');

    // Aplica a formatação XX.XXX.XXX/XXXX-XX
    if (cleanCnpj.length === 14) {
      return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    return cleanCnpj;
  }

  public validateCnpj(cnpj: string): boolean {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    // Verifica se tem 14 dígitos
    if (cleanCnpj.length !== 14) {
      return false;
    }

    // Verifica se todos os dígitos são iguais (CNPJ inválido)
    if (/^(\d)\1{13}$/.test(cleanCnpj)) {
      return false;
    }

    // Extrai os dígitos
    const digits = cleanCnpj.split('').map(Number);

    // Calcula o primeiro dígito verificador
    const firstDigit = this.calculateVerifierDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (firstDigit !== digits[12]) {
      return false;
    }

    // Calcula o segundo dígito verificador
    const secondDigit = this.calculateVerifierDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (secondDigit !== digits[13]) {
      return false;
    }

    return true;
  }

  private calculateVerifierDigit(digits: number[], multipliers: number[]): number {
    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * multipliers[i];
    }

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }
}

