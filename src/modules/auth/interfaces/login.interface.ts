import { User } from 'src/modules/users/user.entity';

interface ILogin {
  accessTokenCookie: string;
  refreshTokenCookie: string;
  user: User;
}

export default ILogin;
