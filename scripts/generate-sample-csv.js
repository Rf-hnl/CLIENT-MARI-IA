/**
 * SCRIPT - GENERAR CSV DE MUESTRA
 * 
 * Genera un archivo CSV de muestra basado en el formato del CRM analizado
 * Útil para testing y demostración del sistema de importación
 */

const fs = require('fs');
const path = require('path');

// Datos de ejemplo basados en el CSV original
const sampleData = {
  etapas: [
    'Nuevos Leads / Pendientes',
    'Leads Potenciales / Prioritario', 
    'Calificado - En seguimiento',
    'En seguimiento / Sin respuesta',
    'Negociación / En ajustes',
    'Cotización enviada / Campañas anteriores',
    'Cotizaciones / Campaña Actual Jun - Jul',
    'A futuro / En pausa',
    'Ganado / Cerrado',
    'Propuesta declinada',
    'Leads descartados / No calificados'
  ],
  
  prioridades: ['Muy alta', 'Alta', 'Medio', 'Baja'],
  
  empresas: [
    'Tech Solutions Panama',
    'Digital Marketing Pro',
    'Innovate Business Hub',
    'Smart Analytics Corp',
    'Cloud Services Plus',
    'Data Insights Panama',
    'NextGen Software',
    'Business Intelligence Co',
    'Digital Transform SA',
    'Cyber Security Solutions',
    'E-Commerce Masters',
    'Software Development Inc',
    'IT Consulting Group',
    'Digital Strategy Lab',
    'Innovation Hub Panama'
  ],
  
  personas: [
    'María González Ruiz',
    'Carlos Alberto Mendoza',
    'Ana Patricia Torres',
    'José Luis Hernández',
    'Carmen Elena Vargas',
    'Roberto Antonio Silva',
    'Luz Marina Castro',
    'Fernando José Morales',
    'Patricia Isabel Ramos',
    'Miguel Ángel Delgado',
    'Sofía Carolina Jiménez',
    'Andrés Felipe Rojas',
    'Claudia Marcela López',
    'Daniel Eduardo Santos',
    'Gabriela Alejandra Cruz'
  ],
  
  actividades: [
    'Llamada de seguimiento programada',
    'Envío de propuesta comercial',
    'Reunión virtual agendada',
    'Demostración del producto',
    'Seguimiento a cotización',
    'Llamada en frío inicial',
    'Análisis de requerimientos',
    'Presentación de solución',
    'Negociación de contrato',
    'Cierre de venta'
  ],
  
  emails: [
    'ventas@techsolutions.pa',
    'contacto@digitalpro.com',
    'info@innovatehub.pa',
    'sales@smartanalytics.co',
    'comercial@cloudplus.pa'
  ]
};

// Función para generar un valor aleatorio de un array
const randomFromArray = (array) => array[Math.floor(Math.random() * array.length)];

// Función para generar probabilidad basada en etapa
const generateProbability = (etapa) => {
  const probabilityRanges = {
    'Nuevos Leads / Pendientes': [1, 25],
    'Leads Potenciales / Prioritario': [25, 50],
    'Calificado - En seguimiento': [50, 70],
    'En seguimiento / Sin respuesta': [20, 45],
    'Negociación / En ajustes': [60, 85],
    'Cotización enviada / Campañas anteriores': [70, 85],
    'Cotizaciones / Campaña Actual Jun - Jul': [50, 99],
    'A futuro / En pausa': [40, 70],
    'Ganado / Cerrado': [100, 100],
    'Propuesta declinada': [0, 30],
    'Leads descartados / No calificados': [0, 20]
  };
  
  const range = probabilityRanges[etapa] || [1, 50];
  const probability = Math.random() * (range[1] - range[0]) + range[0];
  return probability.toFixed(2);
};

// Función para generar ingresos esperados
const generateRevenue = (etapa) => {
  if (etapa === 'Leads descartados / No calificados' || etapa === 'Nuevos Leads / Pendientes') {
    return '0.00';
  }
  
  const baseAmount = Math.random() * 5000 + 500; // Entre 500 y 5500
  return baseAmount.toFixed(2);
};

// Función para generar un lead de muestra
const generateSampleLead = () => {
  const etapa = randomFromArray(sampleData.etapas);
  const isCompany = Math.random() > 0.6; // 60% chance de ser empresa
  const oportunidad = isCompany ? randomFromArray(sampleData.empresas) : randomFromArray(sampleData.personas);
  const prioridad = randomFromArray(sampleData.prioridades);
  const probabilidad = generateProbability(etapa);
  const ingresos = generateRevenue(etapa);
  const actividad = randomFromArray(sampleData.actividades);
  const comercial = randomFromArray(sampleData.emails);
  
  return {
    'Etapa': etapa,
    'Probabilidad': probabilidad,
    'Activo': 'VERDADERO',
    'Moneda': 'PAB',
    'MMR esperado': '0.00',
    'Equipo de ventas': 'Ventas',
    'Ganado/Perdido': etapa === 'Ganado / Cerrado' ? 'Ganado' : 'Pendiente',
    'Índice de Colores': '0',
    'Oportunidad': oportunidad,
    'Ingresos esperados': ingresos,
    'Cliente': isCompany ? oportunidad : '',
    'Etiquetas': Math.random() > 0.7 ? 'prospecto,interesado' : '',
    'Propiedades': Math.random() > 0.8 ? 'Contacto vía LinkedIn' : '',
    'Prioridad': prioridad,
    'Actividades': Math.random() > 0.5 ? actividad : '',
    'Decoración de Actividad de Excepción': '',
    'Icono': '',
    'Estado de la actividad': Math.random() > 0.6 ? 'Planificado' : '',
    'Resumen de la siguiente actividad': Math.random() > 0.5 ? actividad : '',
    'Icono de tipo de actvidad': Math.random() > 0.7 ? 'fa-check' : '',
    'Tipo de la siguiente actividad': Math.random() > 0.6 ? 'Actividades pendientes' : '',
    'Comercial': comercial,
    'Propiedad 1': ''
  };
};

// Función para generar CSV
const generateCSV = (numLeads = 50) => {
  const leads = [];
  
  // Headers
  const headers = [
    'Etapa', 'Probabilidad', 'Activo', 'Moneda', 'MMR esperado', 
    'Equipo de ventas', 'Ganado/Perdido', 'Índice de Colores', 'Oportunidad', 
    'Ingresos esperados', 'Cliente', 'Etiquetas', 'Propiedades', 'Prioridad', 
    'Actividades', 'Decoración de Actividad de Excepción', 'Icono', 
    'Estado de la actividad', 'Resumen de la siguiente actividad', 
    'Icono de tipo de actvidad', 'Tipo de la siguiente actividad', 'Comercial', 'Propiedad 1'
  ];
  
  // Generar leads
  for (let i = 0; i < numLeads; i++) {
    leads.push(generateSampleLead());
  }
  
  // Convertir a CSV
  let csvContent = headers.join(';') + '\n';
  
  leads.forEach(lead => {
    const row = headers.map(header => {
      const value = lead[header] || '';
      // Escapar punto y coma si existe en el valor
      return value.toString().replace(/;/g, ',');
    });
    csvContent += row.join(';') + '\n';
  });
  
  return csvContent;
};

// Generar y guardar archivo CSV
const main = () => {
  const numLeads = process.argv[2] ? parseInt(process.argv[2]) : 50;
  const outputPath = process.argv[3] || path.join(__dirname, '..', 'data', 'sample-leads.csv');
  
  console.log(`🔄 Generando ${numLeads} leads de muestra...`);
  
  const csvContent = generateCSV(numLeads);
  
  // Crear directorio si no existe
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Escribir archivo
  fs.writeFileSync(outputPath, csvContent, 'utf8');
  
  console.log(`✅ Archivo CSV generado: ${outputPath}`);
  console.log(`📊 Total de leads: ${numLeads}`);
  
  // Mostrar estadísticas
  const lines = csvContent.split('\n');
  const dataLines = lines.slice(1, -1); // Excluir header y línea vacía final
  
  const stats = {
    etapas: {},
    prioridades: {}
  };
  
  dataLines.forEach(line => {
    const columns = line.split(';');
    const etapa = columns[0];
    const prioridad = columns[13];
    
    stats.etapas[etapa] = (stats.etapas[etapa] || 0) + 1;
    stats.prioridades[prioridad] = (stats.prioridades[prioridad] || 0) + 1;
  });
  
  console.log('\n📈 Distribución por etapa:');
  Object.entries(stats.etapas).forEach(([etapa, count]) => {
    console.log(`  ${etapa}: ${count}`);
  });
  
  console.log('\n🎯 Distribución por prioridad:');
  Object.entries(stats.prioridades).forEach(([prioridad, count]) => {
    console.log(`  ${prioridad}: ${count}`);
  });
  
  console.log(`\n💡 Para importar este archivo, usa el botón "Importar CSV" en la interfaz de leads.`);
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { generateCSV, generateSampleLead };