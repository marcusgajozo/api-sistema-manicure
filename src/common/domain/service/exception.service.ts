export interface IExceptionService {
  badRequest(message: string): never;
  notFound(message: string): never;
  conflict(message: string): never;
  internal(message: string): never;
}
