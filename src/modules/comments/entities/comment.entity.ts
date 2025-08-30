import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Comment {
    @PrimaryGeneratedColumn({type : 'int'})
    id: number

    @Column( {type : 'int'} )
    user_id: number 

    @Column( {type : 'int'} )
    post_id: number

    @Column( {type : 'varchar'})
    comment: string

  @CreateDateColumn( {type : 'date'} )
  created_at: Date;

}
