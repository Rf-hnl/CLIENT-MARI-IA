{
  "admin": {
    "system_config": {
      "_data": {
        "version": "1.0.0",
        "maintenanceMode": false,
        "allowNewTenants": true,
        "features": {
          "ai_assistant": true,
          "advanced_analytics": true,
          "custom_integrations": true,
          "white_labeling": true
        },
        "systemLimits": {
          "maxTenantsPerPlan": {
            "basic": 1000,
            "premium": 500,
            "enterprise": 100
          },
          "globalRateLimit": 10000,
          "maxFileSize": 10485760
        },
        "updatedAt": {
          "_seconds": 1753295568,
          "_nanoseconds": 993000000
        },
        "updatedBy": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3"
      }
    }
  },
  "auth_profiles": {
    "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3": {
      "_data": {
        "uid": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3",
        "email": "demo@mar-ia.app",
        "globalRole": "admin",
        "tenantMemberships": [
          "demo-tenant-001"
        ],
        "lastLogin": {
          "_seconds": 1753295568,
          "_nanoseconds": 993000000
        },
        "isActive": true,
        "createdAt": {
          "_seconds": 1753295568,
          "_nanoseconds": 993000000
        },
        "updatedAt": {
          "_seconds": 1753295568,
          "_nanoseconds": 993000000
        }
      }
    }
  },
  "global_analytics": {
    "system_metrics": {
      "_data": {
        "totalTenants": 1,
        "activeTenants": 1,
        "totalUsers": 1,
        "activeUsers": 1,
        "totalOrganizations": 1,
        "systemHealth": "healthy",
        "lastUpdated": {
          "_seconds": 1753295568,
          "_nanoseconds": 993000000
        },
        "metrics": {
          "avgResponseTime": 150,
          "uptime": 99.9,
          "errorRate": 0.01
        }
      }
    }
  },
  "tenants": {
    "demo-tenant-001": {
      "_data": {
        "id": "demo-tenant-001",
        "companyInfo": {
          "name": "Demo Company",
          "description": "Empresa de demostración para el sistema MAR-IA",
          "industry": "technology",
          "size": "medium",
          "website": "https://demo-company.com",
          "logoUrl": "https://via.placeholder.com/150"
        },
        "ownerId": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3",
        "status": "active",
        "planType": "premium",
        "userCount": 3,
        "organizationCount": 1,
        "createdAt": {
          "_seconds": 1753295568,
          "_nanoseconds": 993000000
        },
        "stats": {
          "organizationsCount": 1,
          "userCount": 5,
          "lastActivity": {
            "_seconds": 1753418493,
            "_nanoseconds": 241000000
          }
        },
        "updatedAt": {
          "_seconds": 1753418493,
          "_nanoseconds": 241000000
        }
      },
      "_subcollections": {
        "activities": {
          "demo-activity-001": {
            "_data": {
              "id": "demo-activity-001",
              "type": "notification",
              "name": "Bienvenida diaria",
              "description": "Envío de mensaje de bienvenida diario a nuevos usuarios",
              "targetOrganizationId": "demo-org-001",
              "execution": {
                "scheduledAt": {
                  "_seconds": 1753381968,
                  "_nanoseconds": 995000000
                },
                "timezone": "America/New_York"
              },
              "status": "scheduled",
              "automation": {
                "trigger": {
                  "type": "schedule",
                  "config": {
                    "time": "09:00"
                  }
                },
                "actions": [
                  {
                    "type": "send_notification",
                    "config": {
                      "template": "daily_welcome"
                    },
                    "order": 1
                  }
                ],
                "repeat": {
                  "frequency": "daily",
                  "timeOfDay": "09:00"
                }
              },
              "settings": {
                "retryOnFailure": true,
                "maxRetries": 3,
                "retryDelay": 5,
                "timeoutMinutes": 10,
                "notifications": {
                  "onSuccess": false,
                  "onFailure": true,
                  "recipients": [
                    "demo@mar-ia.app"
                  ]
                }
              },
              "createdBy": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3",
              "createdAt": {
                "_seconds": 1753295568,
                "_nanoseconds": 993000000
              },
              "updatedAt": {
                "_seconds": 1753295568,
                "_nanoseconds": 993000000
              },
              "isActive": true
            }
          }
        },
        "analytics": {
          "demo-metric-001": {
            "_data": {
              "id": "demo-metric-001",
              "type": "user_activity",
              "name": "Usuarios Activos Diarios",
              "category": "engagement",
              "value": 1,
              "unit": "users",
              "period": "day",
              "timestamp": {
                "_seconds": 1753295568,
                "_nanoseconds": 993000000
              },
              "organizationId": "demo-org-001",
              "aggregation": {
                "sum": 1,
                "average": 1,
                "min": 1,
                "max": 1,
                "count": 1,
                "previousValue": 0,
                "percentageChange": 100
              },
              "metadata": {
                "source": "system",
                "dimensions": {
                  "tenant": "demo-tenant-001",
                  "organization": "demo-org-001"
                }
              }
            }
          }
        },
        "integrations": {
          "demo-integration-001": {
            "_data": {
              "id": "demo-integration-001",
              "type": "whatsapp",
              "name": "WhatsApp Business Demo",
              "description": "Integración de demostración con WhatsApp Business API",
              "provider": "Meta",
              "version": "1.0.0",
              "status": "connected",
              "config": {
                "apiEndpoint": "https://graph.facebook.com/v18.0",
                "scopes": [
                  "whatsapp_business_messaging"
                ],
                "features": [
                  "send_messages",
                  "receive_messages",
                  "media_upload"
                ],
                "syncDirection": "bidirectional",
                "syncFrequency": "realtime"
              },
              "credentials": {
                "stored": true,
                "type": "oauth2",
                "expiresAt": {
                  "_seconds": 1784831568,
                  "_nanoseconds": 995000000
                },
                "scopes": [
                  "whatsapp_business_messaging"
                ],
                "refreshTokenValid": true
              },
              "syncStats": {
                "lastSync": {
                  "_seconds": 1753295568,
                  "_nanoseconds": 993000000
                },
                "lastSuccessfulSync": {
                  "_seconds": 1753295568,
                  "_nanoseconds": 993000000
                },
                "totalSyncs": 1,
                "successfulSyncs": 1,
                "failedSyncs": 0,
                "recordsProcessed": 0,
                "averageDuration": 250
              },
              "createdAt": {
                "_seconds": 1753295568,
                "_nanoseconds": 993000000
              },
              "updatedAt": {
                "_seconds": 1753295568,
                "_nanoseconds": 993000000
              },
              "createdBy": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3"
            }
          }
        },
        "organizations": {
          "GgJ40oOkiuKd8necl5EV": {
            "_data": {
              "name": "Organización de raulefdz",
              "description": "Organización predeterminada",
              "ownerId": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3",
              "memberIds": [
                "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3"
              ],
              "settings": {
                "allowMemberInvites": true,
                "defaultLeadStage": "Nuevo",
                "timezone": "America/Mexico_City"
              },
              "createdAt": {
                "_seconds": 1753480566,
                "_nanoseconds": 527000000
              },
              "updatedAt": {
                "_seconds": 1753480566,
                "_nanoseconds": 527000000
              }
            }
          },
          "LvbFBJ82S5c8U9w8g6h5": {
            "_data": {
              "name": "MAR-IA",
              "description": "dfdverf. frfrfr",
              "ownerId": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3",
              "settings": {
                "inheritFromTenant": true
              },
              "branding": {
                "primaryColor": "#000000"
              },
              "limits": {
                "maxUsers": 25,
                "maxLeads": 1000,
                "storageUsed": 0,
                "storageLimit": 1073741824
              },
              "isActive": true,
              "createdAt": {
                "_seconds": 1753369504,
                "_nanoseconds": 429000000
              },
              "stats": {
                "totalLeads": 0,
                "totalCampaigns": 0,
                "monthlyActivity": {
                  "leads": 0,
                  "campaigns": 0,
                  "apiCalls": 0
                },
                "lastActivity": {
                  "_seconds": 1753418493,
                  "_nanoseconds": 241000000
                },
                "activeUsers": 3
              },
              "memberIds": [
                "Uvp0W9uisyp3CefbLDzx",
                "lE984HCigwcNq3IAHVER",
                "l6JZuPh98jnXRCeeE5Yj"
              ],
              "updatedAt": {
                "_seconds": 1753418493,
                "_nanoseconds": 241000000
              }
            },
            "_subcollections": {
              "clients": {
                "RQoBu9jNU4wFGkJAXlcN": {
                  "_data": {
                    "name": "Carlos Rodríguez González",
                    "email": "carlos.rodriguez@ejemplo.com",
                    "phone": "+34 655 987 321",
                    "national_id": "12345678Z",
                    "address": "Avenida de la Constitución 45, 3º B",
                    "city": "Sevilla",
                    "province": "Andalucía",
                    "postal_code": "41001",
                    "country": "España",
                    "debt": 8500.75,
                    "status": "current",
                    "loan_letter": "PREST-2024-0456",
                    "payment_date": {
                      "_seconds": 1705276800,
                      "_nanoseconds": 0
                    },
                    "installment_amount": 350.25,
                    "pending_installments": 18,
                    "due_date": {
                      "_seconds": 1707955200,
                      "_nanoseconds": 0
                    },
                    "loan_start_date": {
                      "_seconds": 1685577600,
                      "_nanoseconds": 0
                    },
                    "days_overdue": 0,
                    "last_payment_date": {
                      "_seconds": 1705276800,
                      "_nanoseconds": 0
                    },
                    "last_payment_amount": 350.25,
                    "credit_score": 720,
                    "risk_category": "prime",
                    "credit_limit": 15000,
                    "available_credit": 6499.25,
                    "employment_status": "Empleado a tiempo completo",
                    "employer": "TechCorp Solutions SL",
                    "position": "Desarrollador Senior",
                    "monthly_income": 3200,
                    "employment_verified": true,
                    "preferred_contact_method": "whatsapp",
                    "best_contact_time": "9:00 AM - 6:00 PM (L-V)",
                    "response_score": 8.5,
                    "recovery_probability": 92.5,
                    "collection_strategy": "Cliente con buen historial. Contacto preventivo antes del vencimiento. Responde bien a recordatorios por WhatsApp.",
                    "notes": "Cliente ejemplar con excelente historial de pagos. Muy comunicativo y proactivo en sus pagos.",
                    "internal_notes": "Considerar para programa de fidelización. Posible candidato para aumento de límite de crédito.",
                    "tags": [
                      "buen-pagador",
                      "comunicativo",
                      "empleado-estable",
                      "tech-sector"
                    ],
                    "created_at": {
                      "_seconds": 1753403101,
                      "_nanoseconds": 217000000
                    },
                    "updated_at": {
                      "_seconds": 1753403101,
                      "_nanoseconds": 217000000
                    }
                  }
                }
              },
              "leads": {
                "LEuTv4yFGWvq0QAUHDMC": {
                  "_data": {
                    "identifiers": {
                      "leadId": "LEAD-2025-001",
                      "source": "manual",
                      "sourceId": "MOCK-001",
                      "uid": "lead_1753410135546_j8m8jahmk"
                    },
                    "contact": {
                      "fullName": "Ana García Martínez",
                      "email": "ana.garcia@techsolutions.ejemplo.com",
                      "phone": "+34 666 123 456",
                      "company": "TechSolutions SL"
                    },
                    "business": {
                      "businessType": "Desarrollo de Software",
                      "industry": "Tecnología e Innovación",
                      "address": {
                        "street": "Calle Gran Vía 123, Oficina 4B",
                        "city": "Madrid",
                        "province": "Comunidad de Madrid",
                        "country": "España",
                        "postal_code": "28013"
                      },
                      "website": "https://techsolutions.ejemplo.com",
                      "socialMedia": {
                        "linkedin": "https://linkedin.com/company/techsolutions-sl",
                        "twitter": "@techsolutions_es",
                        "facebook": "https://facebook.com/techsolutionssl",
                        "instagram": "@techsolutions.oficial",
                        "youtube": "https://youtube.com/c/techsolutionssl"
                      }
                    },
                    "pipeline": {
                      "stage": "qualified",
                      "priority": "high",
                      "status": "in_progress",
                      "qualificationStatus": "Empresa interesada en migración completa a cloud con timeline definido",
                      "estimatedValue": 25000,
                      "closeProbability": 85,
                      "expectedCloseDate": "2025-09-08T02:22:13.123Z",
                      "actualCloseDate": null,
                      "lostReason": ""
                    },
                    "scoring": {
                      "calculatedMonetaryPotential": 28000,
                      "calculatedLeadScore": 92,
                      "leadScore": 95,
                      "engagementScore": 88,
                      "responseRate": 85
                    },
                    "communication": {
                      "firstContactDate": "2025-07-11T02:22:13.123Z",
                      "lastContactDate": "2025-07-24T02:22:13.123Z",
                      "nextFollowUpDate": "2025-07-27T02:22:13.123Z",
                      "communicationCount": 8
                    },
                    "assignment": {
                      "assignedTo": "Juan Carlos Pérez",
                      "assignedDate": "2025-07-11T02:22:13.123Z",
                      "teamId": "team-enterprise-sales-001"
                    },
                    "treatment": {
                      "records": [
                        {
                          "date": "2025-07-11T02:22:13.123Z",
                          "channel": "email",
                          "performedBy": "Juan Carlos Pérez",
                          "result": "Contacto inicial exitoso - alta receptividad",
                          "notes": "Cliente muy interesado en demo técnica completa"
                        },
                        {
                          "date": "2025-07-15T02:22:13.123Z",
                          "channel": "call",
                          "performedBy": "Juan Carlos Pérez",
                          "result": "Llamada de seguimiento completada",
                          "notes": "Confirmó presupuesto y timeline. Solicita reunión con CTO"
                        },
                        {
                          "date": "2025-07-18T02:22:13.123Z",
                          "channel": "whatsapp",
                          "performedBy": "Ana López",
                          "result": "Documentación técnica enviada",
                          "notes": "Envío de casos de éxito y referencias"
                        },
                        {
                          "date": "2025-07-22T02:22:13.123Z",
                          "channel": "email",
                          "performedBy": "Juan Carlos Pérez",
                          "result": "Demo técnica realizada exitosamente",
                          "notes": "Demo de 2 horas. CTO muy impresionado con la arquitectura"
                        },
                        {
                          "date": "2025-07-24T02:22:13.123Z",
                          "channel": "call",
                          "performedBy": "María Rodríguez",
                          "result": "Reunión comercial - negociación de términos",
                          "notes": "Discusión de propuesta comercial. Solicita descuento por volumen"
                        }
                      ]
                    },
                    "ai": {
                      "aiContent": {
                        "sentiment": "very_positive",
                        "confidence_score": 0.92,
                        "topics": [
                          "cloud_migration",
                          "enterprise_security",
                          "scalability",
                          "cost_optimization"
                        ],
                        "priority_score": 9.2,
                        "lead_quality": "hot",
                        "buying_signals": [
                          "budget_confirmed",
                          "decision_maker_engaged",
                          "timeline_defined",
                          "technical_requirements_discussed"
                        ],
                        "pain_points": [
                          "legacy_infrastructure_costs",
                          "scalability_limitations",
                          "security_concerns",
                          "maintenance_overhead"
                        ]
                      },
                      "interests": {
                        "products": [
                          "Cloud Infrastructure",
                          "Security Solutions",
                          "Backup & Recovery",
                          "Monitoring Tools"
                        ],
                        "services": [
                          "Migration Services",
                          "Training",
                          "Support"
                        ],
                        "budget_range": "20000-30000",
                        "decision_timeline": "1-2 months",
                        "decision_makers": [
                          "CTO",
                          "CEO",
                          "IT Director"
                        ],
                        "competitors_evaluated": [
                          "AWS",
                          "Azure",
                          "Google Cloud"
                        ],
                        "preferred_communication": "email_and_calls",
                        "meeting_availability": "weekdays_morning"
                      }
                    },
                    "media": {
                      "images": [
                        {
                          "url": "https://ejemplo.com/demo-screenshot-1.png",
                          "description": "Screenshot de demo técnica",
                          "uploaded_date": "2025-07-22T02:22:13.123Z"
                        },
                        {
                          "url": "https://ejemplo.com/architecture-diagram.png",
                          "description": "Diagrama de arquitectura propuesta",
                          "uploaded_date": "2025-07-24T02:22:13.123Z"
                        }
                      ],
                      "notes": "Cliente potencial de muy alta calidad con presupuesto confirmado y timeline definido. Excelente fit para nuestras soluciones enterprise.",
                      "internalNotes": "IMPORTANTE: Contactar antes del 15 de febrero para cierre Q1. Cliente está evaluando competencia pero tenemos ventaja técnica. Considerar descuento estratégico para cerrar.",
                      "description": "Empresa en crecimiento acelerado (100+ empleados) buscando migrar completamente su infraestructura a la nube. Actualmente usando soluciones legacy costosas y limitadas."
                    },
                    "metadata": {
                      "schemaVersion": 1,
                      "createdAt": "2025-07-11T02:22:13.123Z",
                      "updatedAt": "2025-07-25T02:22:13.123Z",
                      "sourceCreatedAt": "2025-07-11T02:22:13.123Z"
                    },
                    "sourceData": {
                      "manual": {
                        "created_by": "juan.perez@empresa.com",
                        "campaign": "Enterprise Demo Q1 2025",
                        "lead_source": "Networking Event - Tech Summit Madrid",
                        "referral_source": "Existing client recommendation",
                        "initial_interest": "Cloud migration consultation",
                        "notes": "Lead generado en Tech Summit Madrid 2025. Referido por cliente actual (InnovateTech SL)"
                      },
                      "metaAds": {
                        "campaign_id": null,
                        "ad_set_id": null,
                        "ad_id": null,
                        "utm_source": null,
                        "utm_medium": null,
                        "utm_campaign": null
                      },
                      "googlePlaces": {
                        "place_id": null,
                        "business_name": null,
                        "address": null,
                        "phone": null,
                        "website": null
                      },
                      "fileImport": {
                        "import_batch_id": null,
                        "file_name": null,
                        "import_date": null,
                        "row_number": null
                      },
                      "qrLead": {
                        "qr_campaign_id": null,
                        "scan_location": null,
                        "scan_date": null,
                        "device_info": null
                      },
                      "webhook": {
                        "webhook_source": null,
                        "webhook_id": null,
                        "payload": null,
                        "received_date": null
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "settings": {
          "branding": {
            "_data": {
              "logoUrl": "https://via.placeholder.com/200x80",
              "faviconUrl": "https://via.placeholder.com/32x32",
              "colors": {
                "primary": "#3B82F6",
                "secondary": "#1E40AF",
                "accent": "#F59E0B",
                "background": "#FFFFFF",
                "text": "#1F2937"
              },
              "customDomain": "demo.mar-ia.app",
              "emailTemplates": {
                "headerLogoUrl": "https://via.placeholder.com/150x50",
                "footerText": "© 2024 Demo Company. Todos los derechos reservados.",
                "colors": {
                  "primary": "#3B82F6",
                  "secondary": "#1E40AF"
                }
              },
              "updatedAt": {
                "_seconds": 1753295568,
                "_nanoseconds": 993000000
              },
              "updatedBy": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3"
            }
          },
          "regional": {
            "_data": {
              "timezone": "America/New_York",
              "currency": "USD",
              "language": "es",
              "locale": "es-US",
              "dateFormat": "DD/MM/YYYY",
              "timeFormat": "24h",
              "numberFormat": {
                "decimal": ".",
                "thousand": ",",
                "currency": "$"
              },
              "weekStart": "monday",
              "updatedAt": {
                "_seconds": 1753295568,
                "_nanoseconds": 993000000
              },
              "updatedBy": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3"
            }
          },
          "security": {
            "_data": {
              "passwordPolicy": {
                "minLength": 8,
                "requireUppercase": true,
                "requireLowercase": true,
                "requireNumbers": true,
                "requireSpecialChars": true,
                "expirationDays": 90,
                "preventReuse": 5
              },
              "mfa": {
                "required": false,
                "methods": [
                  "email",
                  "totp"
                ],
                "gracePeriodDays": 7
              },
              "sessionTimeout": 480,
              "loginAttempts": {
                "maxAttempts": 5,
                "lockoutDuration": 15,
                "progressiveDelay": true
              },
              "dataRetention": {
                "historyDays": 365,
                "deletedUserDataDays": 30,
                "auditLogsDays": 2555
              },
              "updatedAt": {
                "_seconds": 1753295568,
                "_nanoseconds": 993000000
              },
              "updatedBy": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3"
            }
          },
          "subscription": {
            "_data": {
              "plan": "premium",
              "features": [
                "crm",
                "analytics",
                "integrations",
                "ai_assistant"
              ],
              "limits": {
                "maxUsers": 50,
                "maxLeads": 10000,
                "maxOrganizations": 5,
                "storageGB": 100,
                "apiCallsPerMonth": 100000,
                "customIntegrations": 10
              },
              "billing": {
                "billingCycle": "monthly",
                "currency": "USD",
                "amount": 99.99
              },
              "trial": {
                "isActive": true,
                "startDate": {
                  "_seconds": 1753295568,
                  "_nanoseconds": 993000000
                },
                "endDate": {
                  "_seconds": 1755887568,
                  "_nanoseconds": 994000000
                },
                "remainingDays": 30,
                "features": [
                  "premium_features"
                ]
              },
              "updatedAt": {
                "_seconds": 1753295568,
                "_nanoseconds": 993000000
              },
              "updatedBy": "qtiDb4xrwjd8P0Rd1JtQv2H7NvG3"
            }
          }
        }
      }
    }
  },
  "users": {
    "l6JZuPh98jnXRCeeE5Yj": {
      "_data": {
        "email": "raulefdz@gmail.com",
        "emailVerified": false,
        "displayName": "Browser key",
        "name": "Browser key",
        "firstName": "raul",
        "lastName": "fern",
        "phoneNumber": "",
        "profile": {
          "firstName": "raul",
          "lastName": "fern",
          "phone": "",
          "position": "ggg",
          "department": "hhh",
          "location": "hhhh",
          "bio": ""
        },
        "organizations": [
          "demo-tenant-001/LvbFBJ82S5c8U9w8g6h5"
        ],
        "organizationMemberships": [
          {
            "tenantId": "demo-tenant-001",
            "tenantName": "",
            "organizationId": "LvbFBJ82S5c8U9w8g6h5",
            "organizationName": "",
            "role": "member",
            "permissions": [],
            "joinedAt": {
              "_seconds": 1753418493,
              "_nanoseconds": 241000000
            },
            "isActive": true,
            "invitedBy": null,
            "lastActivity": {
              "_seconds": 1753418493,
              "_nanoseconds": 241000000
            }
          }
        ],
        "tenant_memberships": {
          "demo-tenant-001": {
            "tenantId": "demo-tenant-001",
            "organizationId": "LvbFBJ82S5c8U9w8g6h5",
            "role": "member",
            "permissions": [],
            "joinedAt": {
              "_seconds": 1753418493,
              "_nanoseconds": 241000000
            },
            "isActive": true
          }
        },
        "role": "member",
        "systemRole": "user",
        "totalOrganizations": 1,
        "totalTenants": 1,
        "currentTenantId": "demo-tenant-001",
        "currentOrganizationId": "LvbFBJ82S5c8U9w8g6h5",
        "lastLoginAt": null,
        "lastActivity": {
          "_seconds": 1753418493,
          "_nanoseconds": 241000000
        },
        "loginCount": 0,
        "invitationSent": true,
        "preferences": {
          "theme": "system",
          "language": "es",
          "notifications": {
            "email": true,
            "push": true,
            "sms": false
          }
        },
        "isActive": true,
        "isOnline": false,
        "profileCompleted": false,
        "createdAt": {
          "_seconds": 1753418493,
          "_nanoseconds": 241000000
        },
        "updatedAt": {
          "_seconds": 1753418493,
          "_nanoseconds": 241000000
        },
        "version": 1
      }
    }
  }
}