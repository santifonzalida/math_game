import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Level, Operation } from '../common/game.types';
import { Question } from '../questions/question-generator';

/** A game in progress or finished. The server owns the questions and the clock. */
@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 30 })
  name: string;

  @Column({ type: 'enum', enum: Operation })
  operation: Operation;

  @Column({ type: 'enum', enum: Level })
  level: Level;

  /** Includes the answers; never sent to the client. */
  @Column({ type: 'jsonb' })
  questions: Question[];

  /** Correct answers received so far; also the index of the current question. */
  @Column({ type: 'int', default: 0 })
  correctCount: number;

  /** When the clock starts: creation time plus the countdown. */
  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  /** Official time, measured by the server. */
  @Column({ type: 'int', nullable: true })
  timeMs: number | null;

  /** Saved ranking entry; null while playing or if the time was rejected. */
  @Column({ type: 'int', nullable: true })
  scoreId: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
