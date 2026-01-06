import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Position } from 'src/modules/position/position.entity';
import { Media } from 'src/modules/media/media.entity';
import { Habit } from '../habits/habit.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  firstName: string;

  @Column({ type: 'varchar', nullable: true })
  lastName: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  nickname: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  createdAt: string;

  @Column({ type: 'boolean', nullable: true, default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isVerify: boolean;

  public async hashPassword(password: string): Promise<void> {
    this.password = await bcrypt.hash(password, 10);
  }

  public isPasswordValid(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  @ManyToOne(() => Position, (position) => position.users)
  @JoinColumn()
  position: Position;

  @ManyToOne(() => Media, (media) => media.users, { onDelete: 'SET NULL' })
  avatar: Media;

  @ManyToMany(() => Habit, (habit) => habit.users, { nullable: true })
  @JoinTable()
  habits: Habit[];

  @Column({ unique: true, nullable: true })
  telegramId: string;

  @Column({ nullable: true })
  photoUrl: string;
}
