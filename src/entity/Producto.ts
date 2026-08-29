import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Categoria } from "./Categoria";

@Entity({ name: "productos" })
export class Producto {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 150, nullable: false })
    nombre!: string;

    // enum => la DB solo acepta estos dos valores
    @Column({ type: 'enum', enum: ['producto', 'servicio'], default: 'producto' })
    tipo!: 'producto' | 'servicio';

    @Column({ type: 'varchar', length: 100, nullable: false })
    presentacion!: string;

    // Muchos productos pertenecen a UNA categoria (lado hijo de la relación)
    @ManyToOne(() => Categoria)
    @JoinColumn({ name: 'categoria_id' })
    categoria!: Categoria;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}