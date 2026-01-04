import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';

export const homeRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: '',
        redirectTo: 'extract-access-key',
        pathMatch: 'full'
      },
      {
        path: 'extract-access-key',
        loadChildren: () => import('../extract-access-key-file-page/extract-access-key-file-page.routes').then(m => m.extractAccessKeyFilePageRoutes)
      },
      {
        path: 'cpf-generator',
        loadChildren: () => import('../cpf-generator/cpf-generator.routes').then(m => m.cpfGeneratorRoutes)
      },
      {
        path: 'cnpj-generator',
        loadChildren: () => import('../cnpj-generator/cnpj-generator.routes').then(m => m.cnpjGeneratorRoutes)
      },
      {
        path: 'cep-search',
        loadChildren: () => import('../cep-search/cep-search.routes').then(m => m.cepSearchRoutes)
      },
      {
        path: 'decode-image',
        loadChildren: () => import('../decode-image/decode-image.routes').then(m => m.decodeImageRoutes)
      },
      {
        path: 'encode-file',
        loadChildren: () => import('../encode-file/encode-file.routes').then(m => m.encodeFileRoutes)
      },
      {
        path: 'json-formatter',
        loadChildren: () => import('../json-formatter/json-formatter.routes').then(m => m.jsonFormatterRoutes)
      },
      {
        path: 'xsd-viewer',
        loadChildren: () => import('../xsd-viewer/xsd-viewer.routes').then(m => m.xsdViewerRoutes)
      },
      {
        path: 'json-to-code',
        loadChildren: () => import('../json-to-code-page/json-to-code-page.routes').then(m => m.jsonToCodePageRoutes)
      }
    ]
  }
];

