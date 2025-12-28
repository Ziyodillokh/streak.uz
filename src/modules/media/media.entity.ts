import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  path: string;

  @Column()
  model: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @Column({ nullable: true })
  name: string;

  @OneToMany(() => User, (user) => user.avatar)
  users: User[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
