import { Component, Input, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuItem } from './menu-item.interface';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss']
})
export class SidebarMenuComponent implements OnInit {
  @Input() public menuItems: MenuItem[] = [];
  @Output() public collapsedChange = new EventEmitter<boolean>();

  public isCollapsed: boolean = false;
  public searchTerm: string = '';

  private router = inject(Router);

  public ngOnInit(): void {
    // Carrega estado do localStorage
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      this.isCollapsed = savedState === 'true';
    }

    // Seleciona o item padrão se nenhum estiver selecionado
    if (this.menuItems.length > 0 && !this.menuItems.some(item => item.selected)) {
      this.menuItems[0].selected = true;
    }

    // Atualiza seleção baseado na rota atual
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateSelectedItem(event.url);
      });

    // Atualiza seleção inicial
    this.updateSelectedItem(this.router.url);
  }

  public toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebar-collapsed', this.isCollapsed.toString());
    this.collapsedChange.emit(this.isCollapsed);
  }

  public selectItem(item: MenuItem): void {
    // Remove seleção de todos os itens
    this.menuItems.forEach(menuItem => menuItem.selected = false);

    // Seleciona o item clicado
    item.selected = true;

    // Navega para a rota
    this.router.navigate([item.route]);
  }

  public get filteredMenuItems(): MenuItem[] {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      return this.menuItems;
    }

    const term = this.searchTerm.toLowerCase().trim();
    return this.menuItems.filter(item =>
      item.label.toLowerCase().includes(term) ||
      item.route.toLowerCase().includes(term)
    );
  }

  public clearSearch(): void {
    this.searchTerm = '';
  }

  private updateSelectedItem(url: string): void {
    // Remove a barra inicial se existir para comparação
    const normalizedUrl = url.startsWith('/') ? url.substring(1) : url;

    this.menuItems.forEach(item => {
      const normalizedRoute = item.route.startsWith('/') ? item.route.substring(1) : item.route;
      item.selected = normalizedUrl === normalizedRoute || normalizedUrl.startsWith(normalizedRoute + '/');
    });
  }
}

