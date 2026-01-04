import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HelpModalComponent, IHelpItem } from '../../shared/ui/help-modal';
import { CepService } from './services';
import { ICepResponse } from './models';
import { CepFormatPipe } from './pipes';

@Component({
  selector: 'app-cep-search',
  standalone: true,
  imports: [CommonModule, FormsModule, CepFormatPipe, HelpModalComponent],
  templateUrl: './cep-search.component.html',
  styleUrls: ['./cep-search.component.scss']
})
export class CepSearchComponent {
  public cepInput: string = '';
  public cepData: ICepResponse | null = null;
  public isLoading: boolean = false;
  public errorMessage: string = '';
  public mapsUrl: SafeResourceUrl | null = null;
  public showHelpModal: boolean = false;
  public helpItems: IHelpItem[] = [
    { text: 'Digite o CEP com 8 dígitos (apenas números)' },
    { text: 'Clique em "Buscar" ou pressione Enter' },
    { text: 'As informações do endereço serão exibidas abaixo' },
    { text: 'Visualize a localização no mapa do Google Maps' },
    { text: 'Clique em "Abrir no Google Maps" para ver no navegador e usar Street View' },
    { text: 'Dados fornecidos pela API ViaCEP' }
  ];

  private cepService = inject(CepService);
  private sanitizer = inject(DomSanitizer);

  public onCepInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length <= 8) {
      this.cepInput = value;
      this.errorMessage = '';

      if (this.cepData) {
        this.cepData = null;
      }
    } else {
      input.value = this.cepInput;
    }
  }

  public searchCep(): void {
    const cleanCep = this.cepInput.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      this.errorMessage = 'CEP deve conter 8 dígitos';
      this.cepData = null;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cepData = null;

    this.cepService.searchCep(cleanCep).subscribe({
      next: (result) => {
        if (result) {
          this.cepData = result;
          this.mapsUrl = this.buildMapsUrl(result);
        } else {
          this.errorMessage = 'CEP não encontrado';
          this.mapsUrl = null;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erro ao buscar CEP. Tente novamente.';
        console.error('Erro ao buscar CEP:', error);
        this.mapsUrl = null;
        this.isLoading = false;
      }
    });
  }

  public onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchCep();
    }
  }

  public clearSearch(): void {
    this.cepInput = '';
    this.cepData = null;
    this.errorMessage = '';
    this.mapsUrl = null;
  }

  private buildMapsUrl(cepData: ICepResponse): SafeResourceUrl {
    const addressParts: string[] = [];

    if (cepData.logradouro) {
      addressParts.push(cepData.logradouro);
    }
    if (cepData.bairro) {
      addressParts.push(cepData.bairro);
    }
    if (cepData.localidade) {
      addressParts.push(cepData.localidade);
    }
    if (cepData.uf) {
      addressParts.push(cepData.uf);
    }
    if (cepData.cep) {
      addressParts.push(`CEP ${cepData.cep}`);
    }

    const address = addressParts.join(', ');

    // Google Maps Embed - funciona sem API key para uso básico
    // Usa a URL de busca direta do Google Maps
    const url = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  public openInGoogleMaps(): void {
    if (this.cepData) {
      const addressParts: string[] = [];

      if (this.cepData.logradouro) {
        addressParts.push(this.cepData.logradouro);
      }
      if (this.cepData.bairro) {
        addressParts.push(this.cepData.bairro);
      }
      if (this.cepData.localidade) {
        addressParts.push(this.cepData.localidade);
      }
      if (this.cepData.uf) {
        addressParts.push(this.cepData.uf);
      }
      if (this.cepData.cep) {
        addressParts.push(`CEP ${this.cepData.cep}`);
      }

      const address = addressParts.join(', ');
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  }

  public openHelpModal(): void {
    this.showHelpModal = true;
  }

  public closeHelpModal(): void {
    this.showHelpModal = false;
  }
}

