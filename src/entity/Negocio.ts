import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, UpdateDateColumn } from "typeorm";

@Entity({ name: "negocios" })
    export class Negocio{
        @PrimaryGeneratedColumn()
        id: number;
        @Column({ type: 'varchar', length: 12, nullable: false, unique: true })
        rut: string;
        @Column({ type: 'varchar', length: 150, nullable: false })
        nombre: string;
        @Column({ type: 'varchar', length: 255, nullable: true })
        descripcion: string;
        @Column({ type: 'varchar', length: 255, nullable: false })
        direccion: string;
        @Column({ type: 'varchar', length: 20, nullable: true })
        telefono: string;
        @Column({ type: 'varchar', length: 150, nullable: true })
        email: string;
        @Index()
        @Column({type: 'varchar', length: 100, nullable: false})
        rubro: string;
        @Index()
        @Column({ type: 'boolean', default: true})
        activo: boolean;
        @CreateDateColumn({ name: 'created_at' })
        createdAt: Date;
        @UpdateDateColumn({ name: 'updated_at'})
        updatedAt: Date;
    }
