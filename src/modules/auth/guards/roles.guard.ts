import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRoleEnum } from 'src/infra/shared/enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from 'src/modules/users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user }: { user?: User } = context.switchToHttp().getRequest();

    if (!user?.position?.role) {
      return false;
    }

    return requiredRoles.includes(user.position.role);
  }
}
