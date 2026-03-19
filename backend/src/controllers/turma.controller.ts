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
import { TurmaService } from '../services/turma.service';
import { CreateTurmaDto } from '../dtos/create-turma.dto';
import { UpdateTurmaDto } from '../dtos/update-turma.dto';
import { Turma } from '@prisma/client';

@Controller('turmas')
export class TurmaController {
  constructor(private readonly turmaService: TurmaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTurmaDto: CreateTurmaDto): Promise<Turma> {
    return this.turmaService.create(createTurmaDto);
  }

  @Get()
  async findAll(): Promise<Turma[]> {
    return this.turmaService.findAll();
  }

  @Get('ano/:ano')
  async findByAno(@Param('ano', ParseIntPipe) ano: number): Promise<Turma[]> {
    return this.turmaService.findByAno(ano);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Turma> {
    return this.turmaService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTurmaDto: UpdateTurmaDto,
  ): Promise<Turma> {
    return this.turmaService.update(id, updateTurmaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.turmaService.delete(id);
  }
}