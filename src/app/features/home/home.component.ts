import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { SidebarMenuComponent } from '../../shared/layout/sidebar-menu/sidebar-menu.component';
import { MenuItem } from '../../shared/layout/sidebar-menu/menu-item.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, SidebarMenuComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public menuItems: MenuItem[] = [
    {
      label: 'Extrator de Chave de Acesso',
      route: 'extract-access-key',
      selected: true
    },
    {
      label: 'Gerador de CPF',
      route: 'cpf-generator',
      selected: false
    },
    {
      label: 'Gerador de CNPJ',
      route: 'cnpj-generator',
      selected: false
    },
    {
      label: 'Buscar CEP',
      route: 'cep-search',
      selected: false
    },
    {
      label: 'Decode Image',
      route: 'decode-image',
      selected: false
    },
    {
      label: 'Encode File',
      route: 'encode-file',
      selected: false
    },
    {
      label: 'JSON Formatter',
      route: 'json-formatter',
      selected: false
    },
    {
      label: 'XSD Viewer',
      route: 'xsd-viewer',
      selected: false
    },
    {
      label: 'JSON para Código',
      route: 'json-to-code',
      selected: false
    }
  ];

  public sidebarCollapsed: boolean = false;

  private router = inject(Router);

  public ngOnInit(): void {
    // Carrega estado do sidebar
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      this.sidebarCollapsed = savedState === 'true';
    }

    // Navega para a rota padrão se estiver na raiz
    if (this.router.url === '/') {
      this.router.navigate([this.menuItems[0].route]);
    }
  }

  public onSidebarCollapsedChange(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}

