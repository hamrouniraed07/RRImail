export interface CourierStats {
  entrant: number;
  sortant: number;
  enAttente: number;
  enRetard: number;
}

export interface FluxData {
  month: string;
  scolante: number;
  rh: number;
  finances: number;
}

export interface ServiceDistribution {
  name: string;
  value: number;
  color: string;
}

export interface UrgentCourier {
  id: string;
  numero: string;
  objet: string;
  expediteur: string;
  echeance: string;
  priorite: string;
  statut: string;
}

export interface AIInsight {
  message: string;
  performance: boolean;
  retards: number;
}
