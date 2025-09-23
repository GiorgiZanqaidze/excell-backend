import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessorController } from './file-processor.controller';
import { FileProcessorService } from './file-processor.service';

describe('FileProcessorController', () => {
  let fileProcessorController: FileProcessorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FileProcessorController],
      providers: [FileProcessorService],
    }).compile();

    fileProcessorController = app.get<FileProcessorController>(
      FileProcessorController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(fileProcessorController.getHello()).toBe('Hello World!');
    });
  });
});
