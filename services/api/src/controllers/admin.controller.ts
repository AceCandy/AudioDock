
import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { User } from '@soundx/db';
import { IErrorResponse, ISuccessResponse } from '../common/const';
import { UserService } from '../services/user';

@Controller('admin')
export class AdminController {
  constructor(private readonly userService: UserService) {}

  private async checkAdmin(userId: number) {
    const user = await this.userService.getUserById(userId);
    if (!user || !user.is_admin) {
      throw new ForbiddenException('需要管理员权限');
    }
  }

  @Get('users')
  async getUsers(@Req() req: any): Promise<ISuccessResponse<User[]> | IErrorResponse> {
    await this.checkAdmin(req.user.userId);
    const users = await this.userService.getUserList();
    return {
      code: 200,
      message: 'success',
      data: users,
    };
  }

  @Delete('users/:id')
  async deleteUser(@Req() req: any, @Param('id') id: string): Promise<ISuccessResponse<boolean> | IErrorResponse> {
    await this.checkAdmin(req.user.userId);
    const userId = parseInt(id);
    if (userId === req.user.userId) {
       return {
         code: 500,
         message: '不能删除自己',
       };
    }
    await this.userService.deleteUser(userId);
    return {
      code: 200,
      message: 'success',
      data: true,
    };
  }

  @Post('users/:id/expiration')
  async setUserExpiration(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { days: number | null }
  ): Promise<ISuccessResponse<User> | IErrorResponse> {
    await this.checkAdmin(req.user.userId);
    const user = await this.userService.setUserExpiration(parseInt(id), body.days);
    return {
      code: 200,
      message: 'success',
      data: user,
    };
  }

  @Get('settings/registration')
  async getRegistrationSetting(@Req() req: any): Promise<ISuccessResponse<boolean> | IErrorResponse> {
    await this.checkAdmin(req.user.userId);
    const isAllowed = await this.userService.isRegistrationAllowed();
    return {
      code: 200,
      message: 'success',
      data: isAllowed,
    };
  }

  @Post('settings/registration')
  async toggleRegistration(
    @Req() req: any,
    @Body() body: { allowed: boolean }
  ): Promise<ISuccessResponse<boolean> | IErrorResponse> {
    await this.checkAdmin(req.user.userId);
    await this.userService.setSetting('allow_registration', String(body.allowed));
    return {
      code: 200,
      message: 'success',
      data: body.allowed,
    };
  }
}
