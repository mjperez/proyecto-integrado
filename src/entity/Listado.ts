import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, UpdateDateColumn } from "typeorm";
import { Negocio } from "./Negocio";
import { Producto } from "./Producto";

// Índice compuesto a nivel de clase: el comparador filtra por producto_id y ordena por precio.
@Index(['producto', 'precio'])
@Entity({ name: "listados" })
export class Listado {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Negocio)
    @JoinColumn({ name: 'negocio_id' })
    negocio!: Negocio;

    @ManyToOne(() => Producto)
    @JoinColumn({ name: 'producto_id' })
    producto!: Producto;

    // numeric, NUNCA float, para plata
    @Column({ type: 'numeric', precision: 10, scale: 2, nullable: false })
    precio!: number;

    // ? opcional: un servicio no tiene stock
    @Column({ type: 'int', nullable: true })
    stock!: number;

    @Column({ type: 'varchar', length: 3, default: 'CLP' })
    moneda!: string;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}