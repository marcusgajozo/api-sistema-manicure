import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';

import { PaginatedResponseDto } from '@/common/dtos/pagination.dto';
import { ResponseDto } from '@/common/dtos/response.dto';

import { CreateProcedureDto } from '../dto/create-procedure.dto';
import { UpdateProcedureDto } from '../dto/update-procedure.dto';
import { ProcedureEntity } from '../entities/procedure.entity';
import { ProceduresService } from '../services/procedures.service';
import { ProceduresController } from './procedures.controller';

describe('ProceduresController', () => {
  let controller: ProceduresController;
  let proceduresService: jest.Mocked<
    Pick<
      ProceduresService,
      'create' | 'findAll' | 'findOne' | 'update' | 'remove'
    >
  >;
  let i18n: jest.Mocked<Pick<I18nService, 'translate'>>;

  beforeEach(async () => {
    proceduresService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    i18n = {
      translate: jest.fn((key: string) => key),
    } as unknown as jest.Mocked<Pick<I18nService, 'translate'>>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProceduresController],
      providers: [
        {
          provide: ProceduresService,
          useValue: proceduresService,
        },
        {
          provide: I18nService,
          useValue: i18n,
        },
      ],
    }).compile();

    controller = module.get<ProceduresController>(ProceduresController);
  });

  describe('create', () => {
    const createProcedureDto: CreateProcedureDto = {
      name: 'Manicure',
      description: 'Manicure completa',
      price: 5000,
      returnDays: 15,
      durationMinutes: 60,
    };

    it('creates a procedure for the authenticated user', async () => {
      proceduresService.create.mockResolvedValue({
        id: 'procedure-id',
      } as ProcedureEntity);

      await expect(
        controller.create(createProcedureDto),
      ).resolves.toBeUndefined();
      expect(proceduresService.create).toHaveBeenCalledWith(createProcedureDto);
    });
  });

  describe('findAll', () => {
    it('returns paginated procedures', async () => {
      const procedures = [{ id: 'procedure-id' }] as ProcedureEntity[];

      proceduresService.findAll.mockResolvedValue({
        procedures,
        totalCount: 1,
      });

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(
        new PaginatedResponseDto(procedures, {
          page: 1,
          limit: 10,
          totalCount: 1,
        }),
      );
      expect(proceduresService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    it('returns a procedure when it exists', async () => {
      const procedure = { id: 'procedure-id' } as ProcedureEntity;

      proceduresService.findOne.mockResolvedValue(procedure);

      const result = await controller.findOne('procedure-id');

      expect(result).toEqual(new ResponseDto(procedure));
    });

    it('throws NotFoundException when the procedure does not exist', async () => {
      proceduresService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(i18n.translate).toHaveBeenCalledWith('validation.NOT_FOUND');
    });
  });

  describe('update', () => {
    const updateProcedureDto: UpdateProcedureDto = {
      name: 'Pedicure',
    };

    it('updates a procedure when it exists', async () => {
      proceduresService.update.mockResolvedValue({ affected: 1 } as never);

      await expect(
        controller.update('procedure-id', updateProcedureDto),
      ).resolves.toBeUndefined();
      expect(proceduresService.update).toHaveBeenCalledWith(
        'procedure-id',
        updateProcedureDto,
      );
    });

    it('throws NotFoundException when the procedure does not exist', async () => {
      proceduresService.update.mockResolvedValue(null);

      await expect(
        controller.update('missing-id', updateProcedureDto),
      ).rejects.toThrow(NotFoundException);
      expect(i18n.translate).toHaveBeenCalledWith('validation.NOT_FOUND');
    });
  });

  describe('remove', () => {
    it('removes a procedure when it exists', async () => {
      proceduresService.remove.mockResolvedValue({ affected: 1 } as never);

      await expect(controller.remove('procedure-id')).resolves.toBeUndefined();
      expect(proceduresService.remove).toHaveBeenCalledWith('procedure-id');
    });

    it('throws NotFoundException when the procedure does not exist', async () => {
      proceduresService.remove.mockResolvedValue(null);

      await expect(controller.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(i18n.translate).toHaveBeenCalledWith('validation.NOT_FOUND');
    });
  });
});
