import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Level, Operation } from '../common/game.types';

@Entity('scores')
@Index(['operation', 'level', 'timeMs', 'errors', 'createdAt'])
export class Score {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  name: string;

  @Column({ type: 'enum', enum: Operation })
  operation: Operation;

  @Column({ type: 'enum', enum: Level })
  level: Level;

  @Column({ type: 'int' })
  timeMs: number;

  @Column({ type: 'int' })
  errors: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
