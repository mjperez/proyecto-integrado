


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."productos_tipo_enum" AS ENUM (
    'producto',
    'servicio'
);


ALTER TYPE "public"."productos_tipo_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_auditar_precio"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  v_id_anterior   int;
  v_hash_anterior char(64);
begin
  select id_registro, hash into v_id_anterior, v_hash_anterior
  from registro_auditoria order by id_registro desc limit 1;

  insert into registro_auditoria (id_usuario, tabla, accion, registro_id, hash, hash_anterior)
  values (
    (select id_usuario from usuario where auth_uid = auth.uid()),
    'precio', tg_op, new.id_precio,
    encode(digest(new.id_precio::text || new.valor::text
                  || new.fecha_registro::text || coalesce(v_hash_anterior,''), 'sha256'), 'hex'),
    v_id_anterior
  );
  return new;
end $$;


ALTER FUNCTION "public"."fn_auditar_precio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."obtener_rol"() RETURNS character varying
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select r.nombre
  from usuario u join rol r on r.id_rol = u.id_rol
  where u.auth_uid = auth.uid();
$$;


ALTER FUNCTION "public"."obtener_rol"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."alias_categoria" (
    "id_alias" integer NOT NULL,
    "alias" character varying(100) NOT NULL,
    "id_categoria" integer NOT NULL
);


ALTER TABLE "public"."alias_categoria" OWNER TO "postgres";


ALTER TABLE "public"."alias_categoria" ALTER COLUMN "id_alias" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."alias_categoria_id_alias_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."boleta" (
    "id_boleta" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_comercio" integer NOT NULL,
    "fecha" timestamp with time zone DEFAULT "now"() NOT NULL,
    "imagen_url" "text",
    "raw_ocr" "jsonb"
);


ALTER TABLE "public"."boleta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categoria" (
    "id_categoria" integer NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "descripcion" "text"
);


ALTER TABLE "public"."categoria" OWNER TO "postgres";


ALTER TABLE "public"."categoria" ALTER COLUMN "id_categoria" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."categoria_id_categoria_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categorias" (
    "id" integer NOT NULL,
    "nombre" character varying(100) NOT NULL
);


ALTER TABLE "public"."categorias" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categorias_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."categorias_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."categorias_id_seq" OWNED BY "public"."categorias"."id";



CREATE TABLE IF NOT EXISTS "public"."comercio" (
    "id_comercio" integer NOT NULL,
    "nombre" character varying(120) NOT NULL,
    "direccion" character varying(200) NOT NULL,
    "tipo" character varying(40) NOT NULL,
    "ubicacion" "public"."geography"(Point,4326) NOT NULL,
    "activo" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."comercio" OWNER TO "postgres";


ALTER TABLE "public"."comercio" ALTER COLUMN "id_comercio" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."comercio_id_comercio_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."listados" (
    "id" integer NOT NULL,
    "precio" numeric(10,2) NOT NULL,
    "stock" integer,
    "moneda" character varying(3) DEFAULT 'CLP'::character varying NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "negocio_id" integer,
    "producto_id" integer
);


ALTER TABLE "public"."listados" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."listados_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."listados_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."listados_id_seq" OWNED BY "public"."listados"."id";



CREATE TABLE IF NOT EXISTS "public"."negocios" (
    "id" integer NOT NULL,
    "rut" character varying(12) NOT NULL,
    "nombre" character varying(150) NOT NULL,
    "descripcion" character varying(255),
    "direccion" character varying(255) NOT NULL,
    "telefono" character varying(20),
    "email" character varying(150),
    "rubro" character varying(100) NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."negocios" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."negocios_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."negocios_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."negocios_id_seq" OWNED BY "public"."negocios"."id";



CREATE TABLE IF NOT EXISTS "public"."precio" (
    "id_precio" integer NOT NULL,
    "valor" numeric(10,2) NOT NULL,
    "fecha_registro" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_producto" integer NOT NULL,
    "id_comercio" integer NOT NULL,
    "id_boleta" "uuid",
    CONSTRAINT "precio_valor_check" CHECK (("valor" >= (0)::numeric))
);


ALTER TABLE "public"."precio" OWNER TO "postgres";


ALTER TABLE "public"."precio" ALTER COLUMN "id_precio" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."precio_id_precio_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."producto" (
    "id_producto" integer NOT NULL,
    "nombre" character varying(120) NOT NULL,
    "marca" character varying(80) NOT NULL,
    "formato" character varying(60) NOT NULL,
    "unidad" character varying(20) NOT NULL,
    "id_categoria" integer NOT NULL
);


ALTER TABLE "public"."producto" OWNER TO "postgres";


ALTER TABLE "public"."producto" ALTER COLUMN "id_producto" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."producto_id_producto_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."productos" (
    "id" integer NOT NULL,
    "nombre" character varying(150) NOT NULL,
    "tipo" "public"."productos_tipo_enum" DEFAULT 'producto'::"public"."productos_tipo_enum" NOT NULL,
    "presentacion" character varying(100) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "categoria_id" integer
);


ALTER TABLE "public"."productos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."productos_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."productos_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."productos_id_seq" OWNED BY "public"."productos"."id";



CREATE TABLE IF NOT EXISTS "public"."registro_auditoria" (
    "id_registro" integer NOT NULL,
    "id_usuario" "uuid",
    "tabla" character varying(40) NOT NULL,
    "accion" character varying(10) NOT NULL,
    "registro_id" integer,
    "fecha" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hash" character(64) NOT NULL,
    "hash_anterior" integer
);


ALTER TABLE "public"."registro_auditoria" OWNER TO "postgres";


ALTER TABLE "public"."registro_auditoria" ALTER COLUMN "id_registro" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."registro_auditoria_id_registro_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rol" (
    "id_rol" integer NOT NULL,
    "nombre" character varying(30) NOT NULL,
    CONSTRAINT "rol_nombre_check" CHECK ((("nombre")::"text" = ANY ((ARRAY['vecino'::character varying, 'comercio'::character varying, 'terreno'::character varying, 'administrador'::character varying])::"text"[])))
);


ALTER TABLE "public"."rol" OWNER TO "postgres";


ALTER TABLE "public"."rol" ALTER COLUMN "id_rol" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."rol_id_rol_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."usuario" (
    "id_usuario" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" character varying(120) NOT NULL,
    "email" character varying(160) NOT NULL,
    "auth_uid" "uuid",
    "fecha_registro" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_rol" integer NOT NULL
);


ALTER TABLE "public"."usuario" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_comercios_mapa" AS
 SELECT "id_comercio",
    "nombre",
    "direccion",
    "tipo",
    "activo",
    "public"."st_y"(("ubicacion")::"public"."geometry") AS "lat",
    "public"."st_x"(("ubicacion")::"public"."geometry") AS "lng"
   FROM "public"."comercio"
  WHERE ("activo" = true);


ALTER VIEW "public"."v_comercios_mapa" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_precio_actual" WITH ("security_invoker"='true') AS
 SELECT DISTINCT ON ("id_producto", "id_comercio") "id_precio",
    "id_producto",
    "id_comercio",
    "valor",
    "fecha_registro"
   FROM "public"."precio"
  ORDER BY "id_producto", "id_comercio", "fecha_registro" DESC;


ALTER VIEW "public"."v_precio_actual" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categorias" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."categorias_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."listados" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."listados_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."negocios" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."negocios_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."productos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."productos_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "PK_04f604609a0949a7f3b43400766" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."negocios"
    ADD CONSTRAINT "PK_07babc2e49895ef5292beeb4441" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "PK_3886a26251605c571c6b4f861fe" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listados"
    ADD CONSTRAINT "PK_e437da550274c7beabf01262693" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categorias"
    ADD CONSTRAINT "UQ_ccdf6cd1a34ea90a7233325063d" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."negocios"
    ADD CONSTRAINT "UQ_d9c75d43d13a80c125ea8603e15" UNIQUE ("rut");



ALTER TABLE ONLY "public"."alias_categoria"
    ADD CONSTRAINT "alias_categoria_alias_key" UNIQUE ("alias");



ALTER TABLE ONLY "public"."alias_categoria"
    ADD CONSTRAINT "alias_categoria_pkey" PRIMARY KEY ("id_alias");



ALTER TABLE ONLY "public"."boleta"
    ADD CONSTRAINT "boleta_pkey" PRIMARY KEY ("id_boleta");



ALTER TABLE ONLY "public"."categoria"
    ADD CONSTRAINT "categoria_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."categoria"
    ADD CONSTRAINT "categoria_pkey" PRIMARY KEY ("id_categoria");



ALTER TABLE ONLY "public"."comercio"
    ADD CONSTRAINT "comercio_nombre_direccion_key" UNIQUE ("nombre", "direccion");



ALTER TABLE ONLY "public"."comercio"
    ADD CONSTRAINT "comercio_pkey" PRIMARY KEY ("id_comercio");



ALTER TABLE ONLY "public"."precio"
    ADD CONSTRAINT "precio_pkey" PRIMARY KEY ("id_precio");



ALTER TABLE ONLY "public"."producto"
    ADD CONSTRAINT "producto_nombre_marca_formato_unidad_key" UNIQUE ("nombre", "marca", "formato", "unidad");



ALTER TABLE ONLY "public"."producto"
    ADD CONSTRAINT "producto_pkey" PRIMARY KEY ("id_producto");



ALTER TABLE ONLY "public"."registro_auditoria"
    ADD CONSTRAINT "registro_auditoria_pkey" PRIMARY KEY ("id_registro");



ALTER TABLE ONLY "public"."rol"
    ADD CONSTRAINT "rol_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."rol"
    ADD CONSTRAINT "rol_pkey" PRIMARY KEY ("id_rol");



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "usuario_auth_uid_key" UNIQUE ("auth_uid");



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "usuario_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario");



CREATE INDEX "IDX_6a7956a94e64bebbd918853a25" ON "public"."negocios" USING "btree" ("activo");



CREATE INDEX "IDX_7d18dd3a19bbcec7862ad76659" ON "public"."listados" USING "btree" ("producto_id", "precio");



CREATE INDEX "IDX_8a60774a093c592d23791fcbf5" ON "public"."negocios" USING "btree" ("rubro");



CREATE INDEX "idx_boleta_raw" ON "public"."boleta" USING "gin" ("raw_ocr");



CREATE INDEX "idx_comercio_ubic" ON "public"."comercio" USING "gist" ("ubicacion");



CREATE INDEX "idx_precio_fecha" ON "public"."precio" USING "btree" ("fecha_registro");



CREATE INDEX "idx_precio_prod_com" ON "public"."precio" USING "btree" ("id_producto", "id_comercio");



CREATE OR REPLACE TRIGGER "trg_auditar_precio" AFTER INSERT OR UPDATE ON "public"."precio" FOR EACH ROW EXECUTE FUNCTION "public"."fn_auditar_precio"();



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "FK_5aaee6054b643e7c778477193a3" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id");



ALTER TABLE ONLY "public"."listados"
    ADD CONSTRAINT "FK_7272eadde54964388bc20ad9ffb" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocios"("id");



ALTER TABLE ONLY "public"."listados"
    ADD CONSTRAINT "FK_9347ef4ff92da7eeedd2f8cdd59" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."alias_categoria"
    ADD CONSTRAINT "alias_categoria_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categoria"("id_categoria") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."boleta"
    ADD CONSTRAINT "boleta_id_comercio_fkey" FOREIGN KEY ("id_comercio") REFERENCES "public"."comercio"("id_comercio");



ALTER TABLE ONLY "public"."precio"
    ADD CONSTRAINT "precio_id_boleta_fkey" FOREIGN KEY ("id_boleta") REFERENCES "public"."boleta"("id_boleta");



ALTER TABLE ONLY "public"."precio"
    ADD CONSTRAINT "precio_id_comercio_fkey" FOREIGN KEY ("id_comercio") REFERENCES "public"."comercio"("id_comercio");



ALTER TABLE ONLY "public"."precio"
    ADD CONSTRAINT "precio_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto");



ALTER TABLE ONLY "public"."producto"
    ADD CONSTRAINT "producto_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categoria"("id_categoria");



ALTER TABLE ONLY "public"."registro_auditoria"
    ADD CONSTRAINT "registro_auditoria_hash_anterior_fkey" FOREIGN KEY ("hash_anterior") REFERENCES "public"."registro_auditoria"("id_registro");



ALTER TABLE ONLY "public"."registro_auditoria"
    ADD CONSTRAINT "registro_auditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario");



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "usuario_auth_uid_fkey" FOREIGN KEY ("auth_uid") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "public"."rol"("id_rol");



CREATE POLICY "admin_alias" ON "public"."alias_categoria" TO "authenticated" USING ((("public"."obtener_rol"())::"text" = 'administrador'::"text")) WITH CHECK ((("public"."obtener_rol"())::"text" = 'administrador'::"text"));



CREATE POLICY "admin_auditoria" ON "public"."registro_auditoria" FOR SELECT TO "authenticated" USING ((("public"."obtener_rol"())::"text" = 'administrador'::"text"));



CREATE POLICY "admin_boleta" ON "public"."boleta" FOR UPDATE TO "authenticated" USING ((("public"."obtener_rol"())::"text" = 'administrador'::"text"));



CREATE POLICY "admin_categoria" ON "public"."categoria" TO "authenticated" USING ((("public"."obtener_rol"())::"text" = 'administrador'::"text")) WITH CHECK ((("public"."obtener_rol"())::"text" = 'administrador'::"text"));



CREATE POLICY "admin_comercio" ON "public"."comercio" TO "authenticated" USING ((("public"."obtener_rol"())::"text" = 'administrador'::"text")) WITH CHECK ((("public"."obtener_rol"())::"text" = 'administrador'::"text"));



CREATE POLICY "admin_precio" ON "public"."precio" FOR UPDATE TO "authenticated" USING ((("public"."obtener_rol"())::"text" = 'administrador'::"text"));



CREATE POLICY "admin_producto" ON "public"."producto" TO "authenticated" USING ((("public"."obtener_rol"())::"text" = 'administrador'::"text")) WITH CHECK ((("public"."obtener_rol"())::"text" = 'administrador'::"text"));



ALTER TABLE "public"."alias_categoria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."boleta" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categoria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categorias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comercio" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "editar_perfil" ON "public"."usuario" FOR UPDATE TO "authenticated" USING (("auth_uid" = "auth"."uid"()));



CREATE POLICY "insertar_boleta" ON "public"."boleta" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "insertar_precio" ON "public"."precio" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "lectura_publica" ON "public"."alias_categoria" FOR SELECT USING (true);



CREATE POLICY "lectura_publica" ON "public"."categoria" FOR SELECT USING (true);



CREATE POLICY "lectura_publica" ON "public"."comercio" FOR SELECT USING (true);



CREATE POLICY "lectura_publica" ON "public"."precio" FOR SELECT USING (true);



CREATE POLICY "lectura_publica" ON "public"."producto" FOR SELECT USING (true);



CREATE POLICY "lectura_publica" ON "public"."rol" FOR SELECT USING (true);



ALTER TABLE "public"."listados" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."negocios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."precio" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."producto" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."productos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registro_auditoria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rol" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usuario" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ver_perfil" ON "public"."usuario" FOR SELECT TO "authenticated" USING (("auth_uid" = "auth"."uid"()));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_auditar_precio"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_auditar_precio"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_auditar_precio"() TO "service_role";



GRANT ALL ON FUNCTION "public"."obtener_rol"() TO "anon";
GRANT ALL ON FUNCTION "public"."obtener_rol"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."obtener_rol"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON TABLE "public"."alias_categoria" TO "anon";
GRANT ALL ON TABLE "public"."alias_categoria" TO "authenticated";
GRANT ALL ON TABLE "public"."alias_categoria" TO "service_role";



GRANT ALL ON SEQUENCE "public"."alias_categoria_id_alias_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."alias_categoria_id_alias_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."alias_categoria_id_alias_seq" TO "service_role";



GRANT ALL ON TABLE "public"."boleta" TO "anon";
GRANT ALL ON TABLE "public"."boleta" TO "authenticated";
GRANT ALL ON TABLE "public"."boleta" TO "service_role";



GRANT ALL ON TABLE "public"."categoria" TO "anon";
GRANT ALL ON TABLE "public"."categoria" TO "authenticated";
GRANT ALL ON TABLE "public"."categoria" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categoria_id_categoria_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categoria_id_categoria_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categoria_id_categoria_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categorias" TO "anon";
GRANT ALL ON TABLE "public"."categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."categorias" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categorias_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categorias_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categorias_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comercio" TO "anon";
GRANT ALL ON TABLE "public"."comercio" TO "authenticated";
GRANT ALL ON TABLE "public"."comercio" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comercio_id_comercio_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comercio_id_comercio_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comercio_id_comercio_seq" TO "service_role";



GRANT ALL ON TABLE "public"."listados" TO "anon";
GRANT ALL ON TABLE "public"."listados" TO "authenticated";
GRANT ALL ON TABLE "public"."listados" TO "service_role";



GRANT ALL ON SEQUENCE "public"."listados_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."listados_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."listados_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."negocios" TO "anon";
GRANT ALL ON TABLE "public"."negocios" TO "authenticated";
GRANT ALL ON TABLE "public"."negocios" TO "service_role";



GRANT ALL ON SEQUENCE "public"."negocios_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."negocios_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."negocios_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."precio" TO "anon";
GRANT ALL ON TABLE "public"."precio" TO "authenticated";
GRANT ALL ON TABLE "public"."precio" TO "service_role";



GRANT ALL ON SEQUENCE "public"."precio_id_precio_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."precio_id_precio_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."precio_id_precio_seq" TO "service_role";



GRANT ALL ON TABLE "public"."producto" TO "anon";
GRANT ALL ON TABLE "public"."producto" TO "authenticated";
GRANT ALL ON TABLE "public"."producto" TO "service_role";



GRANT ALL ON SEQUENCE "public"."producto_id_producto_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."producto_id_producto_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."producto_id_producto_seq" TO "service_role";



GRANT ALL ON TABLE "public"."productos" TO "anon";
GRANT ALL ON TABLE "public"."productos" TO "authenticated";
GRANT ALL ON TABLE "public"."productos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."productos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."productos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."productos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."registro_auditoria" TO "anon";
GRANT ALL ON TABLE "public"."registro_auditoria" TO "authenticated";
GRANT ALL ON TABLE "public"."registro_auditoria" TO "service_role";



GRANT ALL ON SEQUENCE "public"."registro_auditoria_id_registro_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."registro_auditoria_id_registro_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."registro_auditoria_id_registro_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rol" TO "anon";
GRANT ALL ON TABLE "public"."rol" TO "authenticated";
GRANT ALL ON TABLE "public"."rol" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rol_id_rol_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rol_id_rol_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rol_id_rol_seq" TO "service_role";



GRANT ALL ON TABLE "public"."usuario" TO "anon";
GRANT ALL ON TABLE "public"."usuario" TO "authenticated";
GRANT ALL ON TABLE "public"."usuario" TO "service_role";



GRANT ALL ON TABLE "public"."v_comercios_mapa" TO "anon";
GRANT ALL ON TABLE "public"."v_comercios_mapa" TO "authenticated";
GRANT ALL ON TABLE "public"."v_comercios_mapa" TO "service_role";



GRANT ALL ON TABLE "public"."v_precio_actual" TO "anon";
GRANT ALL ON TABLE "public"."v_precio_actual" TO "authenticated";
GRANT ALL ON TABLE "public"."v_precio_actual" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







