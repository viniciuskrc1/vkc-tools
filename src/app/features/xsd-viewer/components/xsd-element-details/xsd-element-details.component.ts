import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XsdElement } from '../../models';

@Component({
  selector: 'app-xsd-element-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xsd-element-details.component.html',
  styleUrls: ['./xsd-element-details.component.scss']
})
export class XsdElementDetailsComponent {
  @Input() element!: XsdElement;

  public isRequired(): boolean {
    const minOccurs = this.element.minOccurs;
    if (minOccurs === undefined || minOccurs === null) {
      return true;
    }
    if (typeof minOccurs === 'string') {
      return minOccurs !== '0';
    }
    return minOccurs > 0;
  }

  public getOccursLabel(): string {
    const min = this.element.minOccurs ?? 1;
    const max = this.element.maxOccurs ?? 1;
    const minStr = min === 'unbounded' || min === 0 ? String(min) : String(min);
    const maxStr = max === 'unbounded' ? '∞' : String(max);
    
    if (minStr === maxStr) {
      return minStr;
    }
    return `${minStr}..${maxStr}`;
  }
}

