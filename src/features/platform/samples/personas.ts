/*
 * Synthetic sample inputs (fictional organizations; not customer data).
 *
 * PERSONAS and USE_CASES are copied from platform/scripts/generate_samples.py and SHIELD_SAMPLES
 * from platform/app/runtime-shield/veritrail_shield/examples.py (SAMPLES). Key order matters: it
 * drives the order of answers/profile fields in the generated JSON, exactly as in Python.
 */

export interface MaturityPersona {
  slug: string;
  lead: { company: string; name: string };
  profile: Record<string, string | boolean>;
  answers: Record<string, number>;
}

export const PERSONAS: MaturityPersona[] = [
  {
    "slug": "example_health_group_initial",
    "lead": {
      "company": "Example Health Group (synthetic)",
      "name": "Synthetic CISO"
    },
    "profile": {
      "industry": "healthcare_pharma",
      "org_size": "5000+",
      "ai_systems": "unknown",
      "uses_agents": false,
      "eu_operations": true
    },
    "answers": {
      "STR-Q1": 2,
      "STR-Q2": 1,
      "STR-Q3": 2,
      "INV-Q1": 1,
      "INV-Q2": 1,
      "INV-Q3": 2,
      "RSK-Q1": 2,
      "RSK-Q2": 1,
      "RSK-Q3": 1,
      "DAT-Q1": 2,
      "DAT-Q2": 3,
      "DAT-Q3": 2,
      "SEC-Q1": 2,
      "SEC-Q2": 1,
      "SEC-Q3": 2,
      "FST-Q1": 1,
      "FST-Q2": 2,
      "FST-Q3": 1,
      "HUM-Q1": 2,
      "HUM-Q2": 2,
      "HUM-Q3": 1,
      "ASR-Q1": 1,
      "ASR-Q2": 1,
      "ASR-Q3": 1
    }
  },
  {
    "slug": "example_bank_developing",
    "lead": {
      "company": "Example Bank plc (synthetic)",
      "name": "Synthetic CRO"
    },
    "profile": {
      "industry": "bfsi",
      "org_size": "5000+",
      "ai_systems": "25-99",
      "uses_agents": true,
      "eu_operations": true
    },
    "answers": {
      "STR-Q1": 4,
      "STR-Q2": 3,
      "STR-Q3": 3,
      "INV-Q1": 2,
      "INV-Q2": 3,
      "INV-Q3": 2,
      "RSK-Q1": 4,
      "RSK-Q2": 3,
      "RSK-Q3": 2,
      "DAT-Q1": 3,
      "DAT-Q2": 4,
      "DAT-Q3": 2,
      "SEC-Q1": 3,
      "SEC-Q2": 2,
      "SEC-Q3": 2,
      "FST-Q1": 4,
      "FST-Q2": 3,
      "FST-Q3": 3,
      "HUM-Q1": 3,
      "HUM-Q2": 3,
      "HUM-Q3": 2,
      "ASR-Q1": 3,
      "ASR-Q2": 2,
      "ASR-Q3": 3
    }
  },
  {
    "slug": "examplesoft_saas_defined",
    "lead": {
      "company": "ExampleSoft (synthetic)",
      "name": "Synthetic VP Engineering"
    },
    "profile": {
      "industry": "saas_product",
      "org_size": "250-1000",
      "ai_systems": "10-24",
      "uses_agents": true,
      "eu_operations": false
    },
    "answers": {
      "STR-Q1": 4,
      "STR-Q2": 3,
      "STR-Q3": 4,
      "INV-Q1": 4,
      "INV-Q2": 3,
      "INV-Q3": 4,
      "RSK-Q1": 3,
      "RSK-Q2": 4,
      "RSK-Q3": 3,
      "DAT-Q1": 4,
      "DAT-Q2": 3,
      "DAT-Q3": 4,
      "SEC-Q1": 4,
      "SEC-Q2": 3,
      "SEC-Q3": 4,
      "FST-Q1": 3,
      "FST-Q2": 4,
      "FST-Q3": 2,
      "HUM-Q1": 3,
      "HUM-Q2": 4,
      "HUM-Q3": 3,
      "ASR-Q1": 3,
      "ASR-Q2": 3,
      "ASR-Q3": 4
    }
  }
];

export const USE_CASES: Record<string, Record<string, unknown>> = {
  "customer_support_agent": {
    "name": "Customer support agent",
    "purpose": "Answer customer queries and update tickets using CRM data",
    "decision_impact": "advisory",
    "affected_parties": "customers",
    "data_sensitivity": "personal",
    "autonomy": "acts_with_approval",
    "tools": [
      "crm_read",
      "crm_write",
      "send_email"
    ],
    "external_actions": true,
    "domain_category": "customer_service",
    "genai": true,
    "vendor_model": true,
    "eu_exposure": true,
    "environment": "production"
  },
  "credit_decision_support": {
    "name": "SME credit decision support",
    "purpose": "Recommend credit limits for small-business applicants",
    "decision_impact": "material",
    "affected_parties": "customers",
    "data_sensitivity": "personal",
    "autonomy": "suggests",
    "domain_category": "credit",
    "genai": false,
    "vendor_model": false,
    "eu_exposure": true,
    "environment": "production"
  },
  "meeting_summariser": {
    "name": "Internal meeting summariser",
    "purpose": "Summarise internal meeting transcripts",
    "decision_impact": "none",
    "affected_parties": "internal",
    "data_sensitivity": "internal",
    "autonomy": "suggests",
    "domain_category": "internal_productivity",
    "genai": true,
    "vendor_model": true
  }
};

export const SHIELD_SAMPLES: Record<string, Record<string, unknown>> = {
  "customer_support_agent": {
    "synthetic": true,
    "app_name": "Northwind Support Assistant",
    "agent_name": "northwind-support-agent",
    "purpose": "Answer customer order and delivery questions, update tickets, and issue small goodwill refunds",
    "users": [
      "Retail customers (web chat)",
      "Tier-1 support agents"
    ],
    "business_functions": [
      "Customer service"
    ],
    "model": "gpt-4o-2024-08-06",
    "vendor": "Azure OpenAI",
    "tools": [
      {
        "name": "crm.lookup_order",
        "operation": "read",
        "description": "Look up an order by order ID",
        "parameters": {
          "order_id": {
            "type": "string",
            "regex": "^ORD-[0-9]{6,10}$",
            "required": true
          }
        }
      },
      {
        "name": "kb.search",
        "operation": "read",
        "description": "Search the public help-centre knowledge base",
        "data_sensitivity": "public",
        "parameters": {
          "query": {
            "type": "string",
            "max_length": 500,
            "required": true
          }
        }
      },
      {
        "name": "tickets.update",
        "operation": "write",
        "description": "Add a note or change ticket status",
        "parameters": {
          "ticket_id": {
            "type": "string",
            "regex": "^TCK-[0-9]{6,10}$",
            "required": true
          },
          "status": {
            "type": "string",
            "enum": [
              "open",
              "pending_customer",
              "resolved"
            ]
          },
          "note": {
            "type": "string",
            "max_length": 4000
          }
        }
      },
      {
        "name": "payments.issue_refund",
        "operation": "payment",
        "description": "Issue a goodwill refund to the original payment method",
        "max_amount": 500,
        "auto_approve_below": 50,
        "currencies": [
          "USD",
          "EUR",
          "GBP"
        ],
        "approval_roles": [
          "Support Team Lead"
        ],
        "parameters": {
          "order_id": {
            "type": "string",
            "regex": "^ORD-[0-9]{6,10}$",
            "required": true
          },
          "amount": {
            "type": "number",
            "min": 0.01,
            "required": true
          },
          "currency": {
            "type": "string",
            "enum": [
              "USD",
              "EUR",
              "GBP"
            ],
            "required": true
          },
          "reason_code": {
            "type": "string",
            "enum": [
              "late_delivery",
              "damaged_item",
              "goodwill"
            ],
            "required": true
          }
        }
      },
      {
        "name": "email.send_customer_reply",
        "operation": "external_send",
        "description": "Send a reply to the customer who opened the ticket",
        "allowed_domains": [
          "mail.northwind.example"
        ],
        "recipient_param": "reply_via",
        "recipient_binding": true,
        "parameters": {
          "ticket_id": {
            "type": "string",
            "regex": "^TCK-[0-9]{6,10}$",
            "required": true
          },
          "reply_via": {
            "type": "string",
            "required": true
          },
          "body": {
            "type": "string",
            "max_length": 6000,
            "required": true
          }
        }
      },
      {
        "name": "crm.delete_customer",
        "operation": "delete",
        "description": "Delete a customer record",
        "approval_roles": [
          "Data Protection Officer"
        ],
        "parameters": {
          "customer_id": {
            "type": "string",
            "regex": "^CUS-[0-9]{6,10}$",
            "required": true
          },
          "erasure_request_id": {
            "type": "string",
            "regex": "^DSR-[0-9]{6}$",
            "required": true
          }
        }
      }
    ],
    "data_categories": [
      "Customer contact details",
      "Order history",
      "Payment card tokens (no PAN)"
    ],
    "data_sensitivity": "personal",
    "autonomy": "acts_with_approval",
    "human_approval_model": "threshold",
    "environment": "production",
    "risk_tier": "Limited",
    "affected_parties": "customers",
    "regulatory_obligations": [
      "GDPR",
      "PCI DSS (card data out of scope by tokenization)"
    ],
    "customer_obligations": [
      "Respond within contractual SLA",
      "No customer data used for model training"
    ],
    "existing_controls": [
      "Okta SSO with MFA",
      "Splunk SIEM",
      "Secrets manager (Vault)",
      "Zero data retention agreement with model vendor"
    ],
    "allowed_roles": [
      "support_agent",
      "customer"
    ],
    "allowed_link_domains": [
      "northwind.example",
      "help.northwind.example"
    ],
    "tenant": "northwind",
    "owner": "Head of Customer Service"
  },
  "financial_operations_agent": {
    "synthetic": true,
    "app_name": "Contoso AP Automation Agent",
    "agent_name": "contoso-ap-agent",
    "purpose": "Match supplier invoices to purchase orders, prepare payment runs and draft remittance advice",
    "users": [
      "Accounts payable team",
      "Finance controllers"
    ],
    "business_functions": [
      "Finance operations",
      "Procurement"
    ],
    "model": "claude-sonnet-4",
    "vendor": "Anthropic (via AWS Bedrock)",
    "tools": [
      {
        "name": "erp.get_invoice",
        "operation": "read",
        "parameters": {
          "invoice_id": {
            "type": "string",
            "regex": "^INV-[0-9]{8}$",
            "required": true
          }
        }
      },
      {
        "name": "erp.match_po",
        "operation": "write",
        "parameters": {
          "invoice_id": {
            "type": "string",
            "regex": "^INV-[0-9]{8}$",
            "required": true
          },
          "po_number": {
            "type": "string",
            "regex": "^PO-[0-9]{8}$",
            "required": true
          }
        }
      },
      {
        "name": "payments.schedule_payment",
        "operation": "payment",
        "max_amount": 250000,
        "allow_pii_entities": [
          "iban"
        ],
        "currencies": [
          "USD",
          "EUR"
        ],
        "approval_roles": [
          "Finance Controller"
        ],
        "parameters": {
          "invoice_id": {
            "type": "string",
            "regex": "^INV-[0-9]{8}$",
            "required": true
          },
          "amount": {
            "type": "number",
            "min": 0.01,
            "required": true
          },
          "currency": {
            "type": "string",
            "enum": [
              "USD",
              "EUR"
            ],
            "required": true
          },
          "payee_iban": {
            "type": "string",
            "max_length": 34,
            "required": true
          }
        }
      },
      {
        "name": "vendor_master.update_bank_details",
        "operation": "write",
        "requires_approval": true,
        "approval_roles": [
          "Finance Controller"
        ],
        "allow_pii_entities": [
          "iban"
        ],
        "max_calls_per_session": 1,
        "description": "Change supplier bank account details (classic payment-fraud vector)",
        "parameters": {
          "vendor_id": {
            "type": "string",
            "regex": "^V-[0-9]{6}$",
            "required": true
          },
          "new_iban": {
            "type": "string",
            "max_length": 34,
            "required": true
          },
          "verification_ticket": {
            "type": "string",
            "regex": "^VRF-[0-9]{6}$",
            "required": true
          }
        }
      },
      {
        "name": "email.send_remittance",
        "operation": "external_send",
        "approval_roles": [
          "AP Supervisor"
        ],
        "parameters": {
          "to": {
            "type": "string",
            "required": true
          },
          "invoice_id": {
            "type": "string",
            "regex": "^INV-[0-9]{8}$",
            "required": true
          },
          "body": {
            "type": "string",
            "max_length": 4000
          }
        }
      },
      {
        "name": "reports.export_ledger",
        "operation": "export",
        "approval_roles": [
          "Finance Controller"
        ],
        "parameters": {
          "period": {
            "type": "string",
            "regex": "^[0-9]{4}-[0-9]{2}$",
            "required": true
          },
          "max_rows": {
            "type": "integer",
            "min": 1,
            "max": 5000
          }
        }
      }
    ],
    "data_categories": [
      "Supplier bank account details",
      "Invoices",
      "General ledger",
      "Employee expense data"
    ],
    "data_sensitivity": "personal",
    "autonomy": "acts_with_approval",
    "human_approval_model": "per_action",
    "environment": "production",
    "risk_tier": "High-risk",
    "affected_parties": "internal",
    "regulatory_obligations": [
      "SOX internal controls over financial reporting",
      "GDPR"
    ],
    "customer_obligations": [],
    "existing_controls": [
      "Entra ID SSO",
      "Segregation of duties in ERP",
      "SIEM (Sentinel)",
      "Quarterly penetration testing"
    ],
    "allowed_roles": [
      "ap_clerk",
      "finance_controller"
    ],
    "tenant": "contoso",
    "owner": "Financial Controller",
    "limits": {
      "cost_per_month_usd": 4000
    }
  }
};
