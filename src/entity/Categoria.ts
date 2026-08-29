import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "categorias" })
export class Categoria {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
    nombre!: string;
}