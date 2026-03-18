import { Turma } from "./turma.entity";

export class Aluno {
  id: number;
  matricula: string;
  nome: string;
  biometria: number;

  entrada: Date;
  saida: Date;

  turma_id: number;
  turma?: Turma;

  constructor(props: Aluno) {
    this.id = props.id;
    this.matricula = props.matricula;
    this.nome = props.nome;
    this.biometria = props.biometria;
    this.entrada = props.entrada;
    this.saida = props.saida;
    this.turma_id = props.turma_id;
    this.turma = props.turma;
  }
}