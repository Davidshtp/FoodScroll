export class PublicationNotFoundException extends Error {
  constructor(message: string = 'Publication not found') {
    super(message);
    this.name = 'PublicationNotFoundException';
  }
}