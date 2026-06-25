import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';

import { CreateProcedureDto } from '../dto/create-procedure.dto';
import { UpdateProcedureDto } from '../dto/update-procedure.dto';
import { ProcedureEntity } from '../entities/procedure.entity';
import { ProceduresService } from './procedures.service';

describe('ProceduresService', () => {
  let service: ProceduresService;
  let procedureRepository: jest.Mocked<
    Pick<
      Repository<ProcedureEntity>,
      'create' | 'save' | 'findAndCount' | 'findOne' | 'update' | 'delete'
    >
  >;

  const userId = 'user-id';

  beforeEach(async () => {
    procedureRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProceduresService,
        {
          provide: getRepositoryToken(ProcedureEntity),
          useValue: procedureRepository,
        },
      ],
    }).compile();

    service = module.get<ProceduresService>(ProceduresService);
  });

  describe('create', () => {
    const createProcedureDto: CreateProcedureDto = {
      name: 'Manicure',
      description: 'Manicure completa',
      price: 5000,
      returnDays: 15,
      durationMinutes: 60,
    };

    it('creates and persists a procedure for the authenticated user', async () => {
      const createdProcedure = {
        name: createProcedureDto.name,
        description: createProcedureDto.description,
        price: createProcedureDto.price,
        returnDays: createProcedureDto.returnDays,
        durationMinutes: createProcedureDto.durationMinutes,
        user: { id: userId },
      } as ProcedureEntity;
      const savedProcedure = {
        ...createdProcedure,
        id: 'procedure-id',
      } as ProcedureEntity;

      procedureRepository.create.mockReturnValue(createdProcedure);
      procedureRepository.save.mockResolvedValue(savedProcedure);

      await expect(service.create(createProcedureDto, userId)).resolves.toEqual(
        savedProcedure,
      );

      expect(procedureRepository.create).toHaveBeenCalledWith({
        name: createProcedureDto.name,
        description: createProcedureDto.description,
        price: createProcedureDto.price,
        returnDays: createProcedureDto.returnDays,
        durationMinutes: createProcedureDto.durationMinutes,
        user: { id: userId },
      });
      expect(procedureRepository.save).toHaveBeenCalledWith(createdProcedure);
    });
  });

  describe('findAll', () => {
    it('returns paginated procedures for the authenticated user', async () => {
      const procedures = [{ id: 'procedure-id' }] as ProcedureEntity[];

      procedureRepository.findAndCount.mockResolvedValue([procedures, 1]);

      await expect(
        service.findAll({ page: 2, limit: 5 }, userId),
      ).resolves.toEqual({
        procedures,
        totalCount: 1,
      });

      expect(procedureRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        skip: 1,
        take: 5,
      });
    });
  });

  describe('findOne', () => {
    it('returns a procedure when it belongs to the user', async () => {
      const procedure = { id: 'procedure-id' } as ProcedureEntity;

      procedureRepository.findOne.mockResolvedValue(procedure);

      await expect(service.findOne('procedure-id', userId)).resolves.toEqual(
        procedure,
      );

      expect(procedureRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'procedure-id', user: { id: userId } },
      });
    });

    it('returns null when the procedure does not exist', async () => {
      procedureRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id', userId)).resolves.toBeNull();
    });
  });

  describe('update', () => {
    const updateProcedureDto: UpdateProcedureDto = {
      name: 'Pedicure',
    };

    it('returns null when the procedure does not exist', async () => {
      procedureRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', updateProcedureDto, userId),
      ).resolves.toBeNull();
      expect(procedureRepository.update).not.toHaveBeenCalled();
    });

    it('updates the procedure when it belongs to the user', async () => {
      const procedure = { id: 'procedure-id' } as ProcedureEntity;
      const updateResult = { affected: 1 } as UpdateResult;

      procedureRepository.findOne.mockResolvedValue(procedure);
      procedureRepository.update.mockResolvedValue(updateResult);

      await expect(
        service.update('procedure-id', updateProcedureDto, userId),
      ).resolves.toEqual(updateResult);

      expect(procedureRepository.update).toHaveBeenCalledWith('procedure-id', {
        name: 'Pedicure',
        description: undefined,
        durationMinutes: undefined,
        price: undefined,
        returnDays: undefined,
        updatedAt: expect.any(Date) as Date,
      });
    });
  });

  describe('remove', () => {
    it('returns null when the procedure does not exist', async () => {
      procedureRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id', userId)).resolves.toBeNull();
      expect(procedureRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes the procedure when it belongs to the user', async () => {
      const procedure = { id: 'procedure-id' } as ProcedureEntity;
      const deleteResult = { affected: 1 } as DeleteResult;

      procedureRepository.findOne.mockResolvedValue(procedure);
      procedureRepository.delete.mockResolvedValue(deleteResult);

      await expect(service.remove('procedure-id', userId)).resolves.toEqual(
        deleteResult,
      );
      expect(procedureRepository.delete).toHaveBeenCalledWith('procedure-id');
    });
  });
});
