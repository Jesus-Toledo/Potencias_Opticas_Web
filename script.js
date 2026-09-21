// =====================================================
// REGISTRO DEL PLUGIN DE ETIQUETAS
// =====================================================

Chart.register(ChartDataLabels);


// =====================================================
// OBTENER LA REGIÓN DESDE LA URL
// Ejemplo: ?region=occidente
// =====================================================

const parametros = new URLSearchParams(window.location.search);
const region = parametros.get("region") || "occidente";


// =====================================================
// VARIABLES GENERALES
// =====================================================

let datosOriginales = null;
let incidentesOriginales = [];

let graficaBarras = null;
let graficaPastel = null;

// Incidentes disponibles antes de seleccionar una ciudad.
// Puede contener todos los incidentes o los filtrados por un KPI.
let incidentesBaseActual = [];

// Guarda la ciudad seleccionada actualmente.
let ciudadSeleccionada = null;

// Categoría seleccionada en la gráfica de dona.
let categoriaSeleccionada = null;


// =====================================================
// CARGAR EL JSON DE LA REGIÓN
// =====================================================

fetch(`datos/${region}.json`)
    .then((response) => {
        if (!response.ok) {
            throw new Error(`No se encontró el archivo de la región: ${region}`);
        }

        return response.json();
    })
    .then((datos) => {
        datosOriginales = datos;
        incidentesOriginales = [...datos.tablaDetalle];
        incidentesBaseActual = [...datos.tablaDetalle];

        mostrarDatosGenerales(datos);
        mostrarVistaOriginal(datos);
        configurarInteracciones();
    })
    .catch((error) => {
        console.error("Error al cargar el dashboard:", error);

        document.body.innerHTML = `
            <div style="
                margin: 30px;
                padding: 20px;
                background: white;
                border-left: 5px solid #ff6b00;
                font-family: Arial, sans-serif;
            ">
                <h2 style="color: #003f88;">
                    No fue posible cargar el dashboard
                </h2>

                <p>
                    Verifica que exista el archivo:
                    <strong>datos/${region}.json</strong>
                </p>
            </div>
        `;
    });


// =====================================================
// MOSTRAR REGIÓN Y FECHA DE ACTUALIZACIÓN
// =====================================================

function mostrarDatosGenerales(datos) {
    document.getElementById("region").textContent =
        datos.region;

    document.getElementById("ultimaActualizacion").textContent =
        datos.ultimaActualizacion;
}


// =====================================================
// MOSTRAR LA VISTA ORIGINAL DEL JSON
// =====================================================

function mostrarVistaOriginal(datos) {
    actualizarKpisOriginales(datos);
    actualizarTablaResumen(datos.tablaResumen);
    actualizarTablaDetalle(datos.tablaDetalle);

    crearOActualizarGraficaBarras(
        datos.graficaCiudades.labels,
        datos.graficaCiudades.valores
    );

    crearOActualizarGraficaPastel(
        datos.graficaCategorias.labels,
        datos.graficaCategorias.valores
    );
}


// =====================================================
// KPIS ORIGINALES PROVENIENTES DEL JSON
// =====================================================

function actualizarKpisOriginales(datos) {
    document.getElementById("totalIncidentes").textContent =
        datos.kpisSuperiores.totalIncidentes;

    document.getElementById("ultimaSemana").textContent =
        datos.kpisSuperiores.ultimaSemana;

    document.getElementById("unoATresMeses").textContent =
        datos.kpisSuperiores.unoATresMeses;

    document.getElementById("mayorTresMeses").textContent =
        datos.kpisSuperiores.mayorTresMeses;

    document.getElementById("mayorUnAno").textContent =
        datos.kpisSuperiores.mayorUnAno;

    document.getElementById("acceso").textContent =
        datos.kpisInferiores.acceso;

    document.getElementById("core").textContent =
        datos.kpisInferiores.core;

    document.getElementById("facilities").textContent =
        datos.kpisInferiores.facilities;

    document.getElementById("limpieza").textContent =
        datos.kpisInferiores.limpieza;
}


// =====================================================
// CONFIGURAR INTERACCIONES DE LOS KPIS SUPERIORES
// =====================================================

function configurarInteracciones() {
    const filtrosKpi = [
        {
            id: "filtroUltimaSemana",
            condicion: (incidente) => {
                const dias = Number(incidente.dias);
                return dias >= 0 && dias <= 7;
            }
        },
        {
            id: "filtroUnoATresMeses",
            condicion: (incidente) => {
                const dias = Number(incidente.dias);
                return dias > 7 && dias <= 90;
            }
        },
        {
            id: "filtroMayorTresMeses",
            condicion: (incidente) => {
                const dias = Number(incidente.dias);
                return dias > 90 && dias <= 365;
            }
        },
        {
            id: "filtroMayorUnAno",
            condicion: (incidente) => {
                const dias = Number(incidente.dias);
                return dias > 365;
            }
        }
    ];

    // =====================================================
    // CONFIGURAR INTERACCIONES DE LOS KPIS INFERIORES
    // =====================================================

    const filtrosCapa = [
        {
            id: "filtroAcceso",
            capas: ["ACCESO"]
        },
        {
            id: "filtroCore",
            capas: ["CORE"]
        },
        {
            id: "filtroFacilities",
            capas: ["FACILITY", "FACILITIES"]
        },
        {
            id: "filtroLimpieza",
            capas: ["LIMPIEZA DE RED"]
        }
    ];

    filtrosCapa.forEach((filtro) => {
        const tarjeta = document.getElementById(filtro.id);

        if (!tarjeta) {
            console.warn(`No se encontró la tarjeta: ${filtro.id}`);
            return;
        }

        tarjeta.addEventListener("click", () => {
            // Segundo clic en la misma tarjeta restaura todo
            if (tarjeta.classList.contains("activa")) {
                limpiarFiltros();
                return;
            }

            activarTarjeta(tarjeta);

            const incidentesFiltrados =
                incidentesOriginales.filter((incidente) => {
                    const capa = String(incidente.capa || "")
                        .trim()
                        .toUpperCase();

                    return filtro.capas.includes(capa);
                });

            // =====================================================
            // ACTUALIZAR TODO EL DASHBOARD CON INCIDENTES FILTRADOS
            //
            // conservarBase = false:
            // El filtro proviene de una tarjeta KPI y se convierte
            // en la nueva base para posibles filtros por ciudad.
            //
            // conservarBase = true:
            // El filtro proviene de una ciudad y conserva el filtro
            // anterior aplicado mediante una tarjeta.
            // =====================================================

            function actualizarDashboardFiltrado(
                incidentes,
                conservarBase = false
            ) {
                if (!conservarBase) {
                    incidentesBaseActual = [...incidentes];

                    ciudadSeleccionada = null;
                    categoriaSeleccionada = null;
                }

                const kpis = calcularKpis(incidentes);
                const resumenCiudades =
                    calcularResumenCiudades(incidentes);

                const resumenCategorias =
                    calcularResumenCategorias(incidentes);

                actualizarKpisFiltrados(kpis);
                actualizarTablaResumen(resumenCiudades);
                actualizarTablaDetalle(incidentes);

                crearOActualizarGraficaBarras(
                    resumenCiudades.map((fila) => fila.ciudad),
                    resumenCiudades.map(
                        (fila) => fila.ticketsTotales
                    )
                );

                crearOActualizarGraficaPastel(
                    resumenCategorias.labels,
                    resumenCategorias.valores
                );
            }
        });
    });


    // Configura los cuatro KPI de antigüedad
    filtrosKpi.forEach((filtro) => {
        const tarjeta = document.getElementById(filtro.id);

        if (!tarjeta) {
            console.warn(`No se encontró la tarjeta: ${filtro.id}`);
            return;
        }

        tarjeta.addEventListener("click", () => {
            // Si se selecciona nuevamente, se quita el filtro
            if (tarjeta.classList.contains("activa")) {
                limpiarFiltros();
                return;
            }

            activarTarjeta(tarjeta);

            const incidentesFiltrados =
                incidentesOriginales.filter(filtro.condicion);

            actualizarDashboardFiltrado(incidentesFiltrados);
        });
    });

    // Total de incidentes restaura toda la información
    const tarjetaTotal =
        document.getElementById("filtroTotalIncidentes");

    if (tarjetaTotal) {
        tarjetaTotal.addEventListener("click", () => {
            limpiarFiltros();
        });
    }

    // El botón se conserva como alternativa
    const botonLimpiar =
        document.getElementById("limpiarFiltros");

    if (botonLimpiar) {
        botonLimpiar.addEventListener(
            "click",
            limpiarFiltros
        );
    }
}


// =====================================================
// ACTIVAR VISUALMENTE UNA TARJETA
// =====================================================

function activarTarjeta(tarjetaSeleccionada) {
    document
        .querySelectorAll(".card-filtrable")
        .forEach((tarjeta) => {
            tarjeta.classList.remove("activa");
        });

    tarjetaSeleccionada.classList.add("activa");

    const botonLimpiar =
        document.getElementById("limpiarFiltros");

    if (botonLimpiar) {
        botonLimpiar.hidden = false;
    }
}


// =====================================================
// LIMPIAR TODOS LOS FILTROS
// =====================================================

// =====================================================
// LIMPIAR TODOS LOS FILTROS
// =====================================================

function limpiarFiltros() {
    document
        .querySelectorAll(".card-filtrable")
        .forEach((tarjeta) => {
            tarjeta.classList.remove("activa");
        });

    const botonLimpiar =
        document.getElementById("limpiarFiltros");

    if (botonLimpiar) {
        botonLimpiar.hidden = true;
    }

    ciudadSeleccionada = null;
    categoriaSeleccionada = null;
    incidentesBaseActual = [...incidentesOriginales];

    mostrarVistaOriginal(datosOriginales);
}


// =====================================================
// ACTUALIZAR TODO EL DASHBOARD CON INCIDENTES FILTRADOS
// =====================================================

function actualizarDashboardFiltrado(incidentes) {
    const kpis = calcularKpis(incidentes);
    const resumenCiudades = calcularResumenCiudades(incidentes);
    const resumenCategorias = calcularResumenCategorias(incidentes);

    actualizarKpisFiltrados(kpis);
    actualizarTablaResumen(resumenCiudades);
    actualizarTablaDetalle(incidentes);

    crearOActualizarGraficaBarras(
        resumenCiudades.map((fila) => fila.ciudad),
        resumenCiudades.map((fila) => fila.ticketsTotales)
    );

    crearOActualizarGraficaPastel(
        resumenCategorias.labels,
        resumenCategorias.valores
    );
}


// =====================================================
// CALCULAR KPIS A PARTIR DE LOS INCIDENTES FILTRADOS
// =====================================================

function calcularKpis(incidentes) {
    return {
        totalIncidentes: incidentes.length,

        ultimaSemana: incidentes.filter(
            (incidente) =>
                Number(incidente.dias) >= 0 &&
                Number(incidente.dias) <= 7
        ).length,

        unoATresMeses: incidentes.filter(
            (incidente) =>
                Number(incidente.dias) > 7 &&
                Number(incidente.dias) <= 90
        ).length,

        mayorTresMeses: incidentes.filter(
            (incidente) =>
                Number(incidente.dias) > 90 &&
                Number(incidente.dias) <= 365
        ).length,

        mayorUnAno: incidentes.filter(
            (incidente) =>
                Number(incidente.dias) > 365
        ).length,

        acceso: contarPorCapa(incidentes, "ACCESO"),

        core: contarPorCapa(incidentes, "CORE"),

        facilities:
            contarPorCapa(incidentes, "FACILITY") +
            contarPorCapa(incidentes, "FACILITIES"),

        limpieza: contarPorCapa(
            incidentes,
            "LIMPIEZA DE RED"
        )
    };
}


// =====================================================
// CONTAR INCIDENTES POR CAPA
// =====================================================

function contarPorCapa(incidentes, capaBuscada) {
    return incidentes.filter((incidente) => {
        const capa = String(incidente.capa || "")
            .trim()
            .toUpperCase();

        return capa === capaBuscada;
    }).length;
}


// =====================================================
// MOSTRAR KPIS RECALCULADOS
// =====================================================

function actualizarKpisFiltrados(kpis) {
    document.getElementById("totalIncidentes").textContent =
        kpis.totalIncidentes;

    document.getElementById("ultimaSemana").textContent =
        kpis.ultimaSemana;

    document.getElementById("unoATresMeses").textContent =
        kpis.unoATresMeses;

    document.getElementById("mayorTresMeses").textContent =
        kpis.mayorTresMeses;

    document.getElementById("mayorUnAno").textContent =
        kpis.mayorUnAno;

    document.getElementById("acceso").textContent =
        kpis.acceso;

    document.getElementById("core").textContent =
        kpis.core;

    document.getElementById("facilities").textContent =
        kpis.facilities;

    document.getElementById("limpieza").textContent =
        kpis.limpieza;
}


// =====================================================
// CALCULAR TABLA RESUMEN POR CIUDAD
// =====================================================

function calcularResumenCiudades(incidentes) {
    const agrupacion = {};

    incidentes.forEach((incidente) => {
        const ciudad =
            incidente.ciudad || "Sin ciudad";

        const dias = Number(incidente.dias) || 0;

        if (!agrupacion[ciudad]) {
            agrupacion[ciudad] = {
                ciudad: ciudad,
                ticketsTotales: 0,
                mtta: 0,
                ultimaSemana: 0,
                unoATresMeses: 0,
                tresMesesAUnAno: 0,
                mayorUnAno: 0
            };
        }

        const fila = agrupacion[ciudad];

        fila.ticketsTotales += 1;
        fila.mtta = Math.max(fila.mtta, dias);

        if (dias >= 0 && dias <= 7) {
            fila.ultimaSemana += 1;
        } else if (dias > 7 && dias <= 90) {
            fila.unoATresMeses += 1;
        } else if (dias > 90 && dias <= 365) {
            fila.tresMesesAUnAno += 1;
        } else if (dias > 365) {
            fila.mayorUnAno += 1;
        }
    });

    return Object.values(agrupacion).sort(
        (a, b) => b.ticketsTotales - a.ticketsTotales
    );
}


// =====================================================
// CALCULAR DATOS PARA LA GRÁFICA DE DONA
// =====================================================

function calcularResumenCategorias(incidentes) {
    const categorias = {};

    incidentes.forEach((incidente) => {
        const capa = String(
            incidente.capa || "SIN CLASIFICAR"
        )
            .trim()
            .toUpperCase();

        categorias[capa] =
            (categorias[capa] || 0) + 1;
    });

    return {
        labels: Object.keys(categorias),
        valores: Object.values(categorias)
    };
}


// =====================================================
// ACTUALIZAR TABLA RESUMEN
// =====================================================

function actualizarTablaResumen(filas) {
    const tablaResumen =
        document.getElementById("tablaResumenBody");

    tablaResumen.innerHTML = "";

    if (filas.length === 0) {
        tablaResumen.innerHTML = `
            <tr>
                <td colspan="7">
                    No existen incidentes para el filtro seleccionado.
                </td>
            </tr>
        `;

        return;
    }

    filas.forEach((fila) => {

        tablaResumen.innerHTML += `
        <tr class="filaResumen">
            <td>${fila.ciudad}</td>
            <td>${fila.ticketsTotales}</td>
            <td>${fila.mtta}</td>
            <td>${fila.ultimaSemana}</td>
            <td>${fila.unoATresMeses}</td>
            <td>${fila.tresMesesAUnAno}</td>
            <td>${fila.mayorUnAno}</td>
        </tr>
    `;
    });

    const filasTabla =
        tablaResumen.querySelectorAll(".filaResumen");

    filasTabla.forEach((filaHtml) => {

        filaHtml.style.cursor = "pointer";

        filaHtml.addEventListener("click", () => {

            const ciudad =
                filaHtml.cells[0].textContent;

            if (
                ciudadSeleccionada &&
                normalizarTexto(ciudadSeleccionada) ===
                normalizarTexto(ciudad)
            ) {

                ciudadSeleccionada = null;

                actualizarDashboardFiltrado(
                    incidentesBaseActual,
                    true
                );

                return;
            }

            ciudadSeleccionada = ciudad;

            const incidentesCiudad =
                incidentesBaseActual.filter(
                    (incidente) =>
                        normalizarTexto(
                            incidente.ciudad
                        ) ===
                        normalizarTexto(ciudad)
                );

            actualizarDashboardFiltrado(
                incidentesCiudad,
                true
            );
        });

    });
}


// =====================================================
// ACTUALIZAR TABLA DETALLE
// =====================================================

function actualizarTablaDetalle(filas) {
    const tablaDetalle =
        document.getElementById("tablaDetalleBody");

    tablaDetalle.innerHTML = "";

    if (filas.length === 0) {
        tablaDetalle.innerHTML = `
            <tr>
                <td colspan="6">
                    No existen incidentes para el filtro seleccionado.
                </td>
            </tr>
        `;

        return;
    }

    filas.forEach((fila) => {
        tablaDetalle.innerHTML += `
            <tr>
                <td>${fila.incidentId}</td>
                <td>${fila.descripcionCorta}</td>
                <td>${fila.createdDateTime}</td>
                <td>${fila.ownedByTeam}</td>
                <td>${fila.ciudad}</td>
                <td>${fila.dias}</td>
            </tr>
        `;
    });
}


// =====================================================
// CREAR O ACTUALIZAR GRÁFICA DE BARRAS
// Incluye interacción para filtrar por ciudad
// =====================================================

function crearOActualizarGraficaBarras(labels, valores) {

    // Si la gráfica ya existe, solo actualizamos sus datos.
    if (graficaBarras) {
        graficaBarras.data.labels = labels;
        graficaBarras.data.datasets[0].data = valores;

        graficaBarras.data.datasets[0].backgroundColor =
            generarColoresAzules(labels.length);

        graficaBarras.update();
        return;
    }

    // Si la gráfica todavía no existe, la creamos.
    graficaBarras = new Chart(
        document.getElementById("graficaBarras"),
        {
            type: "bar",

            data: {
                labels: labels,

                datasets: [
                    {
                        label: "Incidentes",
                        data: valores,

                        backgroundColor:
                            generarColoresAzules(labels.length),

                        borderRadius: 4
                    }
                ]
            },

            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,

                // Cambiar el cursor al colocarlo sobre una barra.
                onHover: (evento, elementosActivos) => {
                    evento.native.target.style.cursor =
                        elementosActivos.length > 0
                            ? "pointer"
                            : "default";
                },

                // Filtrar el dashboard por la ciudad seleccionada.
                onClick: (evento, elementosActivos) => {

                    // Si no se seleccionó una barra, no hacemos nada.
                    if (elementosActivos.length === 0) {
                        return;
                    }

                    const indice =
                        elementosActivos[0].index;

                    const ciudad =
                        graficaBarras.data.labels[indice];

                    // Si se vuelve a seleccionar la misma ciudad,
                    // restauramos el filtro anterior.
                    if (ciudadSeleccionada === ciudad) {
                        ciudadSeleccionada = null;

                        actualizarDashboardFiltrado(
                            incidentesBaseActual,
                            true
                        );

                        return;
                    }

                    // Guardamos la ciudad seleccionada.
                    ciudadSeleccionada = ciudad;

                    // Filtramos los incidentes de la ciudad.
                    const incidentesCiudad =
                        incidentesBaseActual.filter(
                            (incidente) =>
                                normalizarTexto(incidente.ciudad) ===
                                normalizarTexto(ciudad)
                        );

                    // Actualizamos todo el dashboard.
                    actualizarDashboardFiltrado(
                        incidentesCiudad,
                        true
                    );
                },

                plugins: {
                    datalabels: {
                        anchor: "end",
                        align: "right",
                        color: "#003f88",

                        font: {
                            weight: "bold",
                            size: 12
                        }
                    },

                    legend: {
                        display: false
                    },

                    title: {
                        display: true,
                        text: "Incidentes por Ciudad"
                    }
                },

                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        }
    );
}

// =====================================================
// COLORES PARA LA GRÁFICA DE PASTEL
// =====================================================



function crearOActualizarGraficaPastel(labels, valores) {

    if (graficaPastel) {
        graficaPastel.data.labels = labels;
        graficaPastel.data.datasets[0].data = valores;

        graficaPastel.data.datasets[0].backgroundColor =
            generarColoresCategorias(labels.length);

        graficaPastel.update();
        return;
    }

    graficaPastel = new Chart(
        document.getElementById("graficaPastel"),
        {
            type: "doughnut",

            data: {
                labels: labels,

                datasets: [
                    {
                        data: valores,

                        backgroundColor:
                            generarColoresCategorias(labels.length),

                        borderWidth: 2,
                        hoverOffset: 8
                    }
                ]
            },

            options: {
                responsive: true,

                onHover: (evento, elementosActivos) => {

                    evento.native.target.style.cursor =
                        elementosActivos.length > 0
                            ? "pointer"
                            : "default";
                },

                onClick: (evento, elementosActivos) => {

                    if (elementosActivos.length === 0) {
                        return;
                    }

                    const indice =
                        elementosActivos[0].index;

                    const categoria =
                        graficaPastel.data.labels[indice];

                    if (
                        categoriaSeleccionada &&
                        normalizarTexto(categoriaSeleccionada) ===
                        normalizarTexto(categoria)
                    ) {

                        categoriaSeleccionada = null;

                        actualizarDashboardFiltrado(
                            incidentesBaseActual,
                            true
                        );

                        return;
                    }

                    categoriaSeleccionada = categoria;

                    const incidentesCategoria =
                        incidentesBaseActual.filter(
                            (incidente) =>
                                categoriasCoinciden(
                                    incidente.capa,
                                    categoria
                                )
                        );

                    actualizarDashboardFiltrado(
                        incidentesCategoria,
                        true
                    );
                },

                plugins: {

                    datalabels: {

                        color: "#ffffff",

                        font: {
                            weight: "bold",
                            size: 14
                        },

                        formatter: function (
                            value,
                            context
                        ) {

                            const total =
                                context.dataset.data.reduce(
                                    (a, b) => a + b,
                                    0
                                );

                            if (total === 0) {
                                return "0%";
                            }

                            const porcentaje =
                                Math.round(
                                    (value / total) * 100
                                );

                            return `${porcentaje}%`;
                        }
                    },

                    title: {
                        display: true,
                        text: "Clasificación de Incidentes"
                    },

                    legend: {
                        position: "bottom"
                    }
                },

                cutout: "65%"
            }
        }
    );
}
// =====================================================
// COLORES PARA LA GRÁFICA DE BARRAS
// =====================================================

function generarColoresAzules(cantidad) {
    const colores = [
        "#003f88",
        "#0056b3",
        "#1c7ed6",
        "#4dabf7",
        "#74c0fc",
        "#1864ab",
        "#228be6",
        "#339af0",
        "#66b3ff"
    ];

    return Array.from(
        { length: cantidad },
        (_, indice) => colores[indice % colores.length]
    );
}


// =====================================================
// COLORES PARA LA GRÁFICA DE DONA
// =====================================================

function generarColoresCategorias(cantidad) {
    const colores = [
        "#003f88",
        "#ff6b00",
        "#1c7ed6",
        "#74c0fc",
        "#ffd43b",
        "#2f9e44"
    ];

    return Array.from(
        { length: cantidad },
        (_, indice) => colores[indice % colores.length]
    );
}

// =====================================================
// NORMALIZAR TEXTO PARA REALIZAR COMPARACIONES
//
// Permite que "Córdoba" y "cordoba" coincidan.
// =====================================================

function normalizarTexto(texto) {
    return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


// =====================================================
2
// COMPARAR CATEGORÍAS DE LA DONA
3
//
4
// Permite considerar equivalentes:
5
//
6
// FACILITY = FACILITIES
7
// LIMPIEZA = LIMPIEZA DE RED
8
// =====================================================

function categoriasCoinciden(
    capaIncidente,
    categoriaGrafica
) {

    const capa =
        normalizarTexto(capaIncidente);

    const categoria =
        normalizarTexto(categoriaGrafica);

    if (
        categoria === "facility" ||
        categoria === "facilities"
    ) {

        return (
            capa === "facility" ||
            capa === "facilities"
        );
    }

    if (
        categoria === "limpieza" ||
        categoria === "limpieza de red"
    ) {

        return (
            capa === "limpieza" ||
            capa === "limpieza de red"
        );
    }

    return capa === categoria;
}