export interface ICepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  regiao: string;
  unidade: string;
  erro?: boolean;
}

