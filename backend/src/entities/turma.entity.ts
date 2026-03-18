import { Aluno } from "./aluno.entity";

export class Turma {
  id: number;
  nome: string;
  ano: number;
  alunos?: Aluno[];

  constructor(props: Turma) {
    this.id = props.id;
    this.nome = props.nome;
    this.ano = props.ano;
    this.alunos = props.alunos;
  }
}