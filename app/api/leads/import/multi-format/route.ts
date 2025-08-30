/**
 * MULTI-FORMAT IMPORT API ENDPOINT
 * 
 * Enhanced import endpoint supporting CSV, XML, XLSX, and JSON formats
 * with real-time progress tracking and job management
 * POST /api/leads/import/multi-format
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';
import { 
  SupportedFormat, 
  detectFileFormat, 
  validateFileForImport 
} from '@/modules/leads/utils/formatDetection';
import { 
  MultiFormatParser, 
  NormalizedRecord 
} from '@/modules/leads/utils/multiFormatParsers';
import { 
  ProgressTracker, 
  ProgressManager 
} from '@/modules/leads/utils/progressTracking';
import { 
  EnhancedAutoMapper,
  MappingResult 
} from '@/modules/leads/utils/enhancedMapping';
import { 
  convertCSVToLead, 
  convertCSVToLeadWithMapping, 
  generateImportStats,
  ImportStats 
} from '@/modules/leads/utils/csvImporter';
import { LeadPriority, LeadSource, LeadStatus } from '@/modules/leads/types/leads';

interface MultiFormatImportRequest {
  tenantId: string;
  organizationId: string;
  fileContent: string; // Base64 encoded for binary files
  fileName: string;
  format: SupportedFormat;
  selectedSheet?: string; // For XLSX
  columnMapping?: Record<string, string>;
  hierarchicalMapping?: Record<string, string>; // For JSON/XML paths
  dryRun?: boolean;
  jobId?: string; // For resuming operations
}

interface MultiFormatImportResponse {
  success: boolean;
  jobId?: string;
  data?: {
    importedCount: number;
    skippedCount: number;
    errors: string[];
    stats: ImportStats;
    leads?: any[]; // Preview data for dry run
    autoMapping?: MappingResult;
    availableSheets?: string[]; // For XLSX
    availablePaths?: string[]; // For JSON/XML
    unmappedFields?: string[];
  };
  error?: string;
}

// PostgreSQL Lead interface (same as original)
interface IPostgreSQLLead {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  position?: string;
  qualification_score: number;
  is_qualified: boolean;
  qualification_notes?: string;
  contact_attempts: number;
  response_rate: number;
  converted_to_client: boolean;
  conversion_value?: number;
  conversion_date?: Date;
  notes?: string;
  internal_notes?: string;
  // tags field removed - not supported in current schema
  assigned_agent_name?: string;
  preferred_contact_method?: 'whatsapp' | 'phone' | 'email';
  last_contact_date?: Date;
  next_follow_up_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export async function POST(request: NextRequest): Promise<NextResponse<MultiFormatImportResponse>> {
  // Check feature flag
  if (!isFeatureEnabled('IMPORT_CSV_XML_JSON_XLSX')) {
    return NextResponse.json({
      success: false,
      error: 'Multi-format import feature is not enabled'
    }, { status: 403 });
  }

  // Apply API authentication
  const authResult = await apiAuthMiddleware(request, {
    requireAuth: true,
    requiredPermissions: ['leads:import'],
    rateLimitConfig: {
      maxRequests: 10, // 10 multi-format imports per hour
      windowMs: 60 * 60 * 1000
    },
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    requireTenantValidation: true
  });

  if (authResult.response) {
    return authResult.response;
  }

  const apiKey = authResult.apiKey!;
  let progressTracker: ProgressTracker | null = null;
  
  try {
    const body: MultiFormatImportRequest = await request.json();
    const { 
      tenantId, 
      organizationId, 
      fileContent, 
      fileName, 
      format, 
      selectedSheet,
      columnMapping, 
      hierarchicalMapping,
      dryRun = false,
      jobId 
    } = body;

    // Parameter validation first
    if (!tenantId || !organizationId || !fileContent || !fileName || !format) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: tenantId, organizationId, fileContent, fileName, format'
      }, { status: 400 });
    }

    // Create or resume progress tracker
    progressTracker = jobId 
      ? new ProgressTracker(jobId) 
      : new ProgressTracker();
    
    progressTracker.updateProgress('uploading', 10, {
      totalBytes: fileContent.length
    }, 'Validating file format and parameters...');

    console.log(`🔍 MULTI-FORMAT IMPORT - Parameters:`, {
      tenantId,
      organizationId,
      fileName,
      format,
      selectedSheet,
      dryRun,
      jobId: progressTracker.getJobId(),
      contentLength: fileContent?.length || 0,
      hasColumnMapping: !!columnMapping,
      hasHierarchicalMapping: !!hierarchicalMapping
    });

    // Validate tenant access against API key
    const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
    if (!tenantValidation.valid) {
      progressTracker.fail(tenantValidation.error);
      return NextResponse.json({
        success: false,
        error: tenantValidation.error
      }, { status: 403 });
    }

    // Validate organization exists
    progressTracker.updateProgress('uploading', 30, {}, 'Verifying organization...');
    
    const organization = await prisma.organization.findFirst({
      where: { id: organizationId, tenantId }
    });

    if (!organization) {
      progressTracker.fail('Organization not found');
      return NextResponse.json({
        success: false,
        error: 'Organization not found'
      }, { status: 404 });
    }

    // Parse file content based on format
    progressTracker.updateProgress('parsing', 0, {}, `Parsing ${format.toUpperCase()} file...`);
    
    let fileData: string | ArrayBuffer;
    if (format === 'xlsx') {
      // Decode base64 for binary files
      const binaryString = atob(fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileData = bytes.buffer;
    } else {
      // Text-based formats
      fileData = fileContent;
    }

    // Parse with progress tracking
    const parseResult = await MultiFormatParser.parse(
      fileData,
      format,
      { 
        format, 
        selectedSheet,
        trimValues: true,
        skipEmptyRows: true 
      },
      (phase, progress, details) => {
        if (phase === 'parsing') {
          progressTracker!.updateProgress('parsing', progress, {
            rowsParsed: details?.rowsParsed,
            totalRowsEstimated: details?.totalRows
          });
        } else if (phase === 'normalizing') {
          progressTracker!.updateProgress('parsing', 50 + (progress * 0.5), {
            recordsMapped: details?.recordsMapped
          });
        }
      }
    );

    if (parseResult.errors.length > 0) {
      progressTracker.fail(`Parsing failed: ${parseResult.errors.join(', ')}`, {
        recordsSkipped: parseResult.skippedRecords
      });
      
      return NextResponse.json({
        success: false,
        error: 'File parsing failed',
        data: {
          importedCount: 0,
          skippedCount: parseResult.skippedRecords,
          errors: parseResult.errors,
          stats: createEmptyStats(),
          availableSheets: parseResult.metadata.sheets
        }
      }, { status: 400 });
    }

    progressTracker.updateProgress('mapping_validating', 0, {
      recordsMapped: parseResult.records.length
    }, 'Performing auto-mapping and validation...');

    // Auto-mapping phase
    let mapping: Record<string, string> = {};
    let autoMappingResult: MappingResult | null = null;

    if (columnMapping) {
      // Use provided mapping
      mapping = columnMapping;
    } else if (hierarchicalMapping && (format === 'json' || format === 'xml')) {
      // Use hierarchical mapping for structured formats
      mapping = hierarchicalMapping;
    } else {
      // Perform auto-mapping
      const availableFields = parseResult.metadata.detectedColumns || 
                             Object.keys(parseResult.records[0] || {});
      
      autoMappingResult = EnhancedAutoMapper.performMapping(
        availableFields,
        parseResult.records.slice(0, 10) // Sample for validation
      );
      
      mapping = autoMappingResult.mapping;
    }

    progressTracker.updateProgress('mapping_validating', 50, {
      recordsMapped: parseResult.records.length,
      dedupCandidates: 0
    }, 'Validating mapping...');

    // Validate mapping
    const mappingValidation = EnhancedAutoMapper.validateMapping(mapping);
    if (!mappingValidation.isValid) {
      progressTracker.fail(`Mapping validation failed: ${mappingValidation.errors.join(', ')}`);
      
      return NextResponse.json({
        success: false,
        error: 'Invalid field mapping',
        data: {
          importedCount: 0,
          skippedCount: 0,
          errors: mappingValidation.errors,
          stats: createEmptyStats(),
          autoMapping: autoMappingResult,
          availableSheets: parseResult.metadata.sheets,
          availablePaths: parseResult.metadata.detectedColumns
        }
      }, { status: 400 });
    }

    // Transform normalized records to Lead format
    progressTracker.updateProgress('mapping_validating', 75, {}, 'Converting records to lead format...');
    
    const transformedLeads = await transformRecordsToLeads(
      parseResult.records,
      mapping,
      format
    );

    const stats = generateImportStats(
      transformedLeads.filter(l => l !== null) as any[],
      parseResult.totalRecords,
      transformedLeads.filter(l => l === null).length
    );

    progressTracker.updateProgress('preview_ready', 100, {
      recordsMapped: transformedLeads.length,
      statusDistribution: stats.statusDistribution
    }, 'Preview ready');

    // If dry run, return preview
    if (dryRun) {
      const previewLeads = transformedLeads
        .filter(l => l !== null)
        .slice(0, 10)
        .map(lead => ({
          ...lead,
          id: `preview_${Math.random().toString(36).substring(2, 11)}`
        }));

      progressTracker.complete({
        sampleRecords: previewLeads.length,
        previewCalculationTime: Date.now()
      });

      return NextResponse.json({
        success: true,
        jobId: progressTracker.getJobId(),
        data: {
          importedCount: 0,
          skippedCount: parseResult.skippedRecords,
          errors: parseResult.errors,
          stats,
          leads: previewLeads,
          autoMapping: autoMappingResult,
          availableSheets: parseResult.metadata.sheets,
          availablePaths: parseResult.metadata.detectedColumns,
          unmappedFields: autoMappingResult?.unmappedFields
        }
      });
    }

    // Perform actual import
    progressTracker.updateProgress('importing_batches', 0, {
      totalBatches: Math.ceil(transformedLeads.length / 50),
      batchesCompleted: 0,
      recordsInserted: 0
    }, 'Starting batch import...');

    const validLeads = transformedLeads.filter(l => l !== null) as Omit<IPostgreSQLLead, 'id'>[];
    const importResult = await performBatchImport(
      validLeads,
      tenantId,
      organizationId,
      progressTracker
    );

    progressTracker.updateProgress('finalizing', 50, {
      recordsInserted: importResult.importedCount,
      recordsSkipped: importResult.skippedCount
    }, 'Finalizing import...');

    progressTracker.complete({
      recordsInserted: importResult.importedCount,
      recordsSkipped: importResult.skippedCount,
      topErrors: importResult.errors.slice(0, 5)
    });

    return NextResponse.json({
      success: true,
      jobId: progressTracker.getJobId(),
      data: {
        importedCount: importResult.importedCount,
        skippedCount: importResult.skippedCount,
        errors: importResult.errors,
        stats
      }
    });

  } catch (error) {
    console.error('❌ Multi-format import error:', error);
    
    if (progressTracker) {
      progressTracker.fail(
        error instanceof Error ? error.message : 'Unknown error during import'
      );
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Transform normalized records to Lead format using mapping
 */
async function transformRecordsToLeads(
  records: NormalizedRecord[],
  mapping: Record<string, string>,
  format: SupportedFormat
): Promise<(Omit<IPostgreSQLLead, 'id'> | null)[]> {
  return records.map(record => {
    try {
      // Apply mapping to create a CSV-like structure
      const mappedRecord: Record<string, any> = {};
      
      Object.entries(mapping).forEach(([systemField, sourcePath]) => {
        mappedRecord[systemField] = record[sourcePath];
      });

      // Use existing CSV converter with mapped data
      return convertCSVToLeadWithMapping(mappedRecord, mapping);
      
    } catch (error) {
      console.warn('Failed to transform record:', error, record);
      return null;
    }
  });
}

/**
 * Perform batch import with progress tracking
 */
async function performBatchImport(
  leads: Omit<IPostgreSQLLead, 'id'>[],
  tenantId: string,
  organizationId: string,
  progressTracker: ProgressTracker
): Promise<{ importedCount: number; skippedCount: number; errors: string[] }> {
  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(leads.length / BATCH_SIZE);
  const errors: string[] = [];
  let importedCount = 0;

  // Prepare data for batch insert
  const now = new Date();
  const bulkLeadData = leads.map(leadData => ({
    tenantId,
    organizationId,
    name: leadData.name,
    phone: leadData.phone,
    email: leadData.email,
    company: leadData.company,
    source: leadData.source,
    status: leadData.status,
    priority: leadData.priority,
    position: leadData.position,
    qualificationScore: leadData.qualification_score || 0,
    isQualified: leadData.is_qualified || false,
    qualificationNotes: leadData.qualification_notes,
    contactAttempts: leadData.contact_attempts || 0,
    responseRate: leadData.response_rate || 0,
    convertedToClient: leadData.converted_to_client || false,
    conversionValue: leadData.conversion_value,
    conversionDate: leadData.conversion_date instanceof Date ? leadData.conversion_date : null,
    notes: leadData.notes,
    internalNotes: leadData.internal_notes,
    // tags field removed - not supported in current schema
    assignedAgentName: leadData.assigned_agent_name,
    lastContactDate: leadData.last_contact_date instanceof Date ? leadData.last_contact_date : null,
    nextFollowUpDate: leadData.next_follow_up_date instanceof Date ? leadData.next_follow_up_date : null,
    preferredContactMethod: leadData.preferred_contact_method,
    createdAt: now,
    updatedAt: now
  }));

  // Process in batches
  for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * BATCH_SIZE;
    const batch = bulkLeadData.slice(batchStart, batchStart + BATCH_SIZE);
    const batchStartTime = Date.now();

    try {
      const result = await prisma.lead.createMany({
        data: batch,
        skipDuplicates: true
      });

      importedCount += result.count;
      
      const batchDuration = Date.now() - batchStartTime;
      progressTracker.updateProgress('importing_batches', ((i + 1) / totalBatches) * 100, {
        batchesCompleted: i + 1,
        totalBatches,
        recordsInserted: importedCount,
        lastBatchDurationMs: batchDuration
      }, `Batch ${i + 1}/${totalBatches} completed (${result.count} records)`);

    } catch (error) {
      const errorMessage = `Batch ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error('Batch import error:', error);
    }
  }

  return {
    importedCount,
    skippedCount: leads.length - importedCount,
    errors
  };
}

/**
 * Create empty stats for error responses
 */
function createEmptyStats(): ImportStats {
  return {
    totalRows: 0,
    validLeads: 0,
    skippedRows: 0,
    statusDistribution: {
      new: 0, interested: 0, qualified: 0, follow_up: 0,
      proposal_current: 0, proposal_previous: 0, negotiation: 0,
      won: 0, lost: 0, nurturing: 0, cold: 0
    },
    priorityDistribution: { low: 0, medium: 0, high: 0, urgent: 0 },
    sourceDistribution: {
      website: 0, social_media: 0, referral: 0, cold_call: 0,
      advertisement: 0, email: 0, event: 0, whatsapp: 0, other: 0
    }
  };
}