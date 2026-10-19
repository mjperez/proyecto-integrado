import Link from "next/link";

export function Pie() {
  return (
    <footer className="mt-auto bg-pac-azul text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center bg-white font-slab text-[12px] font-bold leading-none text-pac-azul">
                PAC
              </span>
              <div>
                <p className="text-[9px] font-medium uppercase leading-none tracking-[0.18em] text-white/55">
                  Municipalidad de
                </p>
                <p className="mt-1 font-slab text-[14px] font-bold leading-none">
                  Pedro Aguirre Cerda
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/70">
              Observatorio Comunal de Precios. Relevamiento de precios de
              alimentos y productos básicos en almacenes, ferias y comercios de
              la comuna.
            </p>
          </div>

          <div>
            <p className="micro mb-3 text-white/45">Consultar</p>
            <ul className="flex flex-col gap-2 text-[13px]">
              <li>
                <Link href="/mapa" className="text-white/80 hover:text-white">
                  Mapa de comercios
                </Link>
              </li>
              <li>
                <Link href="/comparador" className="text-white/80 hover:text-white">
                  Comparador de precios
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-white/80 hover:text-white">
                  Acceso funcionario
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="micro mb-3 text-white/45">Contacto</p>
            <ul className="flex flex-col gap-2 text-[13px] text-white/70">
              <li>Av. P. Salvador Allende G. 2029</li>
              <li>Pedro Aguirre Cerda, Santiago</li>
              <li>contacto@pedroaguirrecerda.cl</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-5">
          <p className="text-[11px] text-white/50">
            Proyecto académico TIHI43 · INACAP 2026
          </p>
          <p className="text-[11px] text-white/50">
            Precios referenciales, relevados en terreno y actualizados
            semanalmente.
          </p>
        </div>
      </div>
    </footer>
  );
}
