

// BARRAS

new Chart(
    document.getElementById('graficaBarras'),
    {
        type: 'bar',
        data: {
            labels: [
                'Veracruz',
                'Xalapa',
                'Poza Rica',
                'Perote',
                'Córdoba'
            ],
            datasets: [{
                label: 'Incidentes',
                data: [6, 5, 3, 2, 1],
                backgroundColor: '#1976d2'
            }]
        }
    }
);


// PASTEL

new Chart(
    document.getElementById('graficaPastel'),
    {
        type: 'pie',
        data: {
            labels: [
                'CORE',
                'ACCESO'
            ],
            datasets: [{
                data: [9, 5],
                backgroundColor: [
                    '#1565c0',
                    '#42a5f5'
                ]
            }]
        }
    }
);