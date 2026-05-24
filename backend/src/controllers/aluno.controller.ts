import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AlunoService } from '../services/aluno.service';
import { CreateAlunoDto } from '../dtos/create-aluno.dto';
import { UpdateAlunoDto } from '../dtos/update-aluno.dto';
import { Aluno } from '@prisma/client';

@Controller('alunos')
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAlunoDto: CreateAlunoDto): Promise<Aluno> {
    return this.alunoService.create(createAlunoDto);
  }

  // POST /alunos/biometria/leitura
  // Chamado pelo ESP32 após identificar uma digital
  @Post('biometria/leitura')
  async registrarLeitura(
    @Body() body: { biometria: number },
  ): Promise<{ encontrado: boolean; aluno?: Aluno }> {
    return this.alunoService.registrarLeitura(body.biometria);
  }

  // POST /alunos/biometria/iniciar-cadastro
  // Chamado pelo Frontend para iniciar a captura de digital no ESP32
  @Post('biometria/iniciar-cadastro')
  async iniciarCadastro(): Promise<{ id: number }> {
    return this.alunoService.iniciarCadastro();
  }

  // GET /alunos/biometria/solicitacao
  // Chamado pelo ESP32 (polling) para verificar se há cadastro solicitado
  @Get('biometria/solicitacao')
  async obterSolicitacaoCadastro(): Promise<{ cadastrar: boolean; id?: number }> {
    return this.alunoService.obterSolicitacaoCadastro();
  }

  @Get()
  async findAll(): Promise<Aluno[]> {
    return this.alunoService.findAll();
  }

  @Get('matricula/:matricula')
  async findByMatricula(
    @Param('matricula') matricula: string,
  ): Promise<Aluno> {
    return this.alunoService.findByMatricula(matricula);
  }

  @Get('biometria/:biometria')
  async findByBiometria(
    @Param('biometria', ParseIntPipe) biometria: number,
  ): Promise<Aluno> {
    return this.alunoService.findByBiometria(biometria);
  }

  @Get('turma/:turmaId')
  async findByTurmaId(
    @Param('turmaId', ParseIntPipe) turmaId: number,
  ): Promise<Aluno[]> {
    return this.alunoService.findByTurmaId(turmaId);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Aluno> {
    return this.alunoService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlunoDto: UpdateAlunoDto,
  ): Promise<Aluno> {
    return this.alunoService.update(id, updateAlunoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.alunoService.delete(id);
  }
}