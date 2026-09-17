import 'reflect-metadata';
import { CirclesController } from './circles.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/** push-campaigns.controller.spec.ts'teki desenle aynı: servis doğrudan
 * mocklanır, Nest test modülü kurulmaz. */
describe('CirclesController', () => {
  const circlesService = {
    preview: jest.fn(),
    join: jest.fn(),
    create: jest.fn(),
    findMine: jest.fn(),
    findOne: jest.fn(),
    leave: jest.fn(),
    close: jest.fn(),
  };

  const userId = '507f1f77bcf86cd799439011';

  let controller: CirclesController;

  beforeEach(() => {
    Object.values(circlesService).forEach((fn) => fn.mockReset());
    controller = new CirclesController(circlesService as never);
  });

  it('preview delegates to service.preview(code)', async () => {
    circlesService.preview.mockResolvedValue({ name: 'Salavat Halkası' });

    const result = await controller.preview('ABCDEFGH');

    expect(circlesService.preview).toHaveBeenCalledWith('ABCDEFGH');
    expect(result).toEqual({ name: 'Salavat Halkası' });
  });

  it('join passes (userId, dto.code)', async () => {
    circlesService.join.mockResolvedValue({ id: 'circle1' });

    await controller.join({ code: 'ABCDEFGH' }, userId);

    expect(circlesService.join).toHaveBeenCalledWith(userId, 'ABCDEFGH');
  });

  it('leave passes (userId, id)', async () => {
    circlesService.leave.mockResolvedValue({ left: true });

    await controller.leave('circle1', userId);

    expect(circlesService.leave).toHaveBeenCalledWith(userId, 'circle1');
  });

  it('close passes (userId, id)', async () => {
    circlesService.close.mockResolvedValue({ id: 'circle1', status: 'closed' });

    await controller.close('circle1', userId);

    expect(circlesService.close).toHaveBeenCalledWith(userId, 'circle1');
  });

  it('has no guard on preview (public route) but requires JwtAuthGuard on join', () => {
    const proto: Record<string, object> = CirclesController.prototype;
    const previewGuards = Reflect.getMetadata('__guards__', proto.preview) as
      | unknown[]
      | undefined;
    expect(previewGuards ?? []).toHaveLength(0);

    const joinGuards = Reflect.getMetadata('__guards__', proto.join) as
      | unknown[]
      | undefined;
    expect(joinGuards).toBeDefined();
    expect(joinGuards).toContain(JwtAuthGuard);
  });
});
