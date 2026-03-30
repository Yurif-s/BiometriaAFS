export interface IRepository<T, TCreateInput, TUpdateInput> {
  create(data: TCreateInput): Promise<T>;
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: number, data: TUpdateInput): Promise<T>;
  delete(id: number): Promise<void>;
}