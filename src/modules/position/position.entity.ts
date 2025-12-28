import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRoleEnum } from 'src/infra/shared/enum';

@Entity('position')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  title: string;

  @Column('boolean', { default: true })
  is_active: boolean;

  @OneToMany(() => User, (user) => user.position)
  users: User[];

  @Column({ type: 'int', default: UserRoleEnum.JOB_SEEKER, nullable: true })
  role: UserRoleEnum;
}
