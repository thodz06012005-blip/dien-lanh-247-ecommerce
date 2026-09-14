import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; import { RolesGuard } from '../../common/guards/roles.guard'; import { Roles } from '../../common/decorators/roles.decorator';
import { SaveInspectionDto } from './operations.dto'; import { OperationsService } from './operations.service';
@Controller('admin/service-requests') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.STAFF,UserRole.ADMIN,UserRole.SUPERADMIN)
export class OperationsController { constructor(private service:OperationsService){} @Patch(':id/inspection') save(@Param('id') id:string,@Body() dto:SaveInspectionDto,@Req() req:any){return this.service.saveInspection(id,dto,String(req.user.userId));} }
