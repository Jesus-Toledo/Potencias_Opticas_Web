// =====================================================
// CARGA DE DATOS DEL DASHBOARD
// =====================================================

Chart.register(ChartDataLabels);

fetch("datos.json")
    .then(response => response.json())
    .then(datos => {


        // ==========================================
        // DATOS GENERALES
        // ==========================================

        document.getElementById("region").textContent =
            datos.region;

        document.getElementById("ultimaActualizacion").textContent =
            datos.ultimaActualizacion;


        // ==========================================
        // KPIS SUPERIORES
        // ==========================================

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


        // ==========================================
        // KPIS INFERIORES
        // ==========================================

        document.getElementById("acceso").textContent =
            datos.kpisInferiores.acceso;

        document.getElementById("core").textContent =
            datos.kpisInferiores.core;

        document.getElementById("facilities").textContent =
            datos.kpisInferiores.facilities;

        document.getElementById("limpieza").textContent =
            datos.kpisInferiores.limpieza;


        // ==========================================
        // TABLA RESUMEN
        // ==========================================

        const tablaResumen =
            document.getElementById("tablaResumenBody");

        tablaResumen.innerHTML = "";

        datos.tablaResumen.forEach(fila => {

            tablaResumen.innerHTML += `
        <tr>
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


        // ==========================================
        // TABLA DETALLE
        // ==========================================

        const tablaDetalle =
            document.getElementById("tablaDetalleBody");

        tablaDetalle.innerHTML = "";

        datos.tablaDetalle.forEach(fila => {

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


        // ==========================================
        // GRAFICA DE BARRAS
        // ==========================================

        new Chart(
            document.getElementById('graficaBarras'),
            {
                type: 'bar',

                data: {
                    labels: datos.graficaCiudades.labels,

                    datasets: [{

                        label: 'Incidentes',

                        data: datos.graficaCiudades.valores,

                        backgroundColor: [
                            '#003f88',
                            '#0056b3',
                            '#1c7ed6',
                            '#4dabf7',
                            '#74c0fc'
                        ],

                        borderRadius: 4
                    }]
                },

                options: {

                    indexAxis: 'y',

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        datalabels: {
                            anchor: 'end',
                            align: 'right',
                            color: '#003f88',
                            font: {
                                weight: 'bold',
                                size: 12
                            }
                        },

                        legend: {
                            display: false
                        },

                        title: {
                            display: true,
                            text: 'Incidentes por Ciudad'
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


        // ==========================================
        // GRAFICA DONA
        // ==========================================

        new Chart(
            document.getElementById('graficaPastel'),
            {
                type: 'doughnut',

                data: {

                    labels: datos.graficaCategorias.labels,

                    datasets: [{

                        data: datos.graficaCategorias.valores,

                        backgroundColor: [
                            '#003f88',
                            '#ff6b00'
                        ],

                        borderWidth: 2
                    }]
                },

                options: {

                    responsive: true,

                    plugins: {

                        datalabels: {

                            color: '#ffffff',

                            font: {
                                weight: 'bold',
                                size: 14
                            },

                            formatter: function (value, context) {

                                let total = context.dataset.data.reduce(
                                    (a, b) => a + b,
                                    0
                                );

                                let porcentaje =
                                    Math.round((value / total) * 100);

                                return porcentaje + "%";
                            }
                        },

                        title: {
                            display: true,
                            text: 'Clasificación de Incidentes'
                        },

                        legend: {
                            position: 'bottom'
                        }
                    },

                    cutout: '65%'
                }
            }
        );

    });