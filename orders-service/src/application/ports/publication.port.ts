export interface PublicationData {
  id: string;
  title: string;
  price: number;
  restaurantId: string;
}

export interface PublicationPort {
  getPublicationById(publicationId: string, authorization: string): Promise<PublicationData>;
}

export const PUBLICATION_PORT = 'PUBLICATION_PORT';
