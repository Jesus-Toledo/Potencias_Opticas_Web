

// BARRAS

new Chart(
    document.getElementById('graficaBarras'),
    {
        type: 'bar',

        data: {
            labels: [
                'Veracruz',
                'Xalapa',
                'Cosamaloapan',
                'Perote',
                'Poza Rica'
            ],

            datasets: [{
                label: 'Incidentes',

                data: [6, 5, 2, 1, 1],

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


// PASTEL

new Chart(
    document.getElementById('graficaPastel'),
    {
        type: 'doughnut',

        data: {

            labels: [
                'CORE',
                'ACCESO'
            ],

            datasets: [{

                data: [9, 5],

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