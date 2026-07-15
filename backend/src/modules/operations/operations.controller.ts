import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ADMIN_PERMISSIONS } from '../../common/auth/admin-permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CompletionReportDto,
  CreateQuoteDto,
  CustomerDeviceDto,
  DispatchDto,
  InternalNoteDto,
  OperationsQueryDto,
  PaymentRecordDto,
  QuoteDecisionDto,
  RescheduleDto,
  SlaPolicyDto,
  TechnicianScheduleDto,
  WarrantyDto,
  WarrantyEventDto,
} from './dto/operations.dto';
import { OperationsService, type OperationsActor } from './operations.service';

interface CurrentAdmin {
  userId: number;
  email: string;
  role: string;
  name?: string;
}

type OperationsResponse = Record<string, unknown>;

@Controller()
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  private actor(user: CurrentAdmin): OperationsActor {
    return { userId: user.userId, email: user.email, role: user.role, name: user.name };
  }

  @Post('operations/quotes/confirm')
  confirmQuote(@Body() dto: QuoteDecisionDto) {
    return this.operations.quoteDecision(dto);
  }

  @Get('admin/operations/overview')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  overview() {
    return this.operations.overview();
  }

  @Get('admin/operations/customers')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  customers(@Query() query: OperationsQueryDto) {
    return this.operations.listCustomers(query);
  }

  @Get('admin/operations/customers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  customer(@Param('id') id: string) {
    return this.operations.customerDetail(Number(id));
  }

  @Post('admin/operations/devices')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  createDevice(@Body() dto: CustomerDeviceDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.createDevice(dto, this.actor(user));
  }

  @Patch('admin/operations/devices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  updateDevice(@Param('id') id: string, @Body() dto: CustomerDeviceDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.updateDevice(Number(id), dto, this.actor(user));
  }

  @Get('admin/operations/technicians')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  technicians(@Query() query: OperationsQueryDto) {
    return this.operations.listTechnicians(query);
  }

  @Get('admin/operations/technicians/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  technician(@Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.operations.technicianDetail(id, from, to);
  }

  @Post('admin/operations/technician-schedules')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  createSchedule(@Body() dto: TechnicianScheduleDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.createSchedule(dto, this.actor(user));
  }

  @Get('admin/operations/requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  async workspace(@Param('id') id: string): Promise<OperationsResponse> {
    return await this.operations.workspace(id);
  }

  @Post('admin/operations/requests/:id/dispatch')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  async dispatch(@Param('id') id: string, @Body() dto: DispatchDto, @CurrentUser() user: CurrentAdmin): Promise<OperationsResponse> {
    return await this.operations.dispatch(id, dto, this.actor(user));
  }

  @Post('admin/operations/requests/:id/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  async reschedule(@Param('id') id: string, @Body() dto: RescheduleDto, @CurrentUser() user: CurrentAdmin): Promise<OperationsResponse> {
    return await this.operations.reschedule(id, dto, this.actor(user));
  }

  @Post('admin/operations/requests/:id/notes')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  note(@Param('id') id: string, @Body() dto: InternalNoteDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.addNote(id, dto, this.actor(user));
  }

  @Get('admin/operations/sla/policies')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  slaPolicies() {
    return this.operations.listSlaPolicies();
  }

  @Post('admin/operations/sla/policies')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  createSlaPolicy(@Body() dto: SlaPolicyDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.saveSlaPolicy(dto, this.actor(user));
  }

  @Patch('admin/operations/sla/policies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  updateSlaPolicy(@Param('id') id: string, @Body() dto: SlaPolicyDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.saveSlaPolicy(dto, this.actor(user), Number(id));
  }

  @Get('admin/operations/sla/alerts')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  slaAlerts(@Query() query: OperationsQueryDto) {
    return this.operations.slaAlerts(query);
  }

  @Post('admin/operations/sla/evaluate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  evaluateSla() {
    return this.operations.evaluateSla();
  }

  @Post('admin/operations/requests/:id/quotes')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  createQuote(@Param('id') id: string, @Body() dto: CreateQuoteDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.createQuote(id, dto, this.actor(user));
  }

  @Get('admin/operations/quotes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  quote(@Param('id') id: string) {
    return this.operations.quoteDetail(Number(id));
  }

  @Post('admin/operations/requests/:id/payments')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  payment(@Param('id') id: string, @Body() dto: PaymentRecordDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.recordPayment(id, dto, this.actor(user));
  }

  @Post('admin/operations/requests/:id/completion')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  completion(@Param('id') id: string, @Body() dto: CompletionReportDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.createCompletion(id, dto, this.actor(user));
  }

  @Post('admin/operations/requests/:id/warranties')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  warranty(@Param('id') id: string, @Body() dto: WarrantyDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.createWarranty(id, dto, this.actor(user));
  }

  @Post('admin/operations/warranties/:id/events')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  warrantyEvent(@Param('id') id: string, @Body() dto: WarrantyEventDto, @CurrentUser() user: CurrentAdmin) {
    return this.operations.addWarrantyEvent(Number(id), dto, this.actor(user));
  }
}
