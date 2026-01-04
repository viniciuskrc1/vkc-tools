import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CpfGeneratorService {
  public generateValidCpf(): string {
    // Gera os 9 primeiros dígitos aleatoriamente
    const digits: number[] = [];
    for (let i = 0; i < 9; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }

    // Calcula o primeiro dígito verificador
    const firstDigit = this.calculateVerifierDigit(digits, 10);
    digits.push(firstDigit);

    // Calcula o segundo dígito verificador
    const secondDigit = this.calculateVerifierDigit(digits, 11);
    digits.push(secondDigit);

    return digits.join('');
  }

  public formatCpf(cpf: string): string {
    // Remove qualquer formatação existente
    const cleanCpf = cpf.replace(/\D/g, '');

    // Aplica a formatação XXX.XXX.XXX-XX
    if (cleanCpf.length === 11) {
      return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    return cleanCpf;
  }

  public validateCpf(cpf: string): boolean {
    const cleanCpf = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }

    // Extrai os dígitos
    const digits = cleanCpf.split('').map(Number);

    // Calcula o primeiro dígito verificador
    const firstDigit = this.calculateVerifierDigit(digits.slice(0, 9), 10);
    if (firstDigit !== digits[9]) {
      return false;
    }

    // Calcula o segundo dígito verificador
    const secondDigit = this.calculateVerifierDigit(digits.slice(0, 10), 11);
    if (secondDigit !== digits[10]) {
      return false;
    }

    return true;
  }

  private calculateVerifierDigit(digits: number[], multiplier: number): number {
    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * multiplier;
      multiplier--;
    }

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }
}

