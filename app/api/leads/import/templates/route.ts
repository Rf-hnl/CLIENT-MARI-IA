/**
 * IMPORT TEMPLATES API ENDPOINT
 * 
 * Provides downloadable templates for all supported import formats
 * GET /api/leads/import/templates?format=csv|xlsx|json|xml
 */

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { isFeatureEnabled } from '@/lib/feature-flags';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') as 'csv' | 'xlsx' | 'json' | 'xml' || 'csv';

  // Check feature flag for non-CSV formats
  if (format !== 'csv' && !isFeatureEnabled('IMPORT_CSV_XML_JSON_XLSX')) {
    return NextResponse.json(
      { error: 'Multi-format import feature is not enabled' },
      { status: 403 }
    );
  }

  // Sample data for all templates
  const sampleData = [
    {
      name: 'Juan Pérez',
      phone: '+507-6000-1234',
      email: 'juan.perez@email.com',
      company: 'Restaurant Los Arcos',
      status: 'new',
      priority: 'high',
      source: 'website',
      position: 'Propietario',
      notes: 'Interesado en sistema de punto de venta',
      qualification_score: '75'
    },
    {
      name: 'María González',
      phone: '+507-6000-5678',
      email: 'maria@clinicasalud.com',
      company: 'Clínica Dental Salud',
      status: 'qualified',
      priority: 'high',
      source: 'referral',
      position: 'Doctora',
      notes: 'Necesita integración con software médico',
      qualification_score: '90'
    },
    {
      name: 'Carlos Mendoza',
      phone: '+507-6000-9012',
      email: 'carlos@supercentral.com',
      company: 'Supermercado Central',
      status: 'follow_up',
      priority: 'medium',
      source: 'cold_call',
      position: 'Gerente General',
      notes: 'Evaluando múltiples proveedores',
      qualification_score: '60'
    },
    {
      name: 'Ana Torres',
      phone: '+507-6000-7890',
      email: 'ana@hotelvistamar.com',
      company: 'Hotel Vista Mar',
      status: 'negotiation',
      priority: 'urgent',
      source: 'advertisement',
      position: 'Directora de Operaciones',
      notes: 'Cadena de 3 hoteles - proyecto grande',
      qualification_score: '95'
    },
    {
      name: 'Roberto Silva',
      phone: '+507-6000-3456',
      email: 'roberto@tallerexpress.com',
      company: 'Taller Mecánico Express',
      status: 'nurturing',
      priority: 'low',
      source: 'social_media',
      position: 'Propietario',
      notes: 'Pequeño negocio familiar - presupuesto limitado',
      qualification_score: '40'
    }
  ];

  try {
    switch (format) {
      case 'csv':
        return generateCSVTemplate(sampleData);
      
      case 'xlsx':
        return generateXLSXTemplate(sampleData);
      
      case 'json':
        return generateJSONTemplate(sampleData);
      
      case 'xml':
        return generateXMLTemplate(sampleData);
      
      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use: csv, xlsx, json, xml' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV template
 */
function generateCSVTemplate(data: any[]): NextResponse {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads_import_template.csv"',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Generate XLSX template
 */
function generateXLSXTemplate(data: any[]): NextResponse {
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Main data sheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add some styling and column widths
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const columnWidths = [
    { wpx: 150 }, // name
    { wpx: 120 }, // phone
    { wpx: 200 }, // email
    { wpx: 180 }, // company
    { wpx: 100 }, // status
    { wpx: 80 },  // priority
    { wpx: 100 }, // source
    { wpx: 120 }, // position
    { wpx: 300 }, // notes
    { wpx: 80 }   // qualification_score
  ];
  
  worksheet['!cols'] = columnWidths;
  
  // Add header row styling
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E3F2FD" } }
      };
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Data");
  
  // Add a documentation sheet
  const docData = [
    { Field: 'name', Required: 'Yes', Description: 'Full name of the lead or company name', Examples: 'Juan Pérez, Restaurant Los Arcos' },
    { Field: 'phone', Required: 'Yes*', Description: 'Contact phone number', Examples: '+507-6000-1234, 555-0123' },
    { Field: 'email', Required: 'Yes*', Description: 'Email address', Examples: 'juan@email.com' },
    { Field: 'company', Required: 'No', Description: 'Company or organization name', Examples: 'Tech Solutions Inc.' },
    { Field: 'status', Required: 'No', Description: 'Lead status', Examples: 'new, qualified, follow_up, won, lost' },
    { Field: 'priority', Required: 'No', Description: 'Priority level', Examples: 'low, medium, high, urgent' },
    { Field: 'source', Required: 'No', Description: 'Lead source/origin', Examples: 'website, social_media, referral, cold_call' },
    { Field: 'position', Required: 'No', Description: 'Job title or position', Examples: 'CEO, Manager, Owner' },
    { Field: 'notes', Required: 'No', Description: 'Additional information', Examples: 'Interested in premium services' },
    { Field: 'qualification_score', Required: 'No', Description: 'Lead score (0-100)', Examples: '75, 90, 45' }
  ];
  
  const docSheet = XLSX.utils.json_to_sheet(docData);
  docSheet['!cols'] = [
    { wpx: 120 }, // Field
    { wpx: 80 },  // Required
    { wpx: 250 }, // Description
    { wpx: 200 }  // Examples
  ];
  
  XLSX.utils.book_append_sheet(workbook, docSheet, "Field Documentation");
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="leads_import_template.xlsx"',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Generate JSON template
 */
function generateJSONTemplate(data: any[]): NextResponse {
  const template = {
    metadata: {
      version: "1.0",
      format: "leads_import",
      description: "Lead import template for multi-format import system",
      required_fields: ["name", "phone_or_email"],
      optional_fields: ["email", "company", "status", "priority", "source", "position", "notes", "qualification_score"],
      field_descriptions: {
        name: "Full name of the lead or company name",
        phone: "Contact phone number (required if no email)",
        email: "Email address (required if no phone)",
        company: "Company or organization name",
        status: "Lead status: new, qualified, follow_up, won, lost, etc.",
        priority: "Priority level: low, medium, high, urgent",
        source: "Lead source: website, social_media, referral, cold_call, etc.",
        position: "Job title or position in company",
        notes: "Additional information or comments",
        qualification_score: "Lead qualification score (0-100)"
      }
    },
    leads: data
  };

  const jsonContent = JSON.stringify(template, null, 2);

  return new NextResponse(jsonContent, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads_import_template.json"',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Generate XML template
 */
function generateXMLTemplate(data: any[]): NextResponse {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Lead Import Template for Multi-Format Import System -->
<!-- 
  Required Fields: name, phone OR email
  Optional Fields: company, status, priority, source, position, notes, qualification_score
  
  Field Descriptions:
  - name: Full name of the lead or company name
  - phone: Contact phone number (required if no email)
  - email: Email address (required if no phone)  
  - company: Company or organization name
  - status: Lead status (new, qualified, follow_up, won, lost, etc.)
  - priority: Priority level (low, medium, high, urgent)
  - source: Lead source (website, social_media, referral, cold_call, etc.)
  - position: Job title or position in company
  - notes: Additional information or comments
  - qualification_score: Lead qualification score (0-100)
-->
<leads_import version="1.0">
  <metadata>
    <format>leads_import</format>
    <description>Lead import template for multi-format import system</description>
    <required_fields>name, phone_or_email</required_fields>
  </metadata>
  
  <leads>
${data.map(lead => `    <lead>
      <name>${escapeXml(lead.name)}</name>
      <phone>${escapeXml(lead.phone)}</phone>
      <email>${escapeXml(lead.email)}</email>
      <company>${escapeXml(lead.company)}</company>
      <status>${escapeXml(lead.status)}</status>
      <priority>${escapeXml(lead.priority)}</priority>
      <source>${escapeXml(lead.source)}</source>
      <position>${escapeXml(lead.position)}</position>
      <notes>${escapeXml(lead.notes)}</notes>
      <qualification_score>${escapeXml(lead.qualification_score)}</qualification_score>
    </lead>`).join('\n')}
  </leads>
</leads_import>`;

  return new NextResponse(xmlContent, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads_import_template.xml"',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}