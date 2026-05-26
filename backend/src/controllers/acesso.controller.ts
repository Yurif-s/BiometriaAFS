import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AcessoService } from '../services/acesso.service';
import { CreateAcessoDto } from '../dtos/create-acesso.dto';
import { UpdateAcessoDto } from '../dtos/update-acesso.dto';

@Controller('acessos')
export class AcessoController {
  constructor(private readonly acessoService: AcessoService) {}

  @Post()
  async create(@Body() createAcessoDto: CreateAcessoDto) {
    return this.acessoService.create(createAcessoDto);
  }

  @Get('hoje')
  async findToday() {
    return this.acessoService.findToday();
  }

  @Get()
  async findAll() {
    return this.acessoService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.acessoService.findById(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAcessoDto: UpdateAcessoDto) {
    return this.acessoService.update(+id, updateAcessoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.acessoService.delete(+id);
  }
}
