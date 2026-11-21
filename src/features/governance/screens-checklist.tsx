import { useState } from "react";
import { WorkspaceVisual } from "./workspace-visual";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle, Circle, MinusCircle } from "@phosphor-icons/react";
import { EmptyChecklist } from "@/features/site/illustrations-empty";
import { Button } from "@/components/ui/button";
import { CHANGE_IMPACT_ROUNDS, scoreChangeImpact } from "./change-impact-game";
import { useGovernance } from "./store";
import { VENDOR_CHALLENGES, vendorChallengeScore } from "./vendor-challenge";
import { INCIDENT_TABLETOP, tabletopResult } from "./tabletop-model";
import { crosswalkScore, FRAMEWORK_CROSSWALK } from "./framework-crosswalk";
import { EVIDENCE_DETECTIVE_ROUNDS, evidenceDetectiveScore } from "./evidence-detective";
import { RED_TEAM_ROUNDS, redTeamScore } from "./red-team-game";
import {
  buildLifecycleChecklist,
  checklistProgress,
  governanceMilestones,
  nextGovernanceChallenge,
} from "./checklist-model";
import { INCLUSIVE_DESIGN_ROUNDS, inclusiveDesignScore } from "./inclusive-design-game";
import {
  GUARDRAIL_ASSURANCE_ROUNDS,
  guardrailAssuranceScore,
} from "./guardrail-assurance-game";
import {
  MONITORING_ASSURANCE_ROUNDS,
  monitoringAssuranceScore,
} from "./monitoring-assurance-game";
import {
  RELEASE_GATE_ASSURANCE_ROUNDS,
  releaseGateAssuranceScore,
} from "./release-gate-assurance-game";
import {
  CORRECTIVE_ACTION_ASSURANCE_ROUNDS,
  correctiveActionAssuranceScore,
} from "./corrective-action-assurance-game";
import {
  RISK_ACCEPTANCE_ASSURANCE_ROUNDS,
  riskAcceptanceAssuranceScore,
} from "./risk-acceptance-assurance-game";
import {
  HUMAN_OVERSIGHT_ASSURANCE_ROUNDS,
  humanOversightAssuranceScore,
} from "./human-oversight-assurance-game";
import {
  DATA_GOVERNANCE_ASSURANCE_ROUNDS,
  dataGovernanceAssuranceScore,
} from "./data-governance-assurance-game";
import {
  TRANSPARENCY_RECORDKEEPING_ROUNDS,
  transparencyRecordkeepingScore,
} from "./transparency-recordkeeping-game";
import {
  SUPPLY_CHAIN_ASSURANCE_ROUNDS,
  supplyChainAssuranceScore,
} from "./supply-chain-assurance-game";
import {
  SECURITY_ROBUSTNESS_ASSURANCE_ROUNDS,
  securityRobustnessAssuranceScore,
} from "./security-robustness-assurance-game";
import {
  FAIRNESS_IMPACT_ASSURANCE_ROUNDS,
  fairnessImpactAssuranceScore,
} from "./fairness-impact-assurance-game";
import {
  CONTINUOUS_IMPROVEMENT_ASSURANCE_ROUNDS,
  continuousImprovementAssuranceScore,
} from "./continuous-improvement-assurance-game";
import {
  POLICY_ALIGNMENT_ASSURANCE_ROUNDS,
  policyAlignmentAssuranceScore,
} from "./policy-alignment-assurance-game";
import {
  CHANGE_DEPLOYMENT_ASSURANCE_ROUNDS,
  changeDeploymentAssuranceScore,
} from "./change-deployment-assurance-game";
import {
  ACCOUNTABILITY_RACI_ASSURANCE_ROUNDS,
  accountabilityRaciAssuranceScore,
} from "./accountability-raci-assurance-game";
import {
  TRAINING_AWARENESS_ASSURANCE_ROUNDS,
  trainingAwarenessAssuranceScore,
} from "./training-awareness-assurance-game";
import {
  STAKEHOLDER_REPORTING_ASSURANCE_ROUNDS,
  stakeholderReportingAssuranceScore,
} from "./stakeholder-reporting-assurance-game";
import {
  CONTINUITY_RESILIENCE_ASSURANCE_ROUNDS,
  continuityResilienceAssuranceScore,
} from "./continuity-resilience-assurance-game";
import {
  USER_RECOURSE_CONTESTABILITY_ROUNDS,
  userRecourseContestabilityScore,
} from "./user-recourse-contestability-game";
import {
  RESOURCE_EFFICIENCY_ASSURANCE_ROUNDS,
  resourceEfficiencyAssuranceScore,
} from "./resource-efficiency-assurance-game";
import {
  TESTING_VALIDATION_ASSURANCE_ROUNDS,
  testingValidationAssuranceScore,
} from "./testing-validation-assurance-game";
import {
  PURPOSE_BOUNDARY_ASSURANCE_ROUNDS,
  purposeBoundaryAssuranceScore,
} from "./purpose-boundary-assurance-game";
import {
  OUTPUT_QUALITY_RELIABILITY_ROUNDS,
  outputQualityReliabilityScore,
} from "./output-quality-reliability-game";
import {
  LOGGING_TRACEABILITY_ASSURANCE_ROUNDS,
  loggingTraceabilityAssuranceScore,
} from "./logging-traceability-assurance-game";
import {
  ACCESS_IDENTITY_ASSURANCE_ROUNDS,
  accessIdentityAssuranceScore,
} from "./access-identity-assurance-game";
import {
  MODEL_PROMPT_CONFIG_ASSURANCE_ROUNDS,
  modelPromptConfigAssuranceScore,
} from "./model-prompt-config-assurance-game";
import {
  CONTENT_SAFETY_MISUSE_ASSURANCE_ROUNDS,
  contentSafetyMisuseAssuranceScore,
} from "./content-safety-misuse-assurance-game";
import {
  SERVICE_LEVEL_RELIABILITY_ASSURANCE_ROUNDS,
  serviceLevelReliabilityAssuranceScore,
} from "./service-level-reliability-assurance-game";
import {
  EXPLAINABILITY_INTERPRETABILITY_ROUNDS,
  explainabilityInterpretabilityScore,
} from "./explainability-interpretability-game";
import {
  DATA_RETENTION_DELETION_ASSURANCE_ROUNDS,
  dataRetentionDeletionAssuranceScore,
} from "./data-retention-deletion-assurance-game";
import {
  ETHICAL_VALUES_ALIGNMENT_ASSURANCE_ROUNDS,
  ethicalValuesAlignmentAssuranceScore,
} from "./ethical-values-alignment-assurance-game";
import {
  PROCUREMENT_CONTRACTING_ASSURANCE_ROUNDS,
  procurementContractingAssuranceScore,
} from "./procurement-contracting-assurance-game";
import {
  DATA_LABELING_QUALITY_ASSURANCE_ROUNDS,
  dataLabelingQualityAssuranceScore,
} from "./data-labeling-quality-assurance-game";
import {
  INCIDENT_COMMUNICATION_TABLETOP_ROUNDS,
  incidentCommunicationTabletopScore,
} from "./incident-communication-tabletop-game";
import {
  DECOMMISSIONING_RETIREMENT_ASSURANCE_ROUNDS,
  decommissioningRetirementAssuranceScore,
} from "./decommissioning-retirement-assurance-game";
import {
  AI_LITERACY_ENABLEMENT_ASSURANCE_ROUNDS,
  aiLiteracyEnablementAssuranceScore,
} from "./ai-literacy-enablement-assurance-game";
import {
  HUMAN_AI_HANDOFF_ASSURANCE_ROUNDS,
  humanAIHandoffAssuranceScore,
} from "./human-ai-handoff-assurance-game";
import {
  VENDOR_AI_ASSURANCE_ROUNDS,
  vendorAIAssuranceScore,
} from "./vendor-ai-assurance-game";
import {
  TRANSPARENCY_DISCLOSURE_ASSURANCE_ROUNDS,
  transparencyDisclosureAssuranceScore,
} from "./transparency-disclosure-assurance-game";
import {
  PRIVACY_MINIMIZATION_ASSURANCE_ROUNDS,
  privacyMinimizationAssuranceScore,
} from "./privacy-minimization-assurance-game";
import {
  INVENTORY_RISK_CLASSIFICATION_ROUNDS,
  inventoryRiskClassificationScore,
} from "./inventory-risk-classification-game";
import {
  GUARDRAIL_TUNING_ASSURANCE_ROUNDS,
  guardrailTuningAssuranceScore,
} from "./guardrail-tuning-assurance-game";
import {
  PERFORMANCE_DRIFT_ASSURANCE_ROUNDS,
  performanceDriftAssuranceScore,
} from "./performance-drift-assurance-game";
import {
  HUMAN_FACTORS_USABILITY_ASSURANCE_ROUNDS,
  humanFactorsUsabilityAssuranceScore,
} from "./human-factors-usability-assurance-game";
import {
  MODEL_DOCUMENTATION_TRANSPARENCY_ROUNDS,
  modelDocumentationTransparencyScore,
} from "./model-documentation-transparency-game";
import {
  DATA_QUALITY_INTEGRITY_ASSURANCE_ROUNDS,
  dataQualityIntegrityAssuranceScore,
} from "./data-quality-integrity-assurance-game";
import {
  SAFETY_MISUSE_ASSURANCE_ROUNDS,
  safetyMisuseAssuranceScore,
} from "./safety-misuse-assurance-game";
import {
  GUARDRAIL_EXCEPTION_ASSURANCE_ROUNDS,
  guardrailExceptionAssuranceScore,
} from "./guardrail-exception-assurance-game";
import {
  DATA_RIGHTS_LICENSING_ASSURANCE_ROUNDS,
  dataRightsLicensingAssuranceScore,
} from "./data-rights-licensing-assurance-game";
import {
  GUARDRAIL_CONFIG_ASSURANCE_ROUNDS,
  guardrailConfigAssuranceScore,
} from "./guardrail-config-assurance-game";
import { ASSURANCE_CADENCE_ROUNDS, assuranceCadenceScore } from "./assurance-cadence-game";
import {
  RISK_APPETITE_ASSURANCE_ROUNDS,
  riskAppetiteAssuranceScore,
} from "./risk-appetite-assurance-game";
import { EVAL_INTEGRITY_ROUNDS, evalIntegrityScore } from "./eval-integrity-game";
import {
  INTAKE_ONBOARDING_ROUNDS,
  intakeOnboardingScore,
} from "./intake-onboarding-game";
import { OPERATING_MODEL_ROUNDS, operatingModelScore } from "./operating-model-game";
import {
  AGENTIC_GUARDRAILS_ROUNDS,
  agenticGuardrailsScore,
} from "./agentic-guardrails-game";
import {
  NEAR_MISS_REPORTING_ROUNDS,
  nearMissReportingScore,
} from "./near-miss-reporting-game";
import { RISK_REGISTER_ROUNDS, riskRegisterScore } from "./risk-register-game";
import { OUTPUT_IP_ROUNDS, outputIpScore } from "./output-ip-game";
import {
  OVERSIGHT_CAPACITY_ROUNDS,
  oversightCapacityScore,
} from "./oversight-capacity-game";
import { GOVERNANCE_METRICS_ROUNDS, governanceMetricsScore } from "./governance-metrics-game";
import {
  PRODUCTION_TESTING_ROUNDS,
  productionTestingScore,
} from "./production-testing-game";
import { MODEL_DEPRECATION_ROUNDS, modelDeprecationScore } from "./model-deprecation-game";
import { BOARD_OVERSIGHT_ROUNDS, boardOversightScore } from "./board-oversight-game";
import { INCIDENT_SEVERITY_ROUNDS, incidentSeverityScore } from "./incident-severity-game";
import { SECRETS_HYGIENE_ROUNDS, secretsHygieneScore } from "./secrets-hygiene-game";
import { EVIDENCE_PACK_ROUNDS, evidencePackScore } from "./evidence-pack-game";
import { PROMPT_INJECTION_ROUNDS, promptInjectionScore } from "./prompt-injection-game";
import { SYNTHETIC_DATA_ROUNDS, syntheticDataScore } from "./synthetic-data-game";
import { MODEL_SELECTION_ROUNDS, modelSelectionScore } from "./model-selection-game";
import { ENV_IMPACT_ROUNDS, envImpactScore } from "./env-impact-game";
import { TABLETOP_ROUNDS, tabletopScore } from "./tabletop-game";
import { AGENT_MEMORY_ROUNDS, agentMemoryScore } from "./agent-memory-game";
import { INCENTIVE_ROUNDS, incentiveAlignmentScore } from "./incentive-alignment-game";
import { PROVIDER_TERMS_ROUNDS, providerTermsScore } from "./provider-terms-game";
import { REGULATOR_INQUIRY_ROUNDS, regulatorInquiryScore } from "./regulator-inquiry-game";
import { INCIDENT_EVIDENCE_ROUNDS, incidentEvidenceScore } from "./incident-evidence-game";
import { DATA_SUBJECT_REQUEST_ROUNDS, dataSubjectRequestScore } from "./data-subject-request-game";
import { COST_ALLOCATION_ROUNDS, costAllocationScore } from "./cost-allocation-game";
import { SHADOW_AI_ROUNDS, shadowAiScore } from "./shadow-ai-game";
import { RAG_GROUNDING_ROUNDS, ragGroundingScore } from "./rag-grounding-game";
import { ASSURANCE_CASE_ROUNDS, assuranceCaseScore } from "./assurance-case-game";
import { PROMPT_GOVERNANCE_ROUNDS, promptGovernanceScore } from "./prompt-governance-game";
import { VULN_MANAGEMENT_ROUNDS, vulnManagementScore } from "./vuln-management-game";
import { DATA_RESIDENCY_ROUNDS, dataResidencyScore } from "./data-residency-game";
import { AGENT_EVALUATION_ROUNDS, agentEvaluationScore } from "./agent-evaluation-game";
import { CONTENT_PROVENANCE_ROUNDS, contentProvenanceScore } from "./content-provenance-game";
import { TEST_ISOLATION_ROUNDS, testIsolationScore } from "./test-isolation-game";
import { VALUE_REALISATION_ROUNDS, valueRealisationScore } from "./value-realisation-game";
import { AUDIT_RIGHTS_ROUNDS, auditRightsScore } from "./audit-rights-game";
import { CONSENT_WITHDRAWAL_ROUNDS, consentWithdrawalScore } from "./consent-withdrawal-game";
import { COMPLAINT_FEEDBACK_ROUNDS, complaintFeedbackScore } from "./complaint-feedback-game";
import { RISK_TRANSFER_ROUNDS, riskTransferScore } from "./risk-transfer-game";
import {
  ASSURANCE_INDEPENDENCE_ROUNDS,
  assuranceIndependenceScore,
} from "./assurance-independence-game";
import { REGULATORY_HORIZON_ROUNDS, regulatoryHorizonScore } from "./regulatory-horizon-game";
import { OUTPUT_SAMPLING_ROUNDS, outputSamplingScore } from "./output-sampling-game";
import {
  CLAIMS_SUBSTANTIATION_ROUNDS,
  claimsSubstantiationScore,
} from "./claims-substantiation-game";
import { WORKER_MONITORING_ROUNDS, workerMonitoringScore } from "./worker-monitoring-game";
import { RESEARCH_ETHICS_ROUNDS, researchEthicsScore } from "./research-ethics-game";
import { SPEAK_UP_ROUNDS, speakUpScore } from "./speak-up-game";
import { HIRING_SCREENING_ROUNDS, hiringScreeningScore } from "./hiring-screening-game";
import {
  ANNOTATION_WORKFORCE_ROUNDS,
  annotationWorkforceScore,
} from "./annotation-workforce-game";
import { AI_HANDOVER_ROUNDS, aiHandoverScore } from "./ai-handover-game";
import { MULTILINGUAL_ROUNDS, multilingualScore } from "./multilingual-assurance-game";
import { CODING_ASSISTANTS_ROUNDS, codingAssistantsScore } from "./coding-assistants-game";
import { MA_DILIGENCE_ROUNDS, maDiligenceScore } from "./ma-diligence-game";
import { CHILDREN_AGE_ROUNDS, childrenAgeScore } from "./children-age-assurance-game";
import { WORKER_CONSULTATION_ROUNDS, workerConsultationScore } from "./worker-consultation-game";
import { SUMMARISATION_RECORDS_ROUNDS, summarisationRecordsScore } from "./summarisation-records-game";
import { REGULATED_ADVICE_ROUNDS, regulatedAdviceScore } from "./regulated-advice-game";
import { PUBLIC_SECTOR_FAIRNESS_ROUNDS, publicSectorFairnessScore } from "./public-sector-fairness-game";
import { ALGORITHMIC_PRICING_ROUNDS, algorithmicPricingScore } from "./algorithmic-pricing-game";
import { EXPORT_CONTROLS_ROUNDS, exportControlsScore } from "./export-controls-game";
import { VULNERABLE_CUSTOMER_ROUNDS, vulnerableCustomerScore } from "./vulnerable-customers-game";
import { EDUCATION_INTEGRITY_ROUNDS, educationIntegrityScore } from "./education-integrity-game";
import { INSURANCE_AI_ROUNDS, insuranceAiScore } from "./insurance-ai-game";
import { INCIDENT_NOTIFICATION_ROUNDS, incidentNotificationScore } from "./incident-notification-game";
import { ELECTIONS_INTEGRITY_ROUNDS, electionsIntegrityScore } from "./elections-integrity-game";
import { JOURNALISM_INTEGRITY_ROUNDS, journalismIntegrityScore } from "./journalism-integrity-game";
import {
  CLINICAL_DOCUMENTATION_ROUNDS,
  clinicalDocumentationScore,
} from "./clinical-documentation-game";
import { EDISCOVERY_ROUNDS, eDiscoveryScore } from "./ediscovery-game";
import {
  CRITICAL_INFRASTRUCTURE_ROUNDS,
  criticalInfrastructureScore,
} from "./critical-infrastructure-game";
import { TENANT_SCREENING_ROUNDS, tenantScreeningScore } from "./tenant-screening-game";
import { AGRI_FOOD_ROUNDS, agriFoodScore } from "./agri-food-game";
import { CONSTRUCTION_ROUNDS, constructionScore } from "./construction-game";
import {
  EMERGENCY_RESPONSE_ROUNDS,
  emergencyResponseScore,
} from "./emergency-response-game";
import {
  OFFICIAL_STATISTICS_ROUNDS,
  officialStatisticsScore,
} from "./official-statistics-game";
import {
  TELECOM_OPERATIONS_ROUNDS,
  telecomOperationsScore,
} from "./telecom-operations-game";
import {
  AVIATION_AIR_TRAFFIC_ROUNDS,
  aviationAirTrafficScore,
} from "./aviation-air-traffic-game";
import {
  MARITIME_PORT_OPERATIONS_ROUNDS,
  maritimePortOperationsScore,
} from "./maritime-port-operations-game";
import {
  PHARMA_CLINICAL_TRIALS_ROUNDS,
  pharmaClinicalTrialsScore,
} from "./pharma-clinical-trials-game";
import {
  HUMANITARIAN_AID_ALLOCATION_ROUNDS,
  humanitarianAidAllocationScore,
} from "./humanitarian-aid-allocation-game";
import {
  WATER_WASTEWATER_OPERATIONS_ROUNDS,
  waterWastewaterOperationsScore,
} from "./water-wastewater-operations-game";
import {
  BORDER_IMMIGRATION_SCREENING_ROUNDS,
  borderImmigrationScreeningScore,
} from "./border-immigration-screening-game";
import {
  RAILWAY_SIGNALLING_OPERATIONS_ROUNDS,
  railwaySignallingOperationsScore,
} from "./railway-signalling-operations-game";
import {
  MINING_EXTRACTIVE_SAFETY_ROUNDS,
  miningExtractiveSafetyScore,
} from "./mining-extractive-safety-game";
import {
  PHARMA_MANUFACTURING_QUALITY_ROUNDS,
  pharmaManufacturingQualityScore,
} from "./pharma-manufacturing-quality-game";
import {
  CUSTOMS_CARGO_TRADE_SCREENING_ROUNDS,
  customsCargoTradeScreeningScore,
} from "./customs-cargo-trade-screening-game";
import {
  WASTE_RECYCLING_OPERATIONS_ROUNDS,
  wasteRecyclingOperationsScore,
} from "./waste-recycling-operations-game";
import {
  ARCHIVES_HERITAGE_DIGITISATION_ROUNDS,
  archivesHeritageDigitisationScore,
} from "./archives-heritage-digitisation-game";
import {
  PUBLIC_TRANSPORT_OPERATIONS_ROUNDS,
  publicTransportOperationsScore,
} from "./public-transport-operations-game";
import {
  LABORATORY_RESEARCH_SAFETY_ROUNDS,
  laboratoryResearchSafetyScore,
} from "./laboratory-research-safety-game";
import {
  FORESTRY_WILDFIRE_LAND_MANAGEMENT_ROUNDS,
  forestryWildfireLandManagementScore,
} from "./forestry-wildfire-land-management-game";
import {
  AIRPORT_PORT_GROUND_OPERATIONS_ROUNDS,
  airportPortGroundOperationsScore,
} from "./airport-port-ground-operations-game";
import {
  PUBLIC_LIBRARIES_KNOWLEDGE_ACCESS_ROUNDS,
  publicLibrariesKnowledgeAccessScore,
} from "./public-libraries-knowledge-access-game";
import {
  SPORTS_OFFICIATING_COMPETITION_INTEGRITY_ROUNDS,
  sportsOfficiatingCompetitionIntegrityScore,
} from "./sports-officiating-competition-integrity-game";
import {
  VETERINARY_ANIMAL_WELFARE_ROUNDS,
  veterinaryAnimalWelfareScore,
} from "./veterinary-animal-welfare-game";
import {
  CEMETERIES_FUNERARY_BEREAVEMENT_SERVICES_ROUNDS,
  cemeteriesFuneraryBereavementServicesScore,
} from "./cemeteries-funerary-bereavement-services-game";
import {
  TICKETING_VENUE_ACCESS_ROUNDS,
  ticketingVenueAccessScore,
} from "./ticketing-venue-access-game";
import {
  PARKING_CURB_MANAGEMENT_ROUNDS,
  parkingCurbManagementScore,
} from "./parking-curb-management-game";
import {
  LARGE_EVENT_CROWD_SAFETY_ROUNDS,
  largeEventCrowdSafetyScore,
} from "./large-event-crowd-safety-game";
import {
  SELF_STORAGE_PROPERTY_ACCESS_ROUNDS,
  selfStoragePropertyAccessScore,
} from "./self-storage-property-access-game";
import {
  LAUNDRY_GARMENT_CARE_ROUNDS,
  laundryGarmentCareScore,
} from "./laundry-garment-care-game";
import {
  CAR_WASH_VEHICLE_DETAILING_ROUNDS,
  carWashVehicleDetailingScore,
} from "./car-wash-vehicle-detailing-game";
import {
  MOVING_RELOCATION_HOUSEHOLD_GOODS_ROUNDS,
  movingRelocationHouseholdGoodsScore,
} from "./moving-relocation-household-goods-game";
import {
  PET_BOARDING_DAYCARE_GROOMING_ROUNDS,
  petBoardingDaycareGroomingScore,
} from "./pet-boarding-daycare-grooming-game";
import {
  VEHICLE_VALET_PARKING_ATTENDANT_ROUNDS,
  vehicleValetParkingAttendantScore,
} from "./vehicle-valet-parking-attendant-game";
import {
  EQUIPMENT_TOOL_RENTAL_ROUNDS,
  equipmentToolRentalScore,
} from "./equipment-tool-rental-game";
import {
  SELF_SERVICE_LAUNDROMAT_SMART_LOCKER_ROUNDS,
  selfServiceLaundromatSmartLockerScore,
} from "./self-service-laundromat-smart-locker-game";
import {
  BICYCLE_MICROMOBILITY_RENTAL_SHARE_ROUNDS,
  bicycleMicromobilityRentalShareScore,
} from "./bicycle-micromobility-rental-share-game";
import {
  COWORKING_FLEXIBLE_WORKSPACE_ACCESS_ROUNDS,
  coworkingFlexibleWorkspaceAccessScore,
} from "./coworking-flexible-workspace-access-game";

const statusText = {
  complete: "Complete",
  action: "Action needed",
  "not-applicable": "No active records",
};

export function ChecklistScreen() {
  const [inclusionAnswers, setInclusionAnswers] = useState<Record<string, number>>({});
  const [evidenceAnswers, setEvidenceAnswers] = useState<Record<string, string>>({});
  const [redTeamAnswers, setRedTeamAnswers] = useState<Record<string, number>>({});
  const [changeSelections, setChangeSelections] = useState<Record<string, string[]>>({});
  const [changeSubmitted, setChangeSubmitted] = useState<Record<string, boolean>>({});
  const [vendorAnswers, setVendorAnswers] = useState<Record<string, number>>({});
  const [tabletopAnswers, setTabletopAnswers] = useState<Record<string, number>>({});
  const [crosswalkAnswers, setCrosswalkAnswers] = useState<Record<string, number>>({});
  const [guardrailAnswers, setGuardrailAnswers] = useState<Record<string, number>>({});
  const [monitoringAnswers, setMonitoringAnswers] = useState<Record<string, number>>({});
  const [releaseGateAnswers, setReleaseGateAnswers] = useState<Record<string, number>>({});
  const [correctiveAnswers, setCorrectiveAnswers] = useState<Record<string, number>>({});
  const [riskAcceptanceAnswers, setRiskAcceptanceAnswers] = useState<Record<string, number>>({});
  const [oversightAnswers, setOversightAnswers] = useState<Record<string, number>>({});
  const [dataGovernanceAnswers, setDataGovernanceAnswers] = useState<Record<string, number>>({});
  const [transparencyAnswers, setTransparencyAnswers] = useState<Record<string, number>>({});
  const [supplyChainAnswers, setSupplyChainAnswers] = useState<Record<string, number>>({});
  const [securityAnswers, setSecurityAnswers] = useState<Record<string, number>>({});
  const [fairnessAnswers, setFairnessAnswers] = useState<Record<string, number>>({});
  const [improvementAnswers, setImprovementAnswers] = useState<Record<string, number>>({});
  const [policyAnswers, setPolicyAnswers] = useState<Record<string, number>>({});
  const [changeAnswers, setChangeAnswers] = useState<Record<string, number>>({});
  const [accountabilityAnswers, setAccountabilityAnswers] = useState<Record<string, number>>({});
  const [trainingAnswers, setTrainingAnswers] = useState<Record<string, number>>({});
  const [reportingAnswers, setReportingAnswers] = useState<Record<string, number>>({});
  const [continuityAnswers, setContinuityAnswers] = useState<Record<string, number>>({});
  const [recourseAnswers, setRecourseAnswers] = useState<Record<string, number>>({});
  const [efficiencyAnswers, setEfficiencyAnswers] = useState<Record<string, number>>({});
  const [testingAnswers, setTestingAnswers] = useState<Record<string, number>>({});
  const [boundaryAnswers, setBoundaryAnswers] = useState<Record<string, number>>({});
  const [qualityAnswers, setQualityAnswers] = useState<Record<string, number>>({});
  const [loggingAnswers, setLoggingAnswers] = useState<Record<string, number>>({});
  const [accessAnswers, setAccessAnswers] = useState<Record<string, number>>({});
  const [configAnswers, setConfigAnswers] = useState<Record<string, number>>({});
  const [safetyAnswers, setSafetyAnswers] = useState<Record<string, number>>({});
  const [serviceAnswers, setServiceAnswers] = useState<Record<string, number>>({});
  const [explainabilityAnswers, setExplainabilityAnswers] = useState<Record<string, number>>({});
  const [retentionAnswers, setRetentionAnswers] = useState<Record<string, number>>({});
  const [ethicsAnswers, setEthicsAnswers] = useState<Record<string, number>>({});
  const [procurementAnswers, setProcurementAnswers] = useState<Record<string, number>>({});
  const [labelingAnswers, setLabelingAnswers] = useState<Record<string, number>>({});
  const [incidentCommsAnswers, setIncidentCommsAnswers] = useState<Record<string, number>>({});
  const [retirementAnswers, setRetirementAnswers] = useState<Record<string, number>>({});
  const [literacyAnswers, setLiteracyAnswers] = useState<Record<string, number>>({});
  const [handoffAnswers, setHandoffAnswers] = useState<Record<string, number>>({});
  const [vendorAssuranceAnswers, setVendorAssuranceAnswers] = useState<Record<string, number>>({});
  const [disclosureAnswers, setDisclosureAnswers] = useState<Record<string, number>>({});
  const [privacyAnswers, setPrivacyAnswers] = useState<Record<string, number>>({});
  const [inventoryAnswers, setInventoryAnswers] = useState<Record<string, number>>({});
  const [tuningAnswers, setTuningAnswers] = useState<Record<string, number>>({});
  const [driftAnswers, setDriftAnswers] = useState<Record<string, number>>({});
  const [usabilityAnswers, setUsabilityAnswers] = useState<Record<string, number>>({});
  const [documentationAnswers, setDocumentationAnswers] = useState<Record<string, number>>({});
  const [dataQualityAnswers, setDataQualityAnswers] = useState<Record<string, number>>({});
  const [misuseAnswers, setMisuseAnswers] = useState<Record<string, number>>({});
  const [exceptionAnswers, setExceptionAnswers] = useState<Record<string, number>>({});
  const [rightsAnswers, setRightsAnswers] = useState<Record<string, number>>({});
  const [guardrailConfigAnswers, setGuardrailConfigAnswers] = useState<Record<string, number>>({});
  const [cadenceAnswers, setCadenceAnswers] = useState<Record<string, number>>({});
  const [appetiteAnswers, setAppetiteAnswers] = useState<Record<string, number>>({});
  const [evalIntegrityAnswers, setEvalIntegrityAnswers] = useState<Record<string, number>>({});
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, number>>({});
  const [operatingModelAnswers, setOperatingModelAnswers] = useState<Record<string, number>>({});
  const [agenticGuardrailsAnswers, setAgenticGuardrailsAnswers] = useState<Record<string, number>>({});
  const [nearMissAnswers, setNearMissAnswers] = useState<Record<string, number>>({});
  const [riskRegisterAnswers, setRiskRegisterAnswers] = useState<Record<string, number>>({});
  const [outputIpAnswers, setOutputIpAnswers] = useState<Record<string, number>>({});
  const [oversightCapacityAnswers, setOversightCapacityAnswers] = useState<Record<string, number>>({});
  const [metricsAnswers, setMetricsAnswers] = useState<Record<string, number>>({});
  const [productionTestingAnswers, setProductionTestingAnswers] = useState<Record<string, number>>({});
  const [deprecationAnswers, setDeprecationAnswers] = useState<Record<string, number>>({});
  const [boardOversightAnswers, setBoardOversightAnswers] = useState<Record<string, number>>({});
  const [incidentSeverityAnswers, setIncidentSeverityAnswers] = useState<Record<string, number>>({});
  const [secretsAnswers, setSecretsAnswers] = useState<Record<string, number>>({});
  const [evidencePackAnswers, setEvidencePackAnswers] = useState<Record<string, number>>({});
  const [promptInjectionAnswers, setPromptInjectionAnswers] = useState<Record<string, number>>({});
  const [syntheticDataAnswers, setSyntheticDataAnswers] = useState<Record<string, number>>({});
  const [modelSelectionAnswers, setModelSelectionAnswers] = useState<Record<string, number>>({});
  const [envImpactAnswers, setEnvImpactAnswers] = useState<Record<string, number>>({});
  const [assuranceTabletopAnswers, setAssuranceTabletopAnswers] = useState<
    Record<string, number>
  >({});
  const [agentMemoryAnswers, setAgentMemoryAnswers] = useState<Record<string, number>>({});
  const [incentiveAnswers, setIncentiveAnswers] = useState<Record<string, number>>({});
  const [providerTermsAnswers, setProviderTermsAnswers] = useState<Record<string, number>>({});
  const [regulatorInquiryAnswers, setRegulatorInquiryAnswers] = useState<Record<string, number>>(
    {},
  );
  const [incidentEvidenceAnswers, setIncidentEvidenceAnswers] = useState<Record<string, number>>(
    {},
  );
  const [dataSubjectRequestAnswers, setDataSubjectRequestAnswers] = useState<
    Record<string, number>
  >({});
  const [costAllocationAnswers, setCostAllocationAnswers] = useState<Record<string, number>>({});
  const [shadowAiAnswers, setShadowAiAnswers] = useState<Record<string, number>>({});
  const [ragGroundingAnswers, setRagGroundingAnswers] = useState<Record<string, number>>({});
  const [assuranceCaseAnswers, setAssuranceCaseAnswers] = useState<Record<string, number>>({});
  const [promptGovernanceAnswers, setPromptGovernanceAnswers] = useState<Record<string, number>>(
    {},
  );
  const [vulnManagementAnswers, setVulnManagementAnswers] = useState<Record<string, number>>({});
  const [dataResidencyAnswers, setDataResidencyAnswers] = useState<Record<string, number>>({});
  const [agentEvaluationAnswers, setAgentEvaluationAnswers] = useState<Record<string, number>>({});
  const [contentProvenanceAnswers, setContentProvenanceAnswers] = useState<Record<string, number>>(
    {},
  );
  const [testIsolationAnswers, setTestIsolationAnswers] = useState<Record<string, number>>({});
  const [valueRealisationAnswers, setValueRealisationAnswers] = useState<Record<string, number>>({});
  const [auditRightsAnswers, setAuditRightsAnswers] = useState<Record<string, number>>({});
  const [consentWithdrawalAnswers, setConsentWithdrawalAnswers] = useState<Record<string, number>>(
    {},
  );
  const [complaintFeedbackAnswers, setComplaintFeedbackAnswers] = useState<Record<string, number>>(
    {},
  );
  const [riskTransferAnswers, setRiskTransferAnswers] = useState<Record<string, number>>({});
  const [assuranceIndependenceAnswers, setAssuranceIndependenceAnswers] = useState<
    Record<string, number>
  >({});
  const [regulatoryHorizonAnswers, setRegulatoryHorizonAnswers] = useState<Record<string, number>>(
    {},
  );
  const [outputSamplingAnswers, setOutputSamplingAnswers] = useState<Record<string, number>>({});
  const [claimsSubstantiationAnswers, setClaimsSubstantiationAnswers] = useState<
    Record<string, number>
  >({});
  const [workerMonitoringAnswers, setWorkerMonitoringAnswers] = useState<Record<string, number>>({});
  const [researchEthicsAnswers, setResearchEthicsAnswers] = useState<Record<string, number>>({});
  const [speakUpAnswers, setSpeakUpAnswers] = useState<Record<string, number>>({});
  const [hiringScreeningAnswers, setHiringScreeningAnswers] = useState<Record<string, number>>({});
  const [annotationWorkforceAnswers, setAnnotationWorkforceAnswers] = useState<
    Record<string, number>
  >({});
  const [aiHandoverAnswers, setAiHandoverAnswers] = useState<Record<string, number>>({});
  const [multilingualAnswers, setMultilingualAnswers] = useState<Record<string, number>>({});
  const [codingAssistantsAnswers, setCodingAssistantsAnswers] = useState<Record<string, number>>(
    {},
  );
  const [maDiligenceAnswers, setMaDiligenceAnswers] = useState<Record<string, number>>({});
  const [childrenAgeAnswers, setChildrenAgeAnswers] = useState<Record<string, number>>({});
  const [workerConsultationAnswers, setWorkerConsultationAnswers] = useState<
    Record<string, number>
  >({});
  const [summarisationRecordsAnswers, setSummarisationRecordsAnswers] = useState<
    Record<string, number>
  >({});
  const [regulatedAdviceAnswers, setRegulatedAdviceAnswers] = useState<Record<string, number>>({});
  const [publicSectorFairnessAnswers, setPublicSectorFairnessAnswers] = useState<
    Record<string, number>
  >({});
  const [algorithmicPricingAnswers, setAlgorithmicPricingAnswers] = useState<
    Record<string, number>
  >({});
  const [exportControlsAnswers, setExportControlsAnswers] = useState<Record<string, number>>({});
  const [vulnerableCustomerAnswers, setVulnerableCustomerAnswers] = useState<
    Record<string, number>
  >({});
  const [educationIntegrityAnswers, setEducationIntegrityAnswers] = useState<
    Record<string, number>
  >({});
  const [insuranceAiAnswers, setInsuranceAiAnswers] = useState<Record<string, number>>({});
  const [incidentNotificationAnswers, setIncidentNotificationAnswers] = useState<
    Record<string, number>
  >({});
  const [electionsIntegrityAnswers, setElectionsIntegrityAnswers] = useState<
    Record<string, number>
  >({});
  const [journalismIntegrityAnswers, setJournalismIntegrityAnswers] = useState<
    Record<string, number>
  >({});
  const [clinicalDocumentationAnswers, setClinicalDocumentationAnswers] = useState<
    Record<string, number>
  >({});
  const [ediscoveryAnswers, setEdiscoveryAnswers] = useState<Record<string, number>>({});
  const [criticalInfrastructureAnswers, setCriticalInfrastructureAnswers] = useState<
    Record<string, number>
  >({});
  const [tenantScreeningAnswers, setTenantScreeningAnswers] = useState<Record<string, number>>({});
  const [agriFoodAnswers, setAgriFoodAnswers] = useState<Record<string, number>>({});
  const [constructionAnswers, setConstructionAnswers] = useState<Record<string, number>>({});
  const [emergencyResponseAnswers, setEmergencyResponseAnswers] = useState<
    Record<string, number>
  >({});
  const [officialStatisticsAnswers, setOfficialStatisticsAnswers] = useState<
    Record<string, number>
  >({});
  const [telecomOperationsAnswers, setTelecomOperationsAnswers] = useState<
    Record<string, number>
  >({});
  const [aviationAirTrafficAnswers, setAviationAirTrafficAnswers] = useState<
    Record<string, number>
  >({});
  const [maritimePortOperationsAnswers, setMaritimePortOperationsAnswers] = useState<
    Record<string, number>
  >({});
  const [pharmaClinicalTrialsAnswers, setPharmaClinicalTrialsAnswers] = useState<
    Record<string, number>
  >({});
  const [humanitarianAidAllocationAnswers, setHumanitarianAidAllocationAnswers] = useState<
    Record<string, number>
  >({});
  const [waterWastewaterOperationsAnswers, setWaterWastewaterOperationsAnswers] = useState<
    Record<string, number>
  >({});
  const [borderImmigrationScreeningAnswers, setBorderImmigrationScreeningAnswers] = useState<
    Record<string, number>
  >({});
  const [railwaySignallingOperationsAnswers, setRailwaySignallingOperationsAnswers] = useState<
    Record<string, number>
  >({});
  const [miningExtractiveSafetyAnswers, setMiningExtractiveSafetyAnswers] = useState<
    Record<string, number>
  >({});
  const [pharmaManufacturingQualityAnswers, setPharmaManufacturingQualityAnswers] = useState<
    Record<string, number>
  >({});
  const [customsCargoTradeScreeningAnswers, setCustomsCargoTradeScreeningAnswers] = useState<
    Record<string, number>
  >({});
  const [wasteRecyclingOperationsAnswers, setWasteRecyclingOperationsAnswers] = useState<
    Record<string, number>
  >({});
  const [archivesHeritageDigitisationAnswers, setArchivesHeritageDigitisationAnswers] = useState<
    Record<string, number>
  >({});
  const [publicTransportOperationsAnswers, setPublicTransportOperationsAnswers] = useState<
    Record<string, number>
  >({});
  const [laboratoryResearchSafetyAnswers, setLaboratoryResearchSafetyAnswers] = useState<
    Record<string, number>
  >({});
  const [forestryWildfireLandManagementAnswers, setForestryWildfireLandManagementAnswers] = useState<
    Record<string, number>
  >({});
  const [airportPortGroundOperationsAnswers, setAirportPortGroundOperationsAnswers] = useState<
    Record<string, number>
  >({});
  const [publicLibrariesKnowledgeAccessAnswers, setPublicLibrariesKnowledgeAccessAnswers] = useState<
    Record<string, number>
  >({});
  const [sportsOfficiatingCompetitionIntegrityAnswers, setSportsOfficiatingCompetitionIntegrityAnswers] = useState<
    Record<string, number>
  >({});
  const [veterinaryAnimalWelfareAnswers, setVeterinaryAnimalWelfareAnswers] = useState<
    Record<string, number>
  >({});
  const [cemeteriesFuneraryBereavementServicesAnswers, setCemeteriesFuneraryBereavementServicesAnswers] = useState<
    Record<string, number>
  >({});
  const [ticketingVenueAccessAnswers, setTicketingVenueAccessAnswers] = useState<
    Record<string, number>
  >({});
  const [parkingCurbManagementAnswers, setParkingCurbManagementAnswers] = useState<
    Record<string, number>
  >({});
  const [largeEventCrowdSafetyAnswers, setLargeEventCrowdSafetyAnswers] = useState<
    Record<string, number>
  >({});
  const [selfStoragePropertyAccessAnswers, setSelfStoragePropertyAccessAnswers] = useState<
    Record<string, number>
  >({});
  const [laundryGarmentCareAnswers, setLaundryGarmentCareAnswers] = useState<
    Record<string, number>
  >({});
  const [carWashVehicleDetailingAnswers, setCarWashVehicleDetailingAnswers] = useState<
    Record<string, number>
  >({});
  const [movingRelocationHouseholdGoodsAnswers, setMovingRelocationHouseholdGoodsAnswers] = useState<
    Record<string, number>
  >({});
  const [petBoardingDaycareGroomingAnswers, setPetBoardingDaycareGroomingAnswers] = useState<
    Record<string, number>
  >({});
  const [vehicleValetParkingAttendantAnswers, setVehicleValetParkingAttendantAnswers] = useState<
    Record<string, number>
  >({});
  const [equipmentToolRentalAnswers, setEquipmentToolRentalAnswers] = useState<
    Record<string, number>
  >({});
  const [selfServiceLaundromatSmartLockerAnswers, setSelfServiceLaundromatSmartLockerAnswers] = useState<
    Record<string, number>
  >({});
  const [bicycleMicromobilityRentalShareAnswers, setBicycleMicromobilityRentalShareAnswers] = useState<
    Record<string, number>
  >({});
  const [coworkingFlexibleWorkspaceAccessAnswers, setCoworkingFlexibleWorkspaceAccessAnswers] = useState<
    Record<string, number>
  >({});
  const { state } = useGovernance();
  const phases = buildLifecycleChecklist(state);
  const progress = checklistProgress(phases);
  const milestones = governanceMilestones(phases);
  const vendorScore = vendorChallengeScore(vendorAnswers);
  const tabletop = tabletopResult(tabletopAnswers);
  const crosswalk = crosswalkScore(crosswalkAnswers);
  const evidenceGame = evidenceDetectiveScore(evidenceAnswers);
  const redTeam = redTeamScore(redTeamAnswers);
  const challenge = nextGovernanceChallenge(phases);
  const inclusionScore = inclusiveDesignScore(inclusionAnswers);
  const guardrailGame = guardrailAssuranceScore(guardrailAnswers);
  const monitoringGame = monitoringAssuranceScore(monitoringAnswers);
  const releaseGateGame = releaseGateAssuranceScore(releaseGateAnswers);
  const correctiveGame = correctiveActionAssuranceScore(correctiveAnswers);
  const riskAcceptanceGame = riskAcceptanceAssuranceScore(riskAcceptanceAnswers);
  const oversightGame = humanOversightAssuranceScore(oversightAnswers);
  const dataGovernanceGame = dataGovernanceAssuranceScore(dataGovernanceAnswers);
  const transparencyGame = transparencyRecordkeepingScore(transparencyAnswers);
  const supplyChainGame = supplyChainAssuranceScore(supplyChainAnswers);
  const securityGame = securityRobustnessAssuranceScore(securityAnswers);
  const fairnessGame = fairnessImpactAssuranceScore(fairnessAnswers);
  const improvementGame = continuousImprovementAssuranceScore(improvementAnswers);
  const policyGame = policyAlignmentAssuranceScore(policyAnswers);
  const changeGame = changeDeploymentAssuranceScore(changeAnswers);
  const accountabilityGame = accountabilityRaciAssuranceScore(accountabilityAnswers);
  const trainingGame = trainingAwarenessAssuranceScore(trainingAnswers);
  const reportingGame = stakeholderReportingAssuranceScore(reportingAnswers);
  const continuityGame = continuityResilienceAssuranceScore(continuityAnswers);
  const recourseGame = userRecourseContestabilityScore(recourseAnswers);
  const efficiencyGame = resourceEfficiencyAssuranceScore(efficiencyAnswers);
  const testingGame = testingValidationAssuranceScore(testingAnswers);
  const boundaryGame = purposeBoundaryAssuranceScore(boundaryAnswers);
  const qualityGame = outputQualityReliabilityScore(qualityAnswers);
  const loggingGame = loggingTraceabilityAssuranceScore(loggingAnswers);
  const accessGame = accessIdentityAssuranceScore(accessAnswers);
  const configGame = modelPromptConfigAssuranceScore(configAnswers);
  const safetyGame = contentSafetyMisuseAssuranceScore(safetyAnswers);
  const serviceGame = serviceLevelReliabilityAssuranceScore(serviceAnswers);
  const explainabilityGame = explainabilityInterpretabilityScore(explainabilityAnswers);
  const retentionGame = dataRetentionDeletionAssuranceScore(retentionAnswers);
  const ethicsGame = ethicalValuesAlignmentAssuranceScore(ethicsAnswers);
  const procurementGame = procurementContractingAssuranceScore(procurementAnswers);
  const labelingGame = dataLabelingQualityAssuranceScore(labelingAnswers);
  const incidentCommsGame = incidentCommunicationTabletopScore(incidentCommsAnswers);
  const retirementGame = decommissioningRetirementAssuranceScore(retirementAnswers);
  const literacyGame = aiLiteracyEnablementAssuranceScore(literacyAnswers);
  const handoffGame = humanAIHandoffAssuranceScore(handoffAnswers);
  const vendorGame = vendorAIAssuranceScore(vendorAssuranceAnswers);
  const disclosureGame = transparencyDisclosureAssuranceScore(disclosureAnswers);
  const privacyGame = privacyMinimizationAssuranceScore(privacyAnswers);
  const inventoryGame = inventoryRiskClassificationScore(inventoryAnswers);
  const tuningGame = guardrailTuningAssuranceScore(tuningAnswers);
  const driftGame = performanceDriftAssuranceScore(driftAnswers);
  const usabilityGame = humanFactorsUsabilityAssuranceScore(usabilityAnswers);
  const documentationGame = modelDocumentationTransparencyScore(documentationAnswers);
  const dataQualityGame = dataQualityIntegrityAssuranceScore(dataQualityAnswers);
  const misuseGame = safetyMisuseAssuranceScore(misuseAnswers);
  const exceptionGame = guardrailExceptionAssuranceScore(exceptionAnswers);
  const rightsGame = dataRightsLicensingAssuranceScore(rightsAnswers);
  const guardrailConfigGame = guardrailConfigAssuranceScore(guardrailConfigAnswers);
  const cadenceGame = assuranceCadenceScore(cadenceAnswers);
  const appetiteGame = riskAppetiteAssuranceScore(appetiteAnswers);
  const evalIntegrityGame = evalIntegrityScore(evalIntegrityAnswers);
  const intakeGame = intakeOnboardingScore(intakeAnswers);
  const operatingModelGame = operatingModelScore(operatingModelAnswers);
  const agenticGuardrailsGame = agenticGuardrailsScore(agenticGuardrailsAnswers);
  const nearMissGame = nearMissReportingScore(nearMissAnswers);
  const riskRegisterGame = riskRegisterScore(riskRegisterAnswers);
  const outputIpGame = outputIpScore(outputIpAnswers);
  const oversightCapacityGame = oversightCapacityScore(oversightCapacityAnswers);
  const metricsGame = governanceMetricsScore(metricsAnswers);
  const productionTestingGame = productionTestingScore(productionTestingAnswers);
  const deprecationGame = modelDeprecationScore(deprecationAnswers);
  const boardOversightGame = boardOversightScore(boardOversightAnswers);
  const incidentSeverityGame = incidentSeverityScore(incidentSeverityAnswers);
  const secretsGame = secretsHygieneScore(secretsAnswers);
  const evidencePackGame = evidencePackScore(evidencePackAnswers);
  const promptInjectionGame = promptInjectionScore(promptInjectionAnswers);
  const syntheticDataGame = syntheticDataScore(syntheticDataAnswers);
  const modelSelectionGame = modelSelectionScore(modelSelectionAnswers);
  const envImpactGame = envImpactScore(envImpactAnswers);
  const assuranceTabletopGame = tabletopScore(assuranceTabletopAnswers);
  const agentMemoryGame = agentMemoryScore(agentMemoryAnswers);
  const incentiveGame = incentiveAlignmentScore(incentiveAnswers);
  const providerTermsGame = providerTermsScore(providerTermsAnswers);
  const regulatorInquiryGame = regulatorInquiryScore(regulatorInquiryAnswers);
  const incidentEvidenceGame = incidentEvidenceScore(incidentEvidenceAnswers);
  const dataSubjectRequestGame = dataSubjectRequestScore(dataSubjectRequestAnswers);
  const costAllocationGame = costAllocationScore(costAllocationAnswers);
  const shadowAiGame = shadowAiScore(shadowAiAnswers);
  const ragGroundingGame = ragGroundingScore(ragGroundingAnswers);
  const assuranceCaseGame = assuranceCaseScore(assuranceCaseAnswers);
  const promptGovernanceGame = promptGovernanceScore(promptGovernanceAnswers);
  const vulnManagementGame = vulnManagementScore(vulnManagementAnswers);
  const dataResidencyGame = dataResidencyScore(dataResidencyAnswers);
  const agentEvaluationGame = agentEvaluationScore(agentEvaluationAnswers);
  const contentProvenanceGame = contentProvenanceScore(contentProvenanceAnswers);
  const testIsolationGame = testIsolationScore(testIsolationAnswers);
  const valueRealisationGame = valueRealisationScore(valueRealisationAnswers);
  const auditRightsGame = auditRightsScore(auditRightsAnswers);
  const consentWithdrawalGame = consentWithdrawalScore(consentWithdrawalAnswers);
  const complaintFeedbackGame = complaintFeedbackScore(complaintFeedbackAnswers);
  const riskTransferGame = riskTransferScore(riskTransferAnswers);
  const assuranceIndependenceGame = assuranceIndependenceScore(assuranceIndependenceAnswers);
  const regulatoryHorizonGame = regulatoryHorizonScore(regulatoryHorizonAnswers);
  const outputSamplingGame = outputSamplingScore(outputSamplingAnswers);
  const claimsSubstantiationGame = claimsSubstantiationScore(claimsSubstantiationAnswers);
  const workerMonitoringGame = workerMonitoringScore(workerMonitoringAnswers);
  const researchEthicsGame = researchEthicsScore(researchEthicsAnswers);
  const speakUpGame = speakUpScore(speakUpAnswers);
  const hiringScreeningGame = hiringScreeningScore(hiringScreeningAnswers);
  const annotationWorkforceGame = annotationWorkforceScore(annotationWorkforceAnswers);
  const aiHandoverGame = aiHandoverScore(aiHandoverAnswers);
  const multilingualGame = multilingualScore(multilingualAnswers);
  const codingAssistantsGame = codingAssistantsScore(codingAssistantsAnswers);
  const maDiligenceGame = maDiligenceScore(maDiligenceAnswers);
  const childrenAgeGame = childrenAgeScore(childrenAgeAnswers);
  const workerConsultationGame = workerConsultationScore(workerConsultationAnswers);
  const summarisationRecordsGame = summarisationRecordsScore(summarisationRecordsAnswers);
  const regulatedAdviceGame = regulatedAdviceScore(regulatedAdviceAnswers);
  const publicSectorFairnessGame = publicSectorFairnessScore(publicSectorFairnessAnswers);
  const algorithmicPricingGame = algorithmicPricingScore(algorithmicPricingAnswers);
  const exportControlsGame = exportControlsScore(exportControlsAnswers);
  const vulnerableCustomerGame = vulnerableCustomerScore(vulnerableCustomerAnswers);
  const educationIntegrityGame = educationIntegrityScore(educationIntegrityAnswers);
  const insuranceAiGame = insuranceAiScore(insuranceAiAnswers);
  const incidentNotificationGame = incidentNotificationScore(incidentNotificationAnswers);
  const electionsIntegrityGame = electionsIntegrityScore(electionsIntegrityAnswers);
  const journalismIntegrityGame = journalismIntegrityScore(journalismIntegrityAnswers);
  const clinicalDocumentationGame = clinicalDocumentationScore(clinicalDocumentationAnswers);
  const ediscoveryGame = eDiscoveryScore(ediscoveryAnswers);
  const criticalInfrastructureGame = criticalInfrastructureScore(criticalInfrastructureAnswers);
  const tenantScreeningGame = tenantScreeningScore(tenantScreeningAnswers);
  const agriFoodGame = agriFoodScore(agriFoodAnswers);
  const constructionGame = constructionScore(constructionAnswers);
  const emergencyResponseGame = emergencyResponseScore(emergencyResponseAnswers);
  const officialStatisticsGame = officialStatisticsScore(officialStatisticsAnswers);
  const telecomOperationsGame = telecomOperationsScore(telecomOperationsAnswers);
  const aviationAirTrafficGame = aviationAirTrafficScore(aviationAirTrafficAnswers);
  const maritimePortOperationsGame = maritimePortOperationsScore(maritimePortOperationsAnswers);
  const pharmaClinicalTrialsGame = pharmaClinicalTrialsScore(pharmaClinicalTrialsAnswers);
  const humanitarianAidAllocationGame = humanitarianAidAllocationScore(humanitarianAidAllocationAnswers);
  const waterWastewaterOperationsGame = waterWastewaterOperationsScore(waterWastewaterOperationsAnswers);
  const borderImmigrationScreeningGame = borderImmigrationScreeningScore(borderImmigrationScreeningAnswers);
  const railwaySignallingOperationsGame = railwaySignallingOperationsScore(railwaySignallingOperationsAnswers);
  const miningExtractiveSafetyGame = miningExtractiveSafetyScore(miningExtractiveSafetyAnswers);
  const pharmaManufacturingQualityGame = pharmaManufacturingQualityScore(
    pharmaManufacturingQualityAnswers,
  );
  const customsCargoTradeScreeningGame = customsCargoTradeScreeningScore(
    customsCargoTradeScreeningAnswers,
  );
  const wasteRecyclingOperationsGame = wasteRecyclingOperationsScore(
    wasteRecyclingOperationsAnswers,
  );
  const archivesHeritageDigitisationGame = archivesHeritageDigitisationScore(
    archivesHeritageDigitisationAnswers,
  );
  const publicTransportOperationsGame = publicTransportOperationsScore(
    publicTransportOperationsAnswers,
  );
  const laboratoryResearchSafetyGame = laboratoryResearchSafetyScore(
    laboratoryResearchSafetyAnswers,
  );
  const forestryWildfireLandManagementGame = forestryWildfireLandManagementScore(
    forestryWildfireLandManagementAnswers,
  );
  const airportPortGroundOperationsGame = airportPortGroundOperationsScore(
    airportPortGroundOperationsAnswers,
  );
  const publicLibrariesKnowledgeAccessGame = publicLibrariesKnowledgeAccessScore(
    publicLibrariesKnowledgeAccessAnswers,
  );
  const sportsOfficiatingCompetitionIntegrityGame = sportsOfficiatingCompetitionIntegrityScore(
    sportsOfficiatingCompetitionIntegrityAnswers,
  );
  const veterinaryAnimalWelfareGame = veterinaryAnimalWelfareScore(
    veterinaryAnimalWelfareAnswers,
  );
  const cemeteriesFuneraryBereavementServicesGame = cemeteriesFuneraryBereavementServicesScore(
    cemeteriesFuneraryBereavementServicesAnswers,
  );
  const ticketingVenueAccessGame = ticketingVenueAccessScore(
    ticketingVenueAccessAnswers,
  );
  const parkingCurbManagementGame = parkingCurbManagementScore(
    parkingCurbManagementAnswers,
  );
  const largeEventCrowdSafetyGame = largeEventCrowdSafetyScore(
    largeEventCrowdSafetyAnswers,
  );
  const selfStoragePropertyAccessGame = selfStoragePropertyAccessScore(
    selfStoragePropertyAccessAnswers,
  );
  const laundryGarmentCareGame = laundryGarmentCareScore(
    laundryGarmentCareAnswers,
  );
  const carWashVehicleDetailingGame = carWashVehicleDetailingScore(
    carWashVehicleDetailingAnswers,
  );
  const movingRelocationHouseholdGoodsGame = movingRelocationHouseholdGoodsScore(
    movingRelocationHouseholdGoodsAnswers,
  );
  const petBoardingDaycareGroomingGame = petBoardingDaycareGroomingScore(
    petBoardingDaycareGroomingAnswers,
  );
  const vehicleValetParkingAttendantGame = vehicleValetParkingAttendantScore(
    vehicleValetParkingAttendantAnswers,
  );
  const equipmentToolRentalGame = equipmentToolRentalScore(
    equipmentToolRentalAnswers,
  );
  const selfServiceLaundromatSmartLockerGame = selfServiceLaundromatSmartLockerScore(
    selfServiceLaundromatSmartLockerAnswers,
  );
  const bicycleMicromobilityRentalShareGame = bicycleMicromobilityRentalShareScore(
    bicycleMicromobilityRentalShareAnswers,
  );
  const coworkingFlexibleWorkspaceAccessGame = coworkingFlexibleWorkspaceAccessScore(
    coworkingFlexibleWorkspaceAccessAnswers,
  );
  const profiles = state.systems.map((system, index) => {
    const fields = [system.kind, system.owner, system.vendor, system.data];
    const complete = fields.filter((value, fieldIndex) =>
      fieldIndex === 0
        ? value.trim() !== "" && value !== "Registered system"
        : fieldIndex === 1
          ? value.trim() !== "" && value !== "Unassigned"
          : value.trim() !== "" && value !== "Not specified",
    ).length;
    return { system, index, complete };
  });

  return (
    <>
      <section className="checklist-intro">
        <WorkspaceVisual section="checklist" />
        <h2>Governance lifecycle review</h2>
        <p>
          This checklist is derived from the live workspace inventory, governance assessment,
          guardrails, release gate, roadmap and incident register. Maturity, guardrail and
          release-gate results remain workspace-level; system cards below measure inventory-profile
          completeness only.
        </p>
      </section>
      <section className="checklist-progress" aria-label="Lifecycle checklist progress">
        <div>
          <strong>{progress.percent}%</strong>
          <span>
            {progress.complete} of {progress.total} applicable checks complete
          </span>
        </div>
        <progress
          max={progress.total || 1}
          value={progress.complete}
          aria-label="Applicable checklist completion"
        />
      </section>
      {challenge && (
        <section className="checklist-phase" aria-label="Recommended next challenge">
          <h2>Your next governance challenge · {challenge.phase}</h2>
          <div className="checklist-task checklist-action">
            <Circle weight="duotone" />
            <div>
              <h3>{challenge.title}</h3>
              <p>{challenge.detail}</p>
              <small>{challenge.progress}</small>
            </div>
            <Button variant="default" asChild size="sm">
              <Link to={challenge.href}>
                {challenge.action}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      )}
      <section className="checklist-phase" aria-label="Governance milestones">
        <h2>Governance milestones · {milestones.level}</h2>
        <p>
          {milestones.points} progress points · Earned by completing applicable actions, with extra
          credit for evidence and verification—not by raising self-assessment scores.
        </p>
        <div className="checklist-tasks">
          {milestones.badges.map((badge) => (
            <article
              className={`checklist-task ${badge.earned ? "checklist-complete" : "checklist-action"}`}
              key={badge.id}
            >
              {badge.earned ? <CheckCircle weight="duotone" /> : <Circle weight="duotone" />}
              <div>
                <h3>
                  {badge.title} {badge.earned ? "· Earned" : "· In progress"}
                </h3>
                <p>{badge.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section id="incident-tabletop" className="checklist-phase" aria-label="AI incident tabletop exercise">
        <h2>Incident tabletop · Contain, coordinate, recover</h2>
        <p>
          Practice a response sequence for a fictional AI incident. Your answers stay in this
          browser session; this exercise does not replace your incident plan or legal review.
        </p>
        <p>
          <strong>
            {tabletop.bestChoices}/{tabletop.answered}
          </strong>{" "}
          sound response choices ·{" "}
          {tabletop.finished && (
            <Button variant="outline" onClick={() => setTabletopAnswers({})}>
              Run exercise again
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INCIDENT_TABLETOP.map((step) => {
            const selected = tabletopAnswers[step.id];
            return (
              <article className="checklist-task" key={step.id}>
                <div>
                  <h3>{step.prompt}</h3>
                  {step.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTabletopAnswers((answers) => ({ ...answers, [step.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === step.best ? "Strong response." : "Review the response plan."}
                      </strong>{" "}
                      {step.feedback}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <p>
          <a
            href="https://www.nist.gov/itl/ai-risk-management-framework"
            target="_blank"
            rel="noreferrer"
          >
            Reference: NIST AI Risk Management Framework
          </a>
        </p>
      </section>
      <section id="framework-crosswalk" className="checklist-phase" aria-label="Framework crosswalk game">
        <h2>Framework crosswalk · Match the governance move</h2>
        <p>
          Practice recognizing how related activities appear across leading frameworks. This is a
          learning aid, not a compliance determination.
        </p>
        <p>
          <strong>
            {crosswalk.correct}/{crosswalk.attempted}
          </strong>{" "}
          correct ·{" "}
          {crosswalk.complete ? (
            <Button variant="outline" onClick={() => setCrosswalkAnswers({})}>
              Play again
            </Button>
          ) : (
            `${FRAMEWORK_CROSSWALK.length - crosswalk.attempted} rounds remaining`
          )}
        </p>
        <div className="checklist-tasks">
          {FRAMEWORK_CROSSWALK.map((round) => {
            const selected = crosswalkAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.activity}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCrosswalkAnswers((previous) => ({ ...previous, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.correct ? "Correct." : "Try the next round."}
                      </strong>{" "}
                      {round.explanation}{" "}
                      <a href={round.url} target="_blank" rel="noreferrer">
                        Source: {round.source}
                      </a>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="supplier-assurance" className="checklist-phase" aria-label="AI supplier assurance challenge">
        <h2>Supplier assurance challenge</h2>
        <p>
          Practice evidence-led AI vendor due diligence. Scenarios are illustrative and do not
          replace procurement, security, privacy, or legal review.
        </p>
        <p>
          <strong>
            {vendorScore.preferred}/{vendorScore.answered}
          </strong>{" "}
          preferred decisions ·{" "}
          {vendorScore.complete && (
            <Button variant="outline" onClick={() => setVendorAnswers({})}>
              Play again
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {VENDOR_CHALLENGES.map((q) => {
            const selected = vendorAnswers[q.id];
            return (
              <article className="checklist-task" key={q.id}>
                <div>
                  <h3>{q.scenario}</h3>
                  {q.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() => setVendorAnswers((answers) => ({ ...answers, [q.id]: index }))}
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === q.preferred
                          ? "Good evidence-first choice."
                          : "Consider the evidence gap."}
                      </strong>{" "}
                      {q.rationale}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="guardrail-assurance" className="checklist-phase" aria-label="Guardrail assurance challenge">
        <h2>Guardrail assurance challenge</h2>
        <p>
          Practice choosing proportionate guardrails and evidence-backed assurance for different AI
          risk tiers. Scenarios are learning prompts, not legal advice or a substitute for context-
          specific review.
        </p>
        <p>
          <strong>
            {guardrailGame.correct}/{guardrailGame.attempted}
          </strong>{" "}
          sound decisions ·{" "}
          {guardrailGame.complete && (
            <Button variant="outline" onClick={() => setGuardrailAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {GUARDRAIL_ASSURANCE_ROUNDS.map((round) => {
            const selected = guardrailAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <small>Risk tier scenario: {round.tier}</small>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setGuardrailAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good guardrail assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="monitoring-assurance" className="checklist-phase" aria-label="Monitoring and assurance signals game">
        <h2>Monitoring & assurance signals</h2>
        <p>
          Practice interpreting post-deployment monitoring signals, guardrail drift/breaches, and
          evidence gaps. Scenarios are learning prompts, not a substitute for your monitoring plan,
          incident response, or specialist review.
        </p>
        <p>
          <strong>
            {monitoringGame.correct}/{monitoringGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {monitoringGame.complete && (
            <Button variant="outline" onClick={() => setMonitoringAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MONITORING_ASSURANCE_ROUNDS.map((round) => {
            const selected = monitoringAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.signal}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setMonitoringAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good assurance response."
                          : "Review the assurance signal."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="release-gate-assurance" className="checklist-phase" aria-label="Release gate and assurance readiness game">
        <h2>Release gate & assurance readiness</h2>
        <p>
          Practice go/no-go decisions, conditional approvals, required evidence/guardrail readiness,
          and change-triggered reassessment. Scenarios are learning prompts, not a substitute for
          your release process, accountable approvals, or specialist review.
        </p>
        <p>
          <strong>
            {releaseGateGame.correct}/{releaseGateGame.attempted}
          </strong>{" "}
          sound readiness decisions ·{" "}
          {releaseGateGame.complete && (
            <Button variant="outline" onClick={() => setReleaseGateAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RELEASE_GATE_ASSURANCE_ROUNDS.map((round) => {
            const selected = releaseGateAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setReleaseGateAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good release-gate decision."
                          : "Review the readiness gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="corrective-action-assurance" className="checklist-phase" aria-label="Corrective action and effectiveness verification game">
        <h2>Corrective action & effectiveness verification</h2>
        <p>
          Practice turning findings into owned corrective actions, requiring completion evidence,
          verifying effectiveness, and following up when fixes do not address root causes. Scenarios
          are learning prompts, not a substitute for your corrective-action process or specialist
          review.
        </p>
        <p>
          <strong>
            {correctiveGame.correct}/{correctiveGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {correctiveGame.complete && (
            <Button variant="outline" onClick={() => setCorrectiveAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CORRECTIVE_ACTION_ASSURANCE_ROUNDS.map((round) => {
            const selected = correctiveAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCorrectiveAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good corrective-action assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="risk-acceptance-assurance" className="checklist-phase" aria-label="Risk acceptance and governance decision assurance game">
        <h2>Risk acceptance & decision assurance</h2>
        <p>
          Practice accountable approvals, time-bound risk acceptance, review triggers, and evidence-
          backed rationale/conditions. Scenarios are learning prompts, not a substitute for your
          decision process, legal review, or specialist assessment.
        </p>
        <p>
          <strong>
            {riskAcceptanceGame.correct}/{riskAcceptanceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {riskAcceptanceGame.complete && (
            <Button variant="outline" onClick={() => setRiskAcceptanceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RISK_ACCEPTANCE_ASSURANCE_ROUNDS.map((round) => {
            const selected = riskAcceptanceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRiskAcceptanceAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good decision assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="human-oversight-assurance" className="checklist-phase" aria-label="Human oversight and escalation assurance game">
        <h2>Human oversight & escalation assurance</h2>
        <p>
          Practice meaningful human oversight, escalation/override paths, role competence, and
          evidence that oversight controls operate in practice. Scenarios are learning prompts, not a
          substitute for your operating procedures or specialist review.
        </p>
        <p>
          <strong>
            {oversightGame.correct}/{oversightGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {oversightGame.complete && (
            <Button variant="outline" onClick={() => setOversightAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {HUMAN_OVERSIGHT_ASSURANCE_ROUNDS.map((round) => {
            const selected = oversightAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setOversightAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good oversight assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="data-governance-assurance" className="checklist-phase" aria-label="Data governance and privacy assurance game">
        <h2>Data governance & privacy assurance</h2>
        <p>
          Practice data provenance and permissions, minimization/retention, sensitive-data guardrails,
          and evidence-backed response to data issues. Scenarios are learning prompts, not legal or
          privacy advice or a substitute for specialist review.
        </p>
        <p>
          <strong>
            {dataGovernanceGame.correct}/{dataGovernanceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {dataGovernanceGame.complete && (
            <Button variant="outline" onClick={() => setDataGovernanceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {DATA_GOVERNANCE_ASSURANCE_ROUNDS.map((round) => {
            const selected = dataGovernanceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setDataGovernanceAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good data governance assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="transparency-recordkeeping-assurance" className="checklist-phase" aria-label="Transparency and recordkeeping assurance game">
        <h2>Transparency & recordkeeping assurance</h2>
        <p>
          Practice system documentation, user-facing transparency and recourse, traceable evidence
          trails, and versioned change history. Scenarios are learning prompts, not a substitute for
          your documentation process or specialist review.
        </p>
        <p>
          <strong>
            {transparencyGame.correct}/{transparencyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {transparencyGame.complete && (
            <Button variant="outline" onClick={() => setTransparencyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {TRANSPARENCY_RECORDKEEPING_ROUNDS.map((round) => {
            const selected = transparencyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTransparencyAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good transparency/recordkeeping assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="supply-chain-assurance" className="checklist-phase" aria-label="Third-party and supply-chain assurance game">
        <h2>Third-party & supply-chain assurance</h2>
        <p>
          Practice vendor/model terms and responsibilities, fitness-for-use evidence, integration
          guardrails, and ongoing monitoring/exit readiness. Scenarios are learning prompts, not a
          substitute for procurement, legal, security, or specialist review.
        </p>
        <p>
          <strong>
            {supplyChainGame.correct}/{supplyChainGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {supplyChainGame.complete && (
            <Button variant="outline" onClick={() => setSupplyChainAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SUPPLY_CHAIN_ASSURANCE_ROUNDS.map((round) => {
            const selected = supplyChainAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSupplyChainAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good supply-chain assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="security-robustness-assurance" className="checklist-phase" aria-label="Security, robustness and abuse-resilience assurance game">
        <h2>Security, robustness & abuse resilience</h2>
        <p>
          Practice prompt-injection and tool-abuse defenses, least-privilege access controls,
          misuse/robustness testing, and secure logging/incident response. Scenarios are learning
          prompts, not a substitute for security engineering or specialist review.
        </p>
        <p>
          <strong>
            {securityGame.correct}/{securityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {securityGame.complete && (
            <Button variant="outline" onClick={() => setSecurityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SECURITY_ROBUSTNESS_ASSURANCE_ROUNDS.map((round) => {
            const selected = securityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSecurityAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good security/robustness assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="fairness-impact-assurance" className="checklist-phase" aria-label="Fairness, bias and impact assurance game">
        <h2>Fairness, bias & impact assurance</h2>
        <p>
          Practice impact/harms assessment, representative evaluation for bias/disparate outcomes,
          mitigation and guardrails, and recourse/review with evidence-backed follow-up. Scenarios are
          learning prompts, not a substitute for legal, ethics, or specialist review.
        </p>
        <p>
          <strong>
            {fairnessGame.correct}/{fairnessGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {fairnessGame.complete && (
            <Button variant="outline" onClick={() => setFairnessAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {FAIRNESS_IMPACT_ASSURANCE_ROUNDS.map((round) => {
            const selected = fairnessAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setFairnessAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good fairness/impact assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="continuous-improvement-assurance" className="checklist-phase" aria-label="Continuous improvement and assurance review game">
        <h2>Continuous improvement & assurance review</h2>
        <p>
          Practice periodic governance reviews, control/guardrail effectiveness metrics, lessons
          learned feedback loops, and accountable follow-up with updated evidence and risk posture.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {improvementGame.correct}/{improvementGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {improvementGame.complete && (
            <Button variant="outline" onClick={() => setImprovementAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CONTINUOUS_IMPROVEMENT_ASSURANCE_ROUNDS.map((round) => {
            const selected = improvementAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setImprovementAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good continuous-assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="policy-alignment-assurance" className="checklist-phase" aria-label="Policy, standards and alignment assurance game">
        <h2>Policy, standards & alignment assurance</h2>
        <p>
          Practice mapping applicable policies/standards/obligations, translating them into controls
          and guardrails, maintaining evidence of alignment, and reassessing/escalating gaps when
          things change. Scenarios are learning prompts, not legal advice or compliance determinations.
        </p>
        <p>
          <strong>
            {policyGame.correct}/{policyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {policyGame.complete && (
            <Button variant="outline" onClick={() => setPolicyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {POLICY_ALIGNMENT_ASSURANCE_ROUNDS.map((round) => {
            const selected = policyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPolicyAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good policy/alignment assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="change-deployment-assurance" className="checklist-phase" aria-label="Change management and deployment assurance game">
        <h2>Change management & deployment assurance</h2>
        <p>
          Practice pre-deployment impact/readiness review, controlled rollout and rollback criteria,
          change approvals and traceability, and post-deployment validation/communication. Scenarios
          are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {changeGame.correct}/{changeGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {changeGame.complete && (
            <Button variant="outline" onClick={() => setChangeAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CHANGE_DEPLOYMENT_ASSURANCE_ROUNDS.map((round) => {
            const selected = changeAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setChangeAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good change/deployment assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="accountability-raci-assurance" className="checklist-phase" aria-label="Accountability, roles and RACI assurance game">
        <h2>Accountability, roles & RACI assurance</h2>
        <p>
          Practice clear ownership, decision rights and approvals, role competence and training, and
          evidence of accountable oversight. Scenarios are learning prompts, not compliance
          determinations.
        </p>
        <p>
          <strong>
            {accountabilityGame.correct}/{accountabilityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {accountabilityGame.complete && (
            <Button variant="outline" onClick={() => setAccountabilityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ACCOUNTABILITY_RACI_ASSURANCE_ROUNDS.map((round) => {
            const selected = accountabilityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAccountabilityAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good accountability/roles assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="training-awareness-assurance" className="checklist-phase" aria-label="Training, awareness and competence assurance game">
        <h2>Training, awareness & competence assurance</h2>
        <p>
          Practice role-relevant training, acceptable-use awareness and limitations, competence
          verification and refreshers, and updating guidance/briefings after changes or incidents.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {trainingGame.correct}/{trainingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {trainingGame.complete && (
            <Button variant="outline" onClick={() => setTrainingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {TRAINING_AWARENESS_ASSURANCE_ROUNDS.map((round) => {
            const selected = trainingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTrainingAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good training/awareness assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="stakeholder-reporting-assurance" className="checklist-phase" aria-label="Stakeholder communication and reporting assurance game">
        <h2>Stakeholder communication & reporting assurance</h2>
        <p>
          Practice evidence-backed governance reporting, communicating limitations/material changes
          and incidents, and audience-appropriate channels, cadences, and escalation paths. Scenarios
          are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {reportingGame.correct}/{reportingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {reportingGame.complete && (
            <Button variant="outline" onClick={() => setReportingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {STAKEHOLDER_REPORTING_ASSURANCE_ROUNDS.map((round) => {
            const selected = reportingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setReportingAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good communication/reporting assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="continuity-resilience-assurance" className="checklist-phase" aria-label="Business continuity and resilience assurance game">
        <h2>Business continuity & resilience assurance</h2>
        <p>
          Practice dependency/failure planning, fallback and degraded-mode procedures, recovery
          objectives and testing, and readiness evidence/communications. Scenarios are learning
          prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {continuityGame.correct}/{continuityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {continuityGame.complete && (
            <Button variant="outline" onClick={() => setContinuityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CONTINUITY_RESILIENCE_ASSURANCE_ROUNDS.map((round) => {
            const selected = continuityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setContinuityAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good continuity/resilience assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="user-recourse-contestability-assurance" className="checklist-phase" aria-label="User recourse and contestability assurance game">
        <h2>User recourse & contestability assurance</h2>
        <p>
          Practice accessible recourse paths, timely human review and correction, clear communication
          of options and expectations, and tracked remediation with evidence of fair, responsive
          handling. Scenarios are learning prompts, not legal advice or compliance determinations.
        </p>
        <p>
          <strong>
            {recourseGame.correct}/{recourseGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {recourseGame.complete && (
            <Button variant="outline" onClick={() => setRecourseAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {USER_RECOURSE_CONTESTABILITY_ROUNDS.map((round) => {
            const selected = recourseAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRecourseAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good recourse/contestability assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="resource-efficiency-assurance" className="checklist-phase" aria-label="Environmental and resource efficiency assurance game">
        <h2>Environmental & resource efficiency assurance</h2>
        <p>
          Practice proportionate resource-impact assessment, right-sizing and efficient design,
          monitoring efficiency/cost signals, and lifecycle review with evidence-backed optimization
          decisions. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {efficiencyGame.correct}/{efficiencyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {efficiencyGame.complete && (
            <Button variant="outline" onClick={() => setEfficiencyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RESOURCE_EFFICIENCY_ASSURANCE_ROUNDS.map((round) => {
            const selected = efficiencyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEfficiencyAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good resource-efficiency assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="testing-validation-assurance" className="checklist-phase" aria-label="Testing, validation and evaluation assurance game">
        <h2>Testing, validation & evaluation assurance</h2>
        <p>
          Practice evaluation design and acceptance criteria, representative and edge-case testing,
          guardrail/control validation in realistic scenarios, and regression evidence after changes.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {testingGame.correct}/{testingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {testingGame.complete && (
            <Button variant="outline" onClick={() => setTestingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {TESTING_VALIDATION_ASSURANCE_ROUNDS.map((round) => {
            const selected = testingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTestingAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good testing/validation assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="purpose-boundary-assurance" className="checklist-phase" aria-label="Purpose limitation and use-case boundary assurance game">
        <h2>Purpose limitation & use-case boundary assurance</h2>
        <p>
          Practice defining approved/prohibited uses, enforcing scope guardrails for out-of-bounds
          requests, reviewing repurposing or expansion, and communicating/evidencing boundaries.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {boundaryGame.correct}/{boundaryGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {boundaryGame.complete && (
            <Button variant="outline" onClick={() => setBoundaryAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PURPOSE_BOUNDARY_ASSURANCE_ROUNDS.map((round) => {
            const selected = boundaryAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setBoundaryAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good purpose/boundary assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="output-quality-reliability-assurance" className="checklist-phase" aria-label="Output quality and reliability assurance game">
        <h2>Output quality & reliability assurance</h2>
        <p>
          Practice defining quality/reliability expectations, handling errors/hallucinations and
          uncertainty, communicating limitations and when to verify, and monitoring/improving output
          quality with evidence. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {qualityGame.correct}/{qualityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {qualityGame.complete && (
            <Button variant="outline" onClick={() => setQualityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {OUTPUT_QUALITY_RELIABILITY_ROUNDS.map((round) => {
            const selected = qualityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setQualityAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good output-quality assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="logging-traceability-assurance" className="checklist-phase" aria-label="Logging, traceability and auditability assurance game">
        <h2>Logging, traceability & auditability assurance</h2>
        <p>
          Practice meaningful and proportionate logging, protecting integrity/privacy, maintaining
          traceability for investigation and review, and retention/access practices for audit
          readiness. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {loggingGame.correct}/{loggingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {loggingGame.complete && (
            <Button variant="outline" onClick={() => setLoggingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {LOGGING_TRACEABILITY_ASSURANCE_ROUNDS.map((round) => {
            const selected = loggingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setLoggingAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good logging/traceability assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="access-identity-assurance" className="checklist-phase" aria-label="Access control and identity assurance game">
        <h2>Access control & identity assurance</h2>
        <p>
          Practice least-privilege and role-based access, strong identity/authentication and
          credential control, access reviews and timely revocation, and segregation of duties with
          evidence. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {accessGame.correct}/{accessGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {accessGame.complete && (
            <Button variant="outline" onClick={() => setAccessAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ACCESS_IDENTITY_ASSURANCE_ROUNDS.map((round) => {
            const selected = accessAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAccessAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good access/identity assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="model-prompt-config-assurance" className="checklist-phase" aria-label="Model and prompt configuration governance assurance game">
        <h2>Model & prompt configuration governance</h2>
        <p>
          Practice controlled management of models/prompts/configurations, versioning and approvals,
          safe settings and guardrail alignment, and rollback readiness with traceable evidence.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {configGame.correct}/{configGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {configGame.complete && (
            <Button variant="outline" onClick={() => setConfigAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MODEL_PROMPT_CONFIG_ASSURANCE_ROUNDS.map((round) => {
            const selected = configAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setConfigAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good configuration-governance assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="content-safety-misuse-assurance" className="checklist-phase" aria-label="Content safety and misuse prevention assurance game">
        <h2>Content safety & misuse prevention assurance</h2>
        <p>
          Practice safety/misuse policies, input/output safeguards and refusal behaviors, handling
          dual-use or ambiguous requests with escalation, and evidence-backed tuning of guardrails.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {safetyGame.correct}/{safetyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {safetyGame.complete && (
            <Button variant="outline" onClick={() => setSafetyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CONTENT_SAFETY_MISUSE_ASSURANCE_ROUNDS.map((round) => {
            const selected = safetyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSafetyAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good content-safety assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="service-level-reliability-assurance" className="checklist-phase" aria-label="Performance and service-level assurance game">
        <h2>Performance & service-level assurance</h2>
        <p>
          Practice service/reliability expectations, capacity and safe degraded-mode safeguards,
          actionable monitoring and alerts, and evidence-backed reliability review/improvement.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {serviceGame.correct}/{serviceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {serviceGame.complete && (
            <Button variant="outline" onClick={() => setServiceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SERVICE_LEVEL_RELIABILITY_ASSURANCE_ROUNDS.map((round) => {
            const selected = serviceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setServiceAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good service-level assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="explainability-interpretability-assurance" className="checklist-phase" aria-label="Explainability and interpretability assurance game">
        <h2>Explainability & interpretability assurance</h2>
        <p>
          Practice providing explanations appropriate to context and audience, communicating
          limitations, supporting reviewer/user understanding and review, and validating/documenting
          usefulness and risks. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {explainabilityGame.correct}/{explainabilityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {explainabilityGame.complete && (
            <Button variant="outline" onClick={() => setExplainabilityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EXPLAINABILITY_INTERPRETABILITY_ROUNDS.map((round) => {
            const selected = explainabilityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setExplainabilityAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good explainability/interpretability assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="data-retention-deletion-assurance" className="checklist-phase" aria-label="Data retention and deletion assurance game">
        <h2>Data retention & deletion assurance</h2>
        <p>
          Practice proportionate retention limits, reliable deletion/lifecycle disposal, protection
          of retained data, and evidence that retention/deletion practices are followed. Scenarios
          are learning prompts, not legal advice or compliance determinations.
        </p>
        <p>
          <strong>
            {retentionGame.correct}/{retentionGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {retentionGame.complete && (
            <Button variant="outline" onClick={() => setRetentionAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {DATA_RETENTION_DELETION_ASSURANCE_ROUNDS.map((round) => {
            const selected = retentionAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRetentionAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good retention/deletion assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="ethical-values-alignment-assurance" className="checklist-phase" aria-label="Ethical use and values alignment assurance game">
        <h2>Ethical use & values alignment assurance</h2>
        <p>
          Practice defining AI principles and boundaries, assessing use cases against values and
          stakeholder impacts, handling trade-offs transparently, and reviewing/responding to
          ethical concerns with evidence-backed learning. Scenarios are learning prompts, not
          compliance determinations.
        </p>
        <p>
          <strong>
            {ethicsGame.correct}/{ethicsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {ethicsGame.complete && (
            <Button variant="outline" onClick={() => setEthicsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ETHICAL_VALUES_ALIGNMENT_ASSURANCE_ROUNDS.map((round) => {
            const selected = ethicsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEthicsAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good ethical/values-alignment assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="procurement-contracting-assurance" className="checklist-phase" aria-label="Procurement and contracting assurance for AI game">
        <h2>Procurement & contracting assurance for AI</h2>
        <p>
          Practice AI-specific procurement requirements, evidence-based vendor evaluation, clear
          contract terms and responsibilities, and onboarding due diligence with ongoing vendor
          assurance reviews. Scenarios are learning prompts, not legal or compliance determinations.
        </p>
        <p>
          <strong>
            {procurementGame.correct}/{procurementGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {procurementGame.complete && (
            <Button variant="outline" onClick={() => setProcurementAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PROCUREMENT_CONTRACTING_ASSURANCE_ROUNDS.map((round) => {
            const selected = procurementAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setProcurementAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good procurement/contracting assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="data-labeling-quality-assurance" className="checklist-phase" aria-label="Data labeling and annotation quality assurance game">
        <h2>Data labeling & annotation quality assurance</h2>
        <p>
          Practice clear labeling guidelines and quality criteria, annotator training and
          consistency checks, handling ambiguity and edge cases, and QA audits/feedback loops with
          evidence-backed governance. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {labelingGame.correct}/{labelingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {labelingGame.complete && (
            <Button variant="outline" onClick={() => setLabelingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {DATA_LABELING_QUALITY_ASSURANCE_ROUNDS.map((round) => {
            const selected = labelingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setLabelingAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good data-labeling assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="incident-communication-tabletop-assurance" className="checklist-phase" aria-label="Incident communication tabletop assurance game">
        <h2>Incident communication tabletop assurance</h2>
        <p>
          Practice cross-functional coordination during AI incidents, timely and factual stakeholder
          updates, escalation and decision logging under pressure, and after-action review of
          communication effectiveness. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {incidentCommsGame.correct}/{incidentCommsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {incidentCommsGame.complete && (
            <Button variant="outline" onClick={() => setIncidentCommsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INCIDENT_COMMUNICATION_TABLETOP_ROUNDS.map((round) => {
            const selected = incidentCommsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setIncidentCommsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good incident-communication assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="decommissioning-retirement-assurance" className="checklist-phase" aria-label="AI system decommissioning and retirement assurance game">
        <h2>AI system decommissioning & retirement assurance</h2>
        <p>
          Practice planned and owned retirement, stakeholder communication and continuity guidance,
          access revocation and lifecycle disposal of data/models/configurations, and verified
          closure evidence with lessons learned. Scenarios are learning prompts, not compliance
          determinations.
        </p>
        <p>
          <strong>
            {retirementGame.correct}/{retirementGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {retirementGame.complete && (
            <Button variant="outline" onClick={() => setRetirementAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {DECOMMISSIONING_RETIREMENT_ASSURANCE_ROUNDS.map((round) => {
            const selected = retirementAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRetirementAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good decommissioning/retirement assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="ai-literacy-enablement-assurance" className="checklist-phase" aria-label="AI literacy and user enablement assurance game">
        <h2>AI literacy & user enablement assurance</h2>
        <p>
          Practice role-appropriate AI literacy, clear expectations of capabilities and limitations,
          safe/effective use guidance and examples, and feedback-driven improvement of enablement
          resources. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {literacyGame.correct}/{literacyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {literacyGame.complete && (
            <Button variant="outline" onClick={() => setLiteracyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {AI_LITERACY_ENABLEMENT_ASSURANCE_ROUNDS.map((round) => {
            const selected = literacyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setLiteracyAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good AI-literacy/enablement assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="human-ai-handoff-assurance" className="checklist-phase" aria-label="Human-AI collaboration and handoff assurance game">
        <h2>Human-AI collaboration & handoff assurance</h2>
        <p>
          Practice clear task division and handoff points, preserving human context and judgment,
          escalation on low confidence or elevated risk, and evidence-backed review to avoid
          overreliance and automation complacency. Scenarios are learning prompts, not compliance
          determinations.
        </p>
        <p>
          <strong>
            {handoffGame.correct}/{handoffGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {handoffGame.complete && (
            <Button variant="outline" onClick={() => setHandoffAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {HUMAN_AI_HANDOFF_ASSURANCE_ROUNDS.map((round) => {
            const selected = handoffAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setHandoffAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good collaboration/handoff assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="vendor-ai-assurance" className="checklist-phase" aria-label="Third-party and vendor AI assurance game">
        <h2>Third-party & vendor AI assurance</h2>
        <p>
          Practice risk-based vendor due diligence, contractual guardrails and responsibilities,
          dependency and concentration planning, and ongoing monitoring with evidence refresh.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {vendorGame.correct}/{vendorGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {vendorGame.complete && (
            <Button variant="outline" onClick={() => setVendorAssuranceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {VENDOR_AI_ASSURANCE_ROUNDS.map((round) => {
            const selected = vendorAssuranceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setVendorAssuranceAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good vendor-assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="transparency-disclosure-assurance" className="checklist-phase" aria-label="Transparency and user disclosure assurance game">
        <h2>Transparency & user disclosure assurance</h2>
        <p>
          Practice clear AI disclosure and notice, communicating limitations and uncertainty,
          providing contestability/feedback/recourse channels, and evaluating transparency
          effectiveness with evidence. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {disclosureGame.correct}/{disclosureGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {disclosureGame.complete && (
            <Button variant="outline" onClick={() => setDisclosureAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {TRANSPARENCY_DISCLOSURE_ASSURANCE_ROUNDS.map((round) => {
            const selected = disclosureAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setDisclosureAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good transparency/disclosure assurance choice."
                          : "Review the assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="privacy-minimization-assurance"
        className="checklist-phase"
        aria-label="AI privacy and data minimization assurance game"
      >
        <h2>AI privacy & data minimization assurance</h2>
        <p>
          Practice collecting only the personal data a purpose needs, minimizing and redacting
          before third-party model calls, applying purpose limitation on secondary use, and keeping
          minimization evidence on review. Scenarios are learning prompts, not compliance
          determinations.
        </p>
        <p>
          <strong>
            {privacyGame.correct}/{privacyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {privacyGame.complete && (
            <Button variant="outline" onClick={() => setPrivacyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PRIVACY_MINIMIZATION_ASSURANCE_ROUNDS.map((round) => {
            const selected = privacyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPrivacyAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good data-minimization assurance choice."
                          : "Review the minimization gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="inventory-risk-classification-assurance"
        className="checklist-phase"
        aria-label="AI inventory and risk classification assurance game"
      >
        <h2>AI inventory & risk classification assurance</h2>
        <p>
          Practice registering every AI use with an owner, classifying risk against documented
          criteria, keeping the inventory current through change, and turning tiers into
          proportionate assurance action. Scenarios are learning prompts, not compliance
          determinations.
        </p>
        <p>
          <strong>
            {inventoryGame.correct}/{inventoryGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {inventoryGame.complete && (
            <Button variant="outline" onClick={() => setInventoryAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INVENTORY_RISK_CLASSIFICATION_ROUNDS.map((round) => {
            const selected = inventoryAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setInventoryAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good inventory & classification assurance choice."
                          : "Review the inventory gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="guardrail-tuning-assurance"
        className="checklist-phase"
        aria-label="Guardrail tuning and effectiveness assurance game"
      >
        <h2>Guardrail tuning & effectiveness assurance</h2>
        <p>
          Practice tuning noisy guardrails against real traffic, changing thresholds with recorded
          evidence, measuring catch and miss rates, and reviewing overrides as tuning signals.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {tuningGame.correct}/{tuningGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {tuningGame.complete && (
            <Button variant="outline" onClick={() => setTuningAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {GUARDRAIL_TUNING_ASSURANCE_ROUNDS.map((round) => {
            const selected = tuningAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTuningAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good guardrail tuning assurance choice."
                          : "Review the tuning gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="performance-drift-assurance"
        className="checklist-phase"
        aria-label="Post-deployment performance and drift assurance game"
      >
        <h2>Post-deployment performance & drift assurance</h2>
        <p>
          Practice baselining post-deployment performance, watching for data and quality drift,
          assigning drift response owners and SLAs, and keeping auditable drift evidence. Scenarios
          are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {driftGame.correct}/{driftGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {driftGame.complete && (
            <Button variant="outline" onClick={() => setDriftAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PERFORMANCE_DRIFT_ASSURANCE_ROUNDS.map((round) => {
            const selected = driftAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setDriftAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good drift assurance choice."
                          : "Review the drift assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="human-factors-usability-assurance"
        className="checklist-phase"
        aria-label="Human factors and usability assurance game"
      >
        <h2>Human factors & usability assurance</h2>
        <p>
          Practice representative user testing, usable error and correction paths, workload and
          comprehension safeguards, and repeated usability reviews with evidence. Scenarios are
          learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {usabilityGame.correct}/{usabilityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {usabilityGame.complete && (
            <Button variant="outline" onClick={() => setUsabilityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {HUMAN_FACTORS_USABILITY_ASSURANCE_ROUNDS.map((round) => {
            const selected = usabilityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setUsabilityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good human factors & usability assurance choice."
                          : "Review the usability assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="model-documentation-transparency-assurance"
        className="checklist-phase"
        aria-label="Model documentation and transparency assurance game"
      >
        <h2>Model documentation & transparency assurance</h2>
        <p>
          Practice documenting intended use and limitations, versioning model changes and notifying
          operators, recording failure modes, and keeping performance evidence traceable and
          current. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {documentationGame.correct}/{documentationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {documentationGame.complete && (
            <Button variant="outline" onClick={() => setDocumentationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MODEL_DOCUMENTATION_TRANSPARENCY_ROUNDS.map((round) => {
            const selected = documentationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setDocumentationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good documentation & transparency assurance choice."
                          : "Review the documentation gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="data-quality-integrity-assurance"
        className="checklist-phase"
        aria-label="Data quality and integrity assurance game"
      >
        <h2>Data quality & integrity assurance</h2>
        <p>
          Practice data lineage and metadata, ground-truth auditing, data health monitoring in
          production, and documented remediation of bad datasets. Scenarios are learning prompts, not
          compliance determinations.
        </p>
        <p>
          <strong>
            {dataQualityGame.correct}/{dataQualityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {dataQualityGame.complete && (
            <Button variant="outline" onClick={() => setDataQualityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {DATA_QUALITY_INTEGRITY_ASSURANCE_ROUNDS.map((round) => {
            const selected = dataQualityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setDataQualityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good data quality & integrity assurance choice."
                          : "Review the data quality gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="safety-misuse-assurance"
        className="checklist-phase"
        aria-label="AI safety and misuse prevention assurance game"
      >
        <h2>AI safety & misuse prevention assurance</h2>
        <p>
          Practice adversarial and misuse testing, capability-gated safeguards, misuse monitoring
          and response, and documented safety incident review and closure. Scenarios are learning
          prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {misuseGame.correct}/{misuseGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {misuseGame.complete && (
            <Button variant="outline" onClick={() => setMisuseAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SAFETY_MISUSE_ASSURANCE_ROUNDS.map((round) => {
            const selected = misuseAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setMisuseAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good safety & misuse prevention assurance choice."
                          : "Review the safety assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="guardrail-exception-assurance"
        className="checklist-phase"
        aria-label="Guardrail exception and override assurance game"
      >
        <h2>Guardrail exception &amp; override assurance</h2>
        <p>
          Practice time-boxed overrides with expiry, exception trend review, exception ownership and
          review, and assessing the impact of outputs produced while an override was active.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {exceptionGame.correct}/{exceptionGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {exceptionGame.complete && (
            <Button variant="outline" onClick={() => setExceptionAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {GUARDRAIL_EXCEPTION_ASSURANCE_ROUNDS.map((round) => {
            const selected = exceptionAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setExceptionAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good guardrail exception assurance choice."
                          : "Review the exception handling gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="data-rights-licensing-assurance"
        className="checklist-phase"
        aria-label="Training data rights and licensing assurance game"
      >
        <h2>Training data rights &amp; licensing assurance</h2>
        <p>
          Practice confirming lawful basis for training data, checking licence terms against actual
          use, honouring opt-outs and withdrawals, and reviewing scraped corpora before use.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {rightsGame.correct}/{rightsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {rightsGame.complete && (
            <Button variant="outline" onClick={() => setRightsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {DATA_RIGHTS_LICENSING_ASSURANCE_ROUNDS.map((round) => {
            const selected = rightsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRightsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good data rights & licensing assurance choice."
                          : "Review the data rights gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="guardrail-config-assurance"
        className="checklist-phase"
        aria-label="Guardrail configuration change assurance game"
      >
        <h2>Guardrail configuration change assurance</h2>
        <p>
          Practice configuration history and approval, environment parity, pre-release rule testing
          on edge and adversarial cases, and tested rollback for guardrail changes. Scenarios are
          learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {guardrailConfigGame.correct}/{guardrailConfigGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {guardrailConfigGame.complete && (
            <Button variant="outline" onClick={() => setGuardrailConfigAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {GUARDRAIL_CONFIG_ASSURANCE_ROUNDS.map((round) => {
            const selected = guardrailConfigAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setGuardrailConfigAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good guardrail configuration assurance choice."
                          : "Review the configuration change gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="assurance-cadence"
        className="checklist-phase"
        aria-label="Assurance review cadence and evidence refresh game"
      >
        <h2>Assurance review cadence &amp; evidence refresh</h2>
        <p>
          Practice owned review calendars, evidence freshness after system change, authoritative
          evidence registers, and escalating overdue assurance items before audit. Scenarios are
          learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {cadenceGame.correct}/{cadenceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {cadenceGame.complete && (
            <Button variant="outline" onClick={() => setCadenceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ASSURANCE_CADENCE_ROUNDS.map((round) => {
            const selected = cadenceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCadenceAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good assurance cadence choice."
                          : "Review the cadence gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="risk-appetite-assurance"
        className="checklist-phase"
        aria-label="AI risk appetite and tolerance assurance game"
      >
        <h2>AI risk appetite &amp; tolerance assurance</h2>
        <p>
          Practice setting appetite before approval, routing tolerance breaches to named owners with
          defined responses, reviewing appetite against the live portfolio, and recording risk
          acceptance. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {appetiteGame.correct}/{appetiteGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {appetiteGame.complete && (
            <Button variant="outline" onClick={() => setAppetiteAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RISK_APPETITE_ASSURANCE_ROUNDS.map((round) => {
            const selected = appetiteAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAppetiteAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good risk appetite assurance choice."
                          : "Review the appetite and tolerance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="eval-integrity-assurance"
        className="checklist-phase"
        aria-label="AI evaluation integrity assurance game"
      >
        <h2>AI evaluation integrity assurance</h2>
        <p>
          Practice holdout integrity and contamination checks, complete and honest reporting,
          evaluation relevance as products change, and sign-off on eval set versions and thresholds.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {evalIntegrityGame.correct}/{evalIntegrityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {evalIntegrityGame.complete && (
            <Button variant="outline" onClick={() => setEvalIntegrityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EVAL_INTEGRITY_ROUNDS.map((round) => {
            const selected = evalIntegrityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEvalIntegrityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good evaluation integrity choice."
                          : "Review the evaluation integrity gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="intake-onboarding-assurance"
        className="checklist-phase"
        aria-label="AI intake and onboarding assurance game"
      >
        <h2>AI intake &amp; onboarding assurance</h2>
        <p>
          Practice bringing shadow AI into intake, proportionate review for pilots with real users,
          verified onboarding evidence, and recorded handover of ongoing obligations. Scenarios are
          learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {intakeGame.correct}/{intakeGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {intakeGame.complete && (
            <Button variant="outline" onClick={() => setIntakeAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INTAKE_ONBOARDING_ROUNDS.map((round) => {
            const selected = intakeAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setIntakeAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good intake & onboarding assurance choice."
                          : "Review the intake and onboarding gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="operating-model-assurance"
        className="checklist-phase"
        aria-label="AI governance operating model assurance game"
      >
        <h2>AI governance operating model assurance</h2>
        <p>
          Practice publishing decision rights, keeping forums operating with quorum and decision
          logs, owning escalation turnaround, and reviewing the operating model as the estate grows.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {operatingModelGame.correct}/{operatingModelGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {operatingModelGame.complete && (
            <Button variant="outline" onClick={() => setOperatingModelAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {OPERATING_MODEL_ROUNDS.map((round) => {
            const selected = operatingModelAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setOperatingModelAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good operating model assurance choice."
                          : "Review the operating model gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="agentic-guardrails-assurance"
        className="checklist-phase"
        aria-label="Agentic AI action guardrails assurance game"
      >
        <h2>Agentic AI action guardrails assurance</h2>
        <p>
          Practice least-privilege agent credentials, approval gates for irreversible actions,
          enforced spend and step limits, and replayable action logs for tool-using agents. Scenarios
          are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {agenticGuardrailsGame.correct}/{agenticGuardrailsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {agenticGuardrailsGame.complete && (
            <Button variant="outline" onClick={() => setAgenticGuardrailsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {AGENTIC_GUARDRAILS_ROUNDS.map((round) => {
            const selected = agenticGuardrailsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAgenticGuardrailsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good agentic guardrail assurance choice."
                          : "Review the agent guardrail gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="near-miss-reporting-assurance"
        className="checklist-phase"
        aria-label="AI near-miss reporting and learning assurance game"
      >
        <h2>AI near-miss reporting &amp; learning assurance</h2>
        <p>
          Practice blame-free near-miss reporting, a reportable near-miss category, closed-loop
          learning with reporters, and impact-based triage and escalation. Scenarios are learning
          prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {nearMissGame.correct}/{nearMissGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {nearMissGame.complete && (
            <Button variant="outline" onClick={() => setNearMissAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {NEAR_MISS_REPORTING_ROUNDS.map((round) => {
            const selected = nearMissAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setNearMissAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good near-miss learning choice."
                          : "Review the near-miss reporting gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="risk-register-quality-assurance"
        className="checklist-phase"
        aria-label="AI risk register quality assurance game"
      >
        <h2>AI risk register quality assurance</h2>
        <p>
          Practice writing specific system-tied risk statements, assigning named owners with dated
          treatment, evidencing residual risk, and keeping the register free of duplicates and stale
          entries. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {riskRegisterGame.correct}/{riskRegisterGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {riskRegisterGame.complete && (
            <Button variant="outline" onClick={() => setRiskRegisterAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RISK_REGISTER_ROUNDS.map((round) => {
            const selected = riskRegisterAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRiskRegisterAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good risk register assurance choice."
                          : "Review the risk register gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="output-ip-assurance"
        className="checklist-phase"
        aria-label="AI output ownership and IP assurance game"
      >
        <h2>AI output ownership &amp; IP assurance</h2>
        <p>
          Practice settling output ownership terms, running similarity and infringement checks on
          generated content, checking licence obligations in AI-assisted code, and disclosing and
          recording AI involvement. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {outputIpGame.correct}/{outputIpGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {outputIpGame.complete && (
            <Button variant="outline" onClick={() => setOutputIpAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {OUTPUT_IP_ROUNDS.map((round) => {
            const selected = outputIpAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setOutputIpAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good output rights assurance choice."
                          : "Review the output rights gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="oversight-capacity-assurance"
        className="checklist-phase"
        aria-label="AI human oversight capacity assurance game"
      >
        <h2>AI human oversight capacity assurance</h2>
        <p>
          Practice detecting automation bias and rubber-stamping, giving reviewers real override
          authority, matching review capacity to decision volume, and assigning competent reviewers
          with context. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {oversightCapacityGame.correct}/{oversightCapacityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {oversightCapacityGame.complete && (
            <Button variant="outline" onClick={() => setOversightCapacityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {OVERSIGHT_CAPACITY_ROUNDS.map((round) => {
            const selected = oversightCapacityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setOversightCapacityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good oversight capacity assurance choice."
                          : "Review the oversight capacity gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="governance-metrics-assurance"
        className="checklist-phase"
        aria-label="AI governance metrics and reporting assurance game"
      >
        <h2>AI governance metrics &amp; reporting assurance</h2>
        <p>
          Practice replacing vanity counts with decision-grade metrics, tracing figures to system
          sources, reporting failures and near misses honestly, and tying every metric to a decision
          and owner. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {metricsGame.correct}/{metricsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {metricsGame.complete && (
            <Button variant="outline" onClick={() => setMetricsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {GOVERNANCE_METRICS_ROUNDS.map((round) => {
            const selected = metricsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setMetricsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good metrics and reporting choice."
                          : "Review the reporting gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="production-testing-assurance"
        className="checklist-phase"
        aria-label="AI production testing and canary assurance game"
      >
        <h2>AI production testing &amp; canary assurance</h2>
        <p>
          Practice staged exposure in shadow and canary, pre-agreed success and stop criteria,
          rehearsed rollback and kill switches, and safeguards for live test data and affected users.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {productionTestingGame.correct}/{productionTestingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {productionTestingGame.complete && (
            <Button variant="outline" onClick={() => setProductionTestingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PRODUCTION_TESTING_ROUNDS.map((round) => {
            const selected = productionTestingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setProductionTestingAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good production testing choice."
                          : "Review the production testing gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="model-deprecation-assurance"
        className="checklist-phase"
        aria-label="AI model deprecation and migration assurance game"
      >
        <h2>AI model deprecation &amp; migration assurance</h2>
        <p>
          Practice tracking model versions and sunset dates, controlling unpinned model change,
          re-running evaluation before migration, and re-approving the system after a model swap.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {deprecationGame.correct}/{deprecationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {deprecationGame.complete && (
            <Button variant="outline" onClick={() => setDeprecationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MODEL_DEPRECATION_ROUNDS.map((round) => {
            const selected = deprecationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setDeprecationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good model migration choice."
                          : "Review the model lifecycle gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="board-oversight-assurance"
        className="checklist-phase"
        aria-label="AI board and executive oversight assurance game"
      >
        <h2>AI board &amp; executive oversight assurance</h2>
        <p>
          Practice putting AI on the board agenda with a named executive owner, reporting risk and
          failures honestly, minuting challenge and dissent, and tracking board decisions to
          completion. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {boardOversightGame.correct}/{boardOversightGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {boardOversightGame.complete && (
            <Button variant="outline" onClick={() => setBoardOversightAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {BOARD_OVERSIGHT_ROUNDS.map((round) => {
            const selected = boardOversightAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setBoardOversightAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good board oversight choice."
                          : "Review the board oversight gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="incident-severity-assurance"
        className="checklist-phase"
        aria-label="AI incident severity and notification assurance game"
      >
        <h2>AI incident severity &amp; notification assurance</h2>
        <p>
          Practice classifying AI-specific harms, naming a triage owner with a decision window,
          pre-agreeing notification triggers and timelines, and running blameless reviews with
          tracked corrective actions. Scenarios are learning prompts, not compliance
          determinations.
        </p>
        <p>
          <strong>
            {incidentSeverityGame.correct}/{incidentSeverityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {incidentSeverityGame.complete && (
            <Button variant="outline" onClick={() => setIncidentSeverityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INCIDENT_SEVERITY_ROUNDS.map((round) => {
            const selected = incidentSeverityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setIncidentSeverityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good incident severity choice."
                          : "Review the incident classification gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="secrets-hygiene-assurance"
        className="checklist-phase"
        aria-label="AI model key and secrets hygiene assurance game"
      >
        <h2>AI model key &amp; secrets hygiene assurance</h2>
        <p>
          Practice keeping model keys server-side and least-privilege, registering keys with owners
          and environments, rehearsing rotation and revocation, and catching secrets that leak into
          repos, logs or prompts. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {secretsGame.correct}/{secretsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {secretsGame.complete && (
            <Button variant="outline" onClick={() => setSecretsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SECRETS_HYGIENE_ROUNDS.map((round) => {
            const selected = secretsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSecretsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good secrets hygiene choice."
                          : "Review the secrets handling gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="evidence-pack-assurance"
        className="checklist-phase"
        aria-label="AI assurance evidence pack assurance game"
      >
        <h2>AI assurance evidence pack assurance</h2>
        <p>
          Practice mapping claims to specific evidence, replacing stale evidence after material
          change, recording owners and sources per claim, and testing a pack with an unaided
          reviewer. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {evidencePackGame.correct}/{evidencePackGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {evidencePackGame.complete && (
            <Button variant="outline" onClick={() => setEvidencePackAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EVIDENCE_PACK_ROUNDS.map((round) => {
            const selected = evidencePackAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEvidencePackAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good evidence pack choice."
                          : "Review the evidence pack gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="prompt-injection-assurance"
        className="checklist-phase"
        aria-label="Prompt injection and jailbreak resilience assurance game"
      >
        <h2>Prompt injection &amp; jailbreak resilience assurance</h2>
        <p>
          Practice treating retrieved content as untrusted, scoping agent tools and data, turning
          red-team attacks into regression tests, and detecting instruction-extraction attempts in
          production. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {promptInjectionGame.correct}/{promptInjectionGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {promptInjectionGame.complete && (
            <Button variant="outline" onClick={() => setPromptInjectionAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PROMPT_INJECTION_ROUNDS.map((round) => {
            const selected = promptInjectionAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPromptInjectionAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good injection resilience choice."
                          : "Review the injection resilience gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="synthetic-data-assurance"
        className="checklist-phase"
        aria-label="Synthetic data governance assurance game"
      >
        <h2>Synthetic data governance assurance</h2>
        <p>
          Practice recording how synthetic data was generated, validating fidelity and utility
          against real data, testing for memorised records, and documenting label limits before
          reuse. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {syntheticDataGame.correct}/{syntheticDataGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {syntheticDataGame.complete && (
            <Button variant="outline" onClick={() => setSyntheticDataAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SYNTHETIC_DATA_ROUNDS.map((round) => {
            const selected = syntheticDataAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSyntheticDataAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good synthetic data choice."
                          : "Review the synthetic data gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="model-selection-assurance"
        className="checklist-phase"
        aria-label="AI model selection and fitness-for-purpose assurance game"
      >
        <h2>AI model selection &amp; fitness-for-purpose assurance</h2>
        <p>
          Practice setting the quality bar before choosing, evaluating candidates on your own data,
          recording cost and risk trade-offs, and keeping a credible switch path before lock-in.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {modelSelectionGame.correct}/{modelSelectionGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {modelSelectionGame.complete && (
            <Button variant="outline" onClick={() => setModelSelectionAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MODEL_SELECTION_ROUNDS.map((round) => {
            const selected = modelSelectionAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setModelSelectionAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good model selection choice."
                          : "Review the model selection gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="env-impact-assurance"
        className="checklist-phase"
        aria-label="AI compute and environmental impact assurance game"
      >
        <h2>AI compute &amp; environmental impact assurance</h2>
        <p>
          Practice measuring energy and compute per workload, right-sizing and scheduling for
          efficiency, reporting AI impact with assumptions, and owning reduction targets with a
          review cadence. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {envImpactGame.correct}/{envImpactGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {envImpactGame.complete && (
            <Button variant="outline" onClick={() => setEnvImpactAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ENV_IMPACT_ROUNDS.map((round) => {
            const selected = envImpactAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEnvImpactAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good environmental impact choice."
                          : "Review the environmental impact gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="tabletop-assurance"
        className="checklist-phase"
        aria-label="AI assurance tabletop and rehearsal assurance game"
      >
        <h2>AI assurance tabletop &amp; rehearsal assurance</h2>
        <p>
          Practice building scenarios from real AI failure modes, rehearsing cross-functionally with
          legal and communications, running on a cadence that reuses real incidents, and tracking
          findings to closure. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {assuranceTabletopGame.correct}/{assuranceTabletopGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {assuranceTabletopGame.complete && (
            <Button variant="outline" onClick={() => setAssuranceTabletopAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {TABLETOP_ROUNDS.map((round) => {
            const selected = assuranceTabletopAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAssuranceTabletopAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good tabletop choice."
                          : "Review the rehearsal gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="agent-memory-assurance"
        className="checklist-phase"
        aria-label="Agent memory governance assurance game"
      >
        <h2>Agent memory governance assurance</h2>
        <p>
          Practice registering what an agent remembers, deleting memories across every store,
          testing isolation between users and tenants, and validating what can be written to memory
          before it becomes an instruction. Scenarios are learning prompts, not compliance
          determinations.
        </p>
        <p>
          <strong>
            {agentMemoryGame.correct}/{agentMemoryGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {agentMemoryGame.complete && (
            <Button variant="outline" onClick={() => setAgentMemoryAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {AGENT_MEMORY_ROUNDS.map((round) => {
            const selected = agentMemoryAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAgentMemoryAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good agent memory choice."
                          : "Review the agent memory gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="incentive-alignment-assurance"
        className="checklist-phase"
        aria-label="AI incentive alignment assurance game"
      >
        <h2>AI incentive alignment assurance</h2>
        <p>
          Practice spotting where targets reward bypassing a guardrail, pairing throughput measures
          with quality and safety, protecting people who flag pressure, and making cost-versus-quality
          trade-offs explicit. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {incentiveGame.correct}/{incentiveGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {incentiveGame.complete && (
            <Button variant="outline" onClick={() => setIncentiveAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INCENTIVE_ROUNDS.map((round) => {
            const selected = incentiveAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setIncentiveAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good incentive alignment choice."
                          : "Review the incentive conflict."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="provider-terms-assurance"
        className="checklist-phase"
        aria-label="AI provider terms change assurance game"
      >
        <h2>AI provider terms change assurance</h2>
        <p>
          Practice registering subprocessors and model cards, routing provider notices to an owner,
          assessing term changes against actual use, and testing an exit path before it is needed.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {providerTermsGame.correct}/{providerTermsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {providerTermsGame.complete && (
            <Button variant="outline" onClick={() => setProviderTermsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PROVIDER_TERMS_ROUNDS.map((round) => {
            const selected = providerTermsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setProviderTermsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good provider terms choice."
                          : "Review the provider terms gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="regulator-inquiry-assurance"
        className="checklist-phase"
        aria-label="AI regulator inquiry assurance game"
      >
        <h2>AI regulator inquiry assurance</h2>
        <p>
          Practice answering an inquiry from a maintained evidence index, routing it through one
          named responder with legal review, tracking deadlines with a deputy, and verifying each
          answer against evidence. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {regulatorInquiryGame.correct}/{regulatorInquiryGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {regulatorInquiryGame.complete && (
            <Button variant="outline" onClick={() => setRegulatorInquiryAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {REGULATOR_INQUIRY_ROUNDS.map((round) => {
            const selected = regulatorInquiryAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRegulatorInquiryAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good regulator inquiry choice."
                          : "Review the inquiry response gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="incident-evidence-assurance"
        className="checklist-phase"
        aria-label="AI incident evidence preservation assurance game"
      >
        <h2>AI incident evidence preservation assurance</h2>
        <p>
          Practice capturing prompts, retrieved context, model versions and outputs at the time,
          applying a hold before rotation, keeping chain of custody, and demonstrating root cause
          with a replayable trail. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {incidentEvidenceGame.correct}/{incidentEvidenceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {incidentEvidenceGame.complete && (
            <Button variant="outline" onClick={() => setIncidentEvidenceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INCIDENT_EVIDENCE_ROUNDS.map((round) => {
            const selected = incidentEvidenceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setIncidentEvidenceAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good incident evidence choice."
                          : "Review the evidence preservation gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="data-subject-request-assurance"
        className="checklist-phase"
        aria-label="AI data subject request assurance game"
      >
        <h2>AI data subject request assurance</h2>
        <p>
          Practice verifying identity and tracking deadlines, searching prompts, logs, agent memory
          and derived summaries, redacting third-party data before disclosure, propagating
          corrections, and recording how each request was handled. Scenarios are learning prompts,
          not compliance determinations.
        </p>
        <p>
          <strong>
            {dataSubjectRequestGame.correct}/{dataSubjectRequestGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {dataSubjectRequestGame.complete && (
            <Button variant="outline" onClick={() => setDataSubjectRequestAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {DATA_SUBJECT_REQUEST_ROUNDS.map((round) => {
            const selected = dataSubjectRequestAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setDataSubjectRequestAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good request handling choice."
                          : "Review the request handling gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="cost-allocation-assurance"
        className="checklist-phase"
        aria-label="AI usage cost allocation assurance game"
      >
        <h2>AI usage cost allocation assurance</h2>
        <p>
          Practice metering usage per team, system and feature, agreeing a chargeback or showback
          basis with finance, giving owners their spend against a budget, reviewing runaway and idle
          usage, and pulling untracked tools into the same picture. Scenarios are learning prompts,
          not compliance determinations.
        </p>
        <p>
          <strong>
            {costAllocationGame.correct}/{costAllocationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {costAllocationGame.complete && (
            <Button variant="outline" onClick={() => setCostAllocationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {COST_ALLOCATION_ROUNDS.map((round) => {
            const selected = costAllocationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCostAllocationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good allocation choice."
                          : "Review the allocation gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="shadow-ai-assurance"
        className="checklist-phase"
        aria-label="Shadow AI containment assurance game"
      >
        <h2>Shadow AI containment assurance</h2>
        <p>
          Practice finding unsanctioned tools through network, spend and identity signals, making
          the sanctioned route easier than the workaround, bounding data reach with egress controls,
          offering amnesty for disclosure, and recording a disposition for every tool found.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {shadowAiGame.correct}/{shadowAiGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {shadowAiGame.complete && (
            <Button variant="outline" onClick={() => setShadowAiAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SHADOW_AI_ROUNDS.map((round) => {
            const selected = shadowAiAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setShadowAiAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good containment choice."
                          : "Review the containment gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="rag-grounding-assurance"
        className="checklist-phase"
        aria-label="Retrieval grounding integrity assurance game"
      >
        <h2>Retrieval grounding integrity assurance</h2>
        <p>
          Practice giving retrieved sources an owner and refresh date, requiring answers to cite the
          passages they rely on, resolving conflicts by a stated rule, making abstention acceptable,
          and monitoring the corpus for drift and poisoning. Scenarios are learning prompts, not
          compliance determinations.
        </p>
        <p>
          <strong>
            {ragGroundingGame.correct}/{ragGroundingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {ragGroundingGame.complete && (
            <Button variant="outline" onClick={() => setRagGroundingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RAG_GROUNDING_ROUNDS.map((round) => {
            const selected = ragGroundingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRagGroundingAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good grounding choice."
                          : "Review the grounding gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="assurance-case-assurance"
        className="checklist-phase"
        aria-label="AI assurance case integrity assurance game"
      >
        <h2>AI assurance case integrity assurance</h2>
        <p>
          Practice tying claims to evidence that shows the control operating, dating evidence and
          refreshing it on change, recording known gaps as defeaters, re-assessing when scope or data
          moves, and routing approvers to the argument rather than a summary. Scenarios are learning
          prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {assuranceCaseGame.correct}/{assuranceCaseGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {assuranceCaseGame.complete && (
            <Button variant="outline" onClick={() => setAssuranceCaseAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ASSURANCE_CASE_ROUNDS.map((round) => {
            const selected = assuranceCaseAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAssuranceCaseAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good assurance case choice."
                          : "Review the assurance case gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="prompt-governance-assurance"
        className="checklist-phase"
        aria-label="AI prompt and instruction governance assurance game"
      >
        <h2>AI prompt &amp; instruction governance assurance</h2>
        <p>
          Practice versioning prompts with a diffable history, reviewing instruction changes with a
          recorded approver, growing the regression set from incidents, releasing with a tested
          rollback, and monitoring behaviour for drift after release. Scenarios are learning prompts,
          not compliance determinations.
        </p>
        <p>
          <strong>
            {promptGovernanceGame.correct}/{promptGovernanceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {promptGovernanceGame.complete && (
            <Button variant="outline" onClick={() => setPromptGovernanceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PROMPT_GOVERNANCE_ROUNDS.map((round) => {
            const selected = promptGovernanceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPromptGovernanceAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good instruction governance choice."
                          : "Review the instruction governance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="vuln-management-assurance"
        className="checklist-phase"
        aria-label="AI vulnerability management assurance game"
      >
        <h2>AI vulnerability management assurance</h2>
        <p>
          Practice extending inventory and scanning to model SDKs, runtimes and containers, applying
          compensating controls with dated exceptions when patching cannot happen, triaging by
          exploitability and exposure, verifying the deployed version, and tracking provider security
          notices. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {vulnManagementGame.correct}/{vulnManagementGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {vulnManagementGame.complete && (
            <Button variant="outline" onClick={() => setVulnManagementAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {VULN_MANAGEMENT_ROUNDS.map((round) => {
            const selected = vulnManagementAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setVulnManagementAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good vulnerability management choice."
                          : "Review the vulnerability management gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="data-residency-assurance"
        className="checklist-phase"
        aria-label="AI data residency and sovereignty assurance game"
      >
        <h2>AI data residency &amp; sovereignty assurance</h2>
        <p>
          Practice verifying where each call path processes data, documenting support-access locations
          and transfer bases, tracking subprocessor and region changes, asking for evidence covering
          backups and replicas, and stopping undocumented transfers. Scenarios are learning prompts,
          not compliance determinations.
        </p>
        <p>
          <strong>
            {dataResidencyGame.correct}/{dataResidencyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {dataResidencyGame.complete && (
            <Button variant="outline" onClick={() => setDataResidencyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {DATA_RESIDENCY_ROUNDS.map((round) => {
            const selected = dataResidencyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setDataResidencyAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good residency choice."
                          : "Review the residency gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="agent-evaluation-assurance"
        className="checklist-phase"
        aria-label="AI agent evaluation assurance game"
      >
        <h2>AI agent evaluation assurance</h2>
        <p>
          Practice reviewing tool-use traces rather than final answers, defining success criteria per
          task type, routing repeated failures through a taxonomy, evaluating with representative
          tools and errors, and re-running regression when tools, prompts or models change. Scenarios
          are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {agentEvaluationGame.correct}/{agentEvaluationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {agentEvaluationGame.complete && (
            <Button variant="outline" onClick={() => setAgentEvaluationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {AGENT_EVALUATION_ROUNDS.map((round) => {
            const selected = agentEvaluationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAgentEvaluationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good evaluation choice."
                          : "Review the evaluation gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="content-provenance-assurance"
        className="checklist-phase"
        aria-label="AI content provenance and labelling assurance game"
      >
        <h2>AI content provenance &amp; labelling assurance</h2>
        <p>
          Practice marking at generation and testing every export path, verifying marks survive format
          and channel changes, adding visible disclosure where a mark cannot travel, detecting stripped
          or unlabeled content on ingest, and keeping a register of channels where labelling is
          required. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {contentProvenanceGame.correct}/{contentProvenanceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {contentProvenanceGame.complete && (
            <Button variant="outline" onClick={() => setContentProvenanceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CONTENT_PROVENANCE_ROUNDS.map((round) => {
            const selected = contentProvenanceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setContentProvenanceAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good provenance choice."
                          : "Review the provenance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="test-isolation-assurance"
        className="checklist-phase"
        aria-label="AI test and sandbox isolation assurance game"
      >
        <h2>AI test &amp; sandbox isolation assurance</h2>
        <p>
          Practice keeping production personal data out of test environments, using isolated model
          endpoints and keys, removing production write access from test credentials, controlling
          egress to public tools, and expiring environments with a recorded owner for extensions.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {testIsolationGame.correct}/{testIsolationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {testIsolationGame.complete && (
            <Button variant="outline" onClick={() => setTestIsolationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {TEST_ISOLATION_ROUNDS.map((round) => {
            const selected = testIsolationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTestIsolationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good isolation choice."
                          : "Review the isolation gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="value-realisation-assurance"
        className="checklist-phase"
        aria-label="AI value realisation assurance game"
      >
        <h2>AI value realisation assurance</h2>
        <p>
          Practice capturing a baseline before deployment, measuring outcomes rather than activity,
          stating attribution honestly alongside other changes, measuring real usage instead of
          licences, and recording review decisions with the authority to scale, fix or stop. Scenarios
          are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {valueRealisationGame.correct}/{valueRealisationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {valueRealisationGame.complete && (
            <Button variant="outline" onClick={() => setValueRealisationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {VALUE_REALISATION_ROUNDS.map((round) => {
            const selected = valueRealisationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setValueRealisationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good value assurance choice."
                          : "Review the value assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="third-party-audit-assurance"
        className="checklist-phase"
        aria-label="AI third-party audit and assurance access game"
      >
        <h2>AI third-party audit &amp; assurance access</h2>
        <p>
          Practice securing a right to audit or receive assurance evidence, extending scope to models,
          data and subprocessors, exercising the right on a risk-based cadence, reading reports against
          actual use, and verifying findings to closure with evidence. Scenarios are learning prompts,
          not compliance determinations.
        </p>
        <p>
          <strong>
            {auditRightsGame.correct}/{auditRightsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {auditRightsGame.complete && (
            <Button variant="outline" onClick={() => setAuditRightsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {AUDIT_RIGHTS_ROUNDS.map((round) => {
            const selected = auditRightsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAuditRightsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good assurance access choice."
                          : "Review the assurance access gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="consent-withdrawal-assurance"
        className="checklist-phase"
        aria-label="AI consent withdrawal assurance game"
      >
        <h2>AI consent withdrawal assurance</h2>
        <p>
          Practice treating derived artifacts as in scope, stating and measuring a removal window,
          requiring confirmation from downstream processors, recording per-withdrawal evidence, and
          checking consent state at the point of reuse. Scenarios are learning prompts, not compliance
          determinations.
        </p>
        <p>
          <strong>
            {consentWithdrawalGame.correct}/{consentWithdrawalGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {consentWithdrawalGame.complete && (
            <Button variant="outline" onClick={() => setConsentWithdrawalAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CONSENT_WITHDRAWAL_ROUNDS.map((round) => {
            const selected = consentWithdrawalAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setConsentWithdrawalAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good withdrawal choice."
                          : "Review the withdrawal gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="complaint-feedback-assurance"
        className="checklist-phase"
        aria-label="AI complaint and feedback loop assurance game"
      >
        <h2>AI complaint &amp; feedback loop assurance</h2>
        <p>
          Practice placing intake where the decision happens, triaging by theme so patterns surface,
          measuring response against the promise, tracing root cause to the model, data, prompt or
          process, and closing the loop with the people who reported it. Scenarios are learning
          prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {complaintFeedbackGame.correct}/{complaintFeedbackGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {complaintFeedbackGame.complete && (
            <Button variant="outline" onClick={() => setComplaintFeedbackAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {COMPLAINT_FEEDBACK_ROUNDS.map((round) => {
            const selected = complaintFeedbackAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setComplaintFeedbackAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good feedback loop choice."
                          : "Review the feedback loop gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="risk-transfer-assurance"
        className="checklist-phase"
        aria-label="AI risk transfer and insurance assurance game"
      >
        <h2>AI risk transfer &amp; insurance assurance</h2>
        <p>
          Practice mapping AI risk to actual policy wording and exclusions, notifying insurers within
          the policy terms, matching indemnities and caps to the exposure carried, testing limits
          against plausible loss scenarios, and assembling claim evidence before an incident. Scenarios
          are learning prompts, not compliance or insurance determinations.
        </p>
        <p>
          <strong>
            {riskTransferGame.correct}/{riskTransferGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {riskTransferGame.complete && (
            <Button variant="outline" onClick={() => setRiskTransferAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RISK_TRANSFER_ROUNDS.map((round) => {
            const selected = riskTransferAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRiskTransferAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good risk transfer choice."
                          : "Review the risk transfer gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="assurance-independence-assurance"
        className="checklist-phase"
        aria-label="AI assurance independence and audit coverage game"
      >
        <h2>AI assurance independence &amp; audit coverage</h2>
        <p>
          Practice keeping assurance independent of the build team, choosing coverage by risk with
          recorded exclusions, reporting findings unedited to a level with authority, declaring
          reliance on supplier evidence, and re-testing findings independently before closure.
          Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {assuranceIndependenceGame.correct}/{assuranceIndependenceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {assuranceIndependenceGame.complete && (
            <Button variant="outline" onClick={() => setAssuranceIndependenceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ASSURANCE_INDEPENDENCE_ROUNDS.map((round) => {
            const selected = assuranceIndependenceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAssuranceIndependenceAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good independence choice."
                          : "Review the independence gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="regulatory-horizon-assurance"
        className="checklist-phase"
        aria-label="AI regulatory horizon scanning assurance game"
      >
        <h2>AI regulatory horizon scanning assurance</h2>
        <p>
          Practice naming sources and a scanning cadence, triaging each change against the system
          inventory, setting internal deadlines ahead of external ones, updating the controls and
          contracts the obligation touches, and recording no-action calls with their rationale.
          Scenarios are learning prompts, not compliance or legal determinations.
        </p>
        <p>
          <strong>
            {regulatoryHorizonGame.correct}/{regulatoryHorizonGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {regulatoryHorizonGame.complete && (
            <Button variant="outline" onClick={() => setRegulatoryHorizonAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {REGULATORY_HORIZON_ROUNDS.map((round) => {
            const selected = regulatoryHorizonAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRegulatoryHorizonAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good scanning choice."
                          : "Review the scanning gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="output-sampling-assurance"
        className="checklist-phase"
        aria-label="AI production output sampling assurance game"
      >
        <h2>AI production output sampling assurance</h2>
        <p>
          Practice weighting sample rates by risk and volume, separating reviewers from the producing
          queue, scoring against a calibrated rubric, stratifying coverage across channels and
          languages, and trending findings by category so drift is visible. Scenarios are learning
          prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {outputSamplingGame.correct}/{outputSamplingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {outputSamplingGame.complete && (
            <Button variant="outline" onClick={() => setOutputSamplingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {OUTPUT_SAMPLING_ROUNDS.map((round) => {
            const selected = outputSamplingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setOutputSamplingAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good sampling choice."
                          : "Review the sampling gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="claims-substantiation-assurance"
        className="checklist-phase"
        aria-label="AI public claims and marketing substantiation game"
      >
        <h2>AI public claims &amp; marketing substantiation</h2>
        <p>
          Practice replacing unevidenced superlatives with testable claims, sourcing and verifying
          vendor claims, re-running evidence when the system changes, describing compliance work
          accurately, and withdrawing a claim everywhere it appears. Scenarios are learning prompts,
          not compliance or legal determinations.
        </p>
        <p>
          <strong>
            {claimsSubstantiationGame.correct}/{claimsSubstantiationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {claimsSubstantiationGame.complete && (
            <Button variant="outline" onClick={() => setClaimsSubstantiationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CLAIMS_SUBSTANTIATION_ROUNDS.map((round) => {
            const selected = claimsSubstantiationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setClaimsSubstantiationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good substantiation choice."
                          : "Review the claims gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="worker-monitoring-assurance"
        className="checklist-phase"
        aria-label="AI worker monitoring and algorithmic management game"
      >
        <h2>AI worker monitoring &amp; algorithmic management</h2>
        <p>
          Practice justifying each monitoring use with a recorded necessity and proportionality test,
          disclosing what is captured and why, keeping a human in decisions about work and pay,
          giving workers access and appeal, and deleting data on a stated schedule. Scenarios are
          learning prompts, not compliance or employment-law determinations.
        </p>
        <p>
          <strong>
            {workerMonitoringGame.correct}/{workerMonitoringGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {workerMonitoringGame.complete && (
            <Button variant="outline" onClick={() => setWorkerMonitoringAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {WORKER_MONITORING_ROUNDS.map((round) => {
            const selected = workerMonitoringAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setWorkerMonitoringAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good monitoring choice."
                          : "Review the monitoring gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="research-ethics-assurance"
        className="checklist-phase"
        aria-label="AI research ethics and human-participant testing game"
      >
        <h2>AI research ethics &amp; human-participant testing</h2>
        <p>
          Practice reviewing a study before participants start, disclosing what is retained and how
          outputs are used, taking specific and revocable consent, stopping when a participant
          signals distress, and reporting inconvenient findings with their limits. Scenarios are
          learning prompts, not ethics-committee or legal determinations.
        </p>
        <p>
          <strong>
            {researchEthicsGame.correct}/{researchEthicsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {researchEthicsGame.complete && (
            <Button variant="outline" onClick={() => setResearchEthicsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RESEARCH_ETHICS_ROUNDS.map((round) => {
            const selected = researchEthicsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setResearchEthicsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good ethics choice."
                          : "Review the participant safeguard."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="speak-up-assurance"
        className="checklist-phase"
        aria-label="AI speak-up and concern reporting game"
      >
        <h2>AI speak-up &amp; concern reporting</h2>
        <p>
          Practice offering routes outside the line, treating adverse treatment after a concern as
          retaliation risk, triaging concerns with an owner and a clock, giving reporters an outcome,
          and escalating repeat themes into governance. Scenarios are learning prompts, not
          compliance or employment-law determinations.
        </p>
        <p>
          <strong>
            {speakUpGame.correct}/{speakUpGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {speakUpGame.complete && (
            <Button variant="outline" onClick={() => setSpeakUpAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SPEAK_UP_ROUNDS.map((round) => {
            const selected = speakUpAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSpeakUpAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good speak-up choice."
                          : "Review the reporting gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="hiring-screening-assurance"
        className="checklist-phase"
        aria-label="AI hiring and candidate screening game"
      >
        <h2>AI hiring &amp; candidate screening</h2>
        <p>
          Practice measuring adverse impact on your own pipeline instead of trusting a vendor fairness
          claim, putting a human in front of every rejection, disclosing AI assessment to candidates,
          offering a genuine accessible alternative, and retaining records that explain a decision.
          Scenarios are learning prompts, not compliance or employment-law determinations.
        </p>
        <p>
          <strong>
            {hiringScreeningGame.correct}/{hiringScreeningGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {hiringScreeningGame.complete && (
            <Button variant="outline" onClick={() => setHiringScreeningAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {HIRING_SCREENING_ROUNDS.map((round) => {
            const selected = hiringScreeningAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setHiringScreeningAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good screening choice."
                          : "Review the screening gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="annotation-workforce-assurance"
        className="checklist-phase"
        aria-label="AI data annotation and labelling workforce game"
      >
        <h2>AI data annotation &amp; labelling workforce</h2>
        <p>
          Practice defining labels with worked examples before work starts, paying for real effort
          including rework, limiting harmful content with warnings, rotation, support and a
          penalty-free opt-out, routing annotator disagreement to model owners, and verifying supplier
          terms by sampling the work. Scenarios are learning prompts, not compliance or
          employment-law determinations.
        </p>
        <p>
          <strong>
            {annotationWorkforceGame.correct}/{annotationWorkforceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {annotationWorkforceGame.complete && (
            <Button variant="outline" onClick={() => setAnnotationWorkforceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ANNOTATION_WORKFORCE_ROUNDS.map((round) => {
            const selected = annotationWorkforceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAnnotationWorkforceAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good labelling choice."
                          : "Review the labelling gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="ai-handover-assurance"
        className="checklist-phase"
        aria-label="AI handover and key-person dependency game"
      >
        <h2>AI handover &amp; key-person dependency</h2>
        <p>
          Practice naming a second owner for every AI asset, documenting design rationale and known
          limits, moving access and vendor contacts to the team, rehearsing a handover and fixing what
          it exposes, and checking each asset off before a leaver's access is removed. Scenarios are
          learning prompts, not compliance or employment-law determinations.
        </p>
        <p>
          <strong>
            {aiHandoverGame.correct}/{aiHandoverGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {aiHandoverGame.complete && (
            <Button variant="outline" onClick={() => setAiHandoverAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {AI_HANDOVER_ROUNDS.map((round) => {
            const selected = aiHandoverAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAiHandoverAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good handover choice."
                          : "Review the handover gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="multilingual-assurance"
        className="checklist-phase"
        aria-label="Multilingual and localisation assurance game"
      >
        <h2>Multilingual &amp; localisation assurance</h2>
        <p>
          Practice evaluating each supported language instead of inferring from English results,
          testing guardrails and refusals across languages and scripts, reviewing local law and
          accessibility per market, staffing in-language review, and tying language coverage to real
          volumes. Scenarios are learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {multilingualGame.correct}/{multilingualGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {multilingualGame.complete && (
            <Button variant="outline" onClick={() => setMultilingualAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MULTILINGUAL_ROUNDS.map((round) => {
            const selected = multilingualAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setMultilingualAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good localisation choice."
                          : "Review the localisation gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="coding-assistants-assurance"
        className="checklist-phase"
        aria-label="AI coding assistant governance game"
      >
        <h2>AI coding assistant governance</h2>
        <p>
          Practice reviewing generated code like human code, checking licence and provenance of
          suggestions, rotating secrets after a paste and blocking prohibited inputs, approving
          assistants before they touch repositories, and keeping the author accountable. Scenarios are
          learning prompts, not compliance determinations.
        </p>
        <p>
          <strong>
            {codingAssistantsGame.correct}/{codingAssistantsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {codingAssistantsGame.complete && (
            <Button variant="outline" onClick={() => setCodingAssistantsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CODING_ASSISTANTS_ROUNDS.map((round) => {
            const selected = codingAssistantsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCodingAssistantsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good assistant governance choice."
                          : "Review the assistant governance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="ma-diligence-assurance"
        className="checklist-phase"
        aria-label="AI due diligence for mergers and divestments game"
      >
        <h2>AI due diligence for mergers &amp; divestments</h2>
        <p>
          Practice building the AI inventory from real operations, checking change-of-control and
          termination rights before signing, surfacing inherited incidents and regulator contact,
          confirming data rights transfer or costing a retrain, and planning what must keep running on
          day one. Scenarios are learning prompts, not legal, tax or investment advice.
        </p>
        <p>
          <strong>
            {maDiligenceGame.correct}/{maDiligenceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {maDiligenceGame.complete && (
            <Button variant="outline" onClick={() => setMaDiligenceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MA_DILIGENCE_ROUNDS.map((round) => {
            const selected = maDiligenceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setMaDiligenceAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good diligence choice."
                          : "Review the diligence gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="children-age-assurance"
        className="checklist-phase"
        aria-label="AI services for children and age assurance game"
      >
        <h2>AI services for children &amp; age assurance</h2>
        <p>
          Practice choosing age assurance proportionate to the risk, setting age-appropriate defaults,
          recording revocable parental consent, assessing child-specific harm such as stranger contact
          and self-harm, and routing disclosures to trained responders. Scenarios are learning prompts,
          not legal advice or a substitute for a child-safety assessment.
        </p>
        <p>
          <strong>
            {childrenAgeGame.correct}/{childrenAgeGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {childrenAgeGame.complete && (
            <Button variant="outline" onClick={() => setChildrenAgeAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CHILDREN_AGE_ROUNDS.map((round) => {
            const selected = childrenAgeAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setChildrenAgeAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good child-safety choice."
                          : "Review the child-safety gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="worker-consultation-assurance"
        className="checklist-phase"
        aria-label="Worker consultation on AI game"
      >
        <h2>Worker consultation on AI</h2>
        <p>
          Practice consulting before the decision rather than announcing it, identifying the roles
          whose work actually changes, explaining purpose, data and monitoring in plain terms,
          answering concerns with changes or recorded reasons, and consulting again when the system or
          its use changes. Scenarios are learning prompts, not legal advice on consultation duties.
        </p>
        <p>
          <strong>
            {workerConsultationGame.correct}/{workerConsultationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {workerConsultationGame.complete && (
            <Button variant="outline" onClick={() => setWorkerConsultationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {WORKER_CONSULTATION_ROUNDS.map((round) => {
            const selected = workerConsultationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setWorkerConsultationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good consultation choice."
                          : "Review the consultation gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="summarisation-records-assurance"
        className="checklist-phase"
        aria-label="AI summarisation and record accuracy game"
      >
        <h2>AI summarisation &amp; record accuracy</h2>
        <p>
          Practice keeping AI summaries of meetings, calls and cases trustworthy: defining what may
          never be summarised, requiring a human to confirm a summary before it becomes the record,
          carrying corrections into every downstream copy, telling people their conversation is
          summarised and letting them object, and applying retention and access rules to transcripts
          as well as summaries. Scenarios are learning prompts, not legal advice on record-keeping
          duties.
        </p>
        <p>
          <strong>
            {summarisationRecordsGame.correct}/{summarisationRecordsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {summarisationRecordsGame.complete && (
            <Button variant="outline" onClick={() => setSummarisationRecordsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SUMMARISATION_RECORDS_ROUNDS.map((round) => {
            const selected = summarisationRecordsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSummarisationRecordsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good record-accuracy choice."
                          : "Review the record-accuracy gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="regulated-advice-assurance"
        className="checklist-phase"
        aria-label="AI in regulated advice game"
      >
        <h2>AI in regulated advice</h2>
        <p>
          Practice keeping AI inside regulated advice boundaries: defining what advice the tool may
          give against the firm's permissions, requiring a suitably qualified reviewer who can change
          the advice, gathering the facts and suitability information the advice depends on, routing
          out-of-scope questions to a professional, and keeping a record of what was advised and by
          whom. Scenarios are learning prompts, not legal or regulatory advice.
        </p>
        <p>
          <strong>
            {regulatedAdviceGame.correct}/{regulatedAdviceGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {regulatedAdviceGame.complete && (
            <Button variant="outline" onClick={() => setRegulatedAdviceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {REGULATED_ADVICE_ROUNDS.map((round) => {
            const selected = regulatedAdviceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRegulatedAdviceAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good advice-boundary choice."
                          : "Review the advice-boundary gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="public-sector-fairness-assurance"
        className="checklist-phase"
        aria-label="Public-sector automated decision fairness game"
      >
        <h2>Public-sector automated decisions</h2>
        <p>
          Practice keeping automated public decisions fair and contestable: publishing the legal basis
          and policy for the automated element, ensuring a human with authority reviews before the
          decision takes effect, giving plain reasons, making the appeal route genuinely usable, and
          investigating disparate impact rather than assuming an objective model. Scenarios are
          learning prompts, not legal advice on public law or equality duties.
        </p>
        <p>
          <strong>
            {publicSectorFairnessGame.correct}/{publicSectorFairnessGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {publicSectorFairnessGame.complete && (
            <Button variant="outline" onClick={() => setPublicSectorFairnessAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PUBLIC_SECTOR_FAIRNESS_ROUNDS.map((round) => {
            const selected = publicSectorFairnessAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPublicSectorFairnessAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good fairness choice."
                          : "Review the fairness gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="algorithmic-pricing-assurance"
        className="checklist-phase"
        aria-label="Algorithmic pricing and competition game"
      >
        <h2>Algorithmic pricing &amp; competition</h2>
        <p>
          Practice keeping AI pricing inside competition law: keeping competitor data out of price
          setting, requiring human approval for material price moves, assessing the signalling risk of
          public price statements, treating parallel market movement as a collusion indicator with a
          legal escalation route, and keeping an audit trail of decisions and model versions. Scenarios
          are learning prompts, not legal advice on competition law.
        </p>
        <p>
          <strong>
            {algorithmicPricingGame.correct}/{algorithmicPricingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {algorithmicPricingGame.complete && (
            <Button variant="outline" onClick={() => setAlgorithmicPricingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ALGORITHMIC_PRICING_ROUNDS.map((round) => {
            const selected = algorithmicPricingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAlgorithmicPricingAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good competition choice."
                          : "Review the competition gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="export-controls-assurance"
        className="checklist-phase"
        aria-label="AI export control and sanctions game"
      >
        <h2>AI export control &amp; sanctions</h2>
        <p>
          Practice keeping AI capability inside export control and sanctions rules: screening end users
          rather than delegating it to a reseller, classifying a fine-tune's capability before
          releasing weights, treating logging-removal and undisclosed end-use requests as red flags,
          testing screening for near-matches and ownership, and recording refusals with reasons and
          decision makers. Scenarios are learning prompts, not legal advice on export control or
          sanctions.
        </p>
        <p>
          <strong>
            {exportControlsGame.correct}/{exportControlsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {exportControlsGame.complete && (
            <Button variant="outline" onClick={() => setExportControlsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EXPORT_CONTROLS_ROUNDS.map((round) => {
            const selected = exportControlsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setExportControlsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good controls choice."
                          : "Review the controls gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="vulnerable-customers-assurance"
        className="checklist-phase"
        aria-label="AI and vulnerable customers game"
      >
        <h2>AI &amp; vulnerable customers</h2>
        <p>
          Practice protecting people in vulnerable circumstances from automated harm: pausing adverse
          action on hardship signals for human review, adapting the interaction when someone discloses
          bereavement or illness, limiting vulnerability data to what was disclosed or needed, giving
          trained staff real override authority, and recording support and outcomes for vulnerable
          groups. Scenarios are learning prompts, not legal advice on consumer duty or vulnerability
          duties.
        </p>
        <p>
          <strong>
            {vulnerableCustomerGame.correct}/{vulnerableCustomerGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {vulnerableCustomerGame.complete && (
            <Button variant="outline" onClick={() => setVulnerableCustomerAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {VULNERABLE_CUSTOMER_ROUNDS.map((round) => {
            const selected = vulnerableCustomerAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setVulnerableCustomerAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good vulnerability choice."
                          : "Review the vulnerability gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="education-integrity-assurance"
        className="checklist-phase"
        aria-label="AI in education and assessment game"
      >
        <h2>AI in education &amp; assessment</h2>
        <p>
          Practice handling AI in education fairly: setting permitted use per assessment before work
          starts, treating detector output as evidence rather than a verdict, redesigning assessment
          that a model can complete, giving students a disclosure step, and training markers so
          decisions are consistent, recorded and appealable. Scenarios are learning prompts, not
          academic policy or legal advice.
        </p>
        <p>
          <strong>
            {educationIntegrityGame.correct}/{educationIntegrityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {educationIntegrityGame.complete && (
            <Button variant="outline" onClick={() => setEducationIntegrityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EDUCATION_INTEGRITY_ROUNDS.map((round) => {
            const selected = educationIntegrityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEducationIntegrityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good integrity choice."
                          : "Review the integrity gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="insurance-ai-assurance"
        className="checklist-phase"
        aria-label="AI in insurance underwriting and claims game"
      >
        <h2>AI in insurance underwriting &amp; claims</h2>
        <p>
          Practice keeping AI pricing and claims decisions fair: testing for proxies rather than
          trusting factors that never name a protected characteristic, reviewing adverse automated
          decisions before they reach the customer, giving specific reasons and a route to review,
          justifying rating factors actuarially, and investigating complaint clusters instead of
          explaining them away. Scenarios are learning prompts, not actuarial or legal advice.
        </p>
        <p>
          <strong>
            {insuranceAiGame.correct}/{insuranceAiGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {insuranceAiGame.complete && (
            <Button variant="outline" onClick={() => setInsuranceAiAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INSURANCE_AI_ROUNDS.map((round) => {
            const selected = insuranceAiAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setInsuranceAiAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good underwriting choice."
                          : "Review the underwriting gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="incident-notification-assurance"
        className="checklist-phase"
        aria-label="AI incident notification to affected individuals game"
      >
        <h2>AI incident notification to affected individuals</h2>
        <p>
          Practice notifying people affected by AI incidents: defining when notification is required,
          identifying and reaching those affected, explaining impact and next steps clearly, offering
          a staffed remedy and recourse route, and keeping regulator, client and individual messages
          consistent while logging outcomes for follow-up. Scenarios are learning prompts, not legal
          advice on notification duties.
        </p>
        <p>
          <strong>
            {incidentNotificationGame.correct}/{incidentNotificationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {incidentNotificationGame.complete && (
            <Button variant="outline" onClick={() => setIncidentNotificationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INCIDENT_NOTIFICATION_ROUNDS.map((round) => {
            const selected = incidentNotificationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setIncidentNotificationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good notification choice."
                          : "Review the notification gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="elections-integrity-assurance"
        className="checklist-phase"
        aria-label="AI in elections and political advertising game"
      >
        <h2>AI in elections &amp; political advertising</h2>
        <p>
          Practice responsible AI use in election-period communications and political advertising:
          labeling synthetic or altered content with provenance, constraining targeting to lawful and
          non-manipulative use, reviewing claims before publication, recording sponsors and accountable
          owners, and responding rapidly to correct or pause harmful or misleading AI content.
          Scenarios are learning prompts, not legal advice on election or advertising law.
        </p>
        <p>
          <strong>
            {electionsIntegrityGame.correct}/{electionsIntegrityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {electionsIntegrityGame.complete && (
            <Button variant="outline" onClick={() => setElectionsIntegrityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ELECTIONS_INTEGRITY_ROUNDS.map((round) => {
            const selected = electionsIntegrityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setElectionsIntegrityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good integrity choice."
                          : "Review the integrity gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="journalism-integrity-assurance"
        className="checklist-phase"
        aria-label="AI in journalism and newsroom verification game"
      >
        <h2>AI in journalism &amp; newsroom verification</h2>
        <p>
          Practice responsible AI use in newsrooms: verifying AI-assisted drafts and quotes against
          primary sources, requiring a named editor to sign off AI-influenced output, labelling
          synthetic media and checking provenance, publishing corrections and retractions with a clear
          trail, and telling audiences when AI played a material role. Scenarios are learning prompts,
          not editorial or legal advice.
        </p>
        <p>
          <strong>
            {journalismIntegrityGame.correct}/{journalismIntegrityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {journalismIntegrityGame.complete && (
            <Button variant="outline" onClick={() => setJournalismIntegrityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {JOURNALISM_INTEGRITY_ROUNDS.map((round) => {
            const selected = journalismIntegrityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setJournalismIntegrityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good editorial safeguard."
                          : "Review the editorial gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="clinical-documentation-assurance"
        className="checklist-phase"
        aria-label="AI clinical documentation and ambient scribing game"
      >
        <h2>AI clinical documentation &amp; ambient scribing</h2>
        <p>
          Practice keeping AI-drafted clinical records safe: requiring clinician review and sign-off
          before a note becomes the record, telling patients when encounters are recorded and capturing
          consent, checking drafts for omitted findings and invented content, monitoring
          documentation-driven billing drift, and keeping an audit trail of AI authorship with a route
          for patients to see and correct the record. Scenarios are learning prompts, not clinical,
          coding or legal advice.
        </p>
        <p>
          <strong>
            {clinicalDocumentationGame.correct}/{clinicalDocumentationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {clinicalDocumentationGame.complete && (
            <Button variant="outline" onClick={() => setClinicalDocumentationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CLINICAL_DOCUMENTATION_ROUNDS.map((round) => {
            const selected = clinicalDocumentationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setClinicalDocumentationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good documentation safeguard."
                          : "Review the documentation gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="ediscovery-assurance"
        className="checklist-phase"
        aria-label="AI in legal e-discovery and evidence preservation game"
      >
        <h2>AI in legal e-discovery &amp; evidence preservation</h2>
        <p>
          Practice defensible AI-assisted litigation and investigation work: issuing and monitoring
          legal holds across messaging and devices, validating and sampling AI review rather than
          trusting it, explaining how documents were classified, keeping privilege calls with qualified
          lawyers and a log, and preserving enough to reconstruct a produced set and disclose defects.
          Scenarios are learning prompts, not legal advice.
        </p>
        <p>
          <strong>
            {ediscoveryGame.correct}/{ediscoveryGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {ediscoveryGame.complete && (
            <Button variant="outline" onClick={() => setEdiscoveryAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EDISCOVERY_ROUNDS.map((round) => {
            const selected = ediscoveryAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEdiscoveryAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good defensibility choice."
                          : "Review the defensibility gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="critical-infrastructure-assurance"
        className="checklist-phase"
        aria-label="AI in energy grid and critical infrastructure game"
      >
        <h2>AI in energy grid &amp; critical infrastructure</h2>
        <p>
          Practice keeping AI in safety-critical operations under control: preserving operator
          authority over consequential actions, putting limits and interlocks between model output and
          physical systems, testing behaviour under degraded data and extreme weather, governing
          third-party access to operational telemetry, disclosing AI influence on service decisions,
          and rehearsing a manual fallback when the model is unavailable. Scenarios are learning
          prompts, not engineering, safety or regulatory advice.
        </p>
        <p>
          <strong>
            {criticalInfrastructureGame.correct}/{criticalInfrastructureGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {criticalInfrastructureGame.complete && (
            <Button variant="outline" onClick={() => setCriticalInfrastructureAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CRITICAL_INFRASTRUCTURE_ROUNDS.map((round) => {
            const selected = criticalInfrastructureAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCriticalInfrastructureAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good operational safeguard."
                          : "Review the operational gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="tenant-screening-assurance"
        className="checklist-phase"
        aria-label="AI in tenant screening and housing access game"
      >
        <h2>AI in tenant screening &amp; housing access</h2>
        <p>
          Practice keeping AI-assisted rental screening fair: testing criteria for proxies such as
          source of income, telling applicants a model is used and what data drives it, requiring
          human review before rejection, giving specific reasons with a route to correct errors,
          verifying screening data sources, and retaining audit evidence for fair-housing scrutiny.
          Scenarios are learning prompts, not fair-housing or legal advice.
        </p>
        <p>
          <strong>
            {tenantScreeningGame.correct}/{tenantScreeningGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {tenantScreeningGame.complete && (
            <Button variant="outline" onClick={() => setTenantScreeningAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {TENANT_SCREENING_ROUNDS.map((round) => {
            const selected = tenantScreeningAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTenantScreeningAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good housing-access safeguard."
                          : "Review the housing-access gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="agri-food-assurance"
        className="checklist-phase"
        aria-label="AI in agriculture and food-system decisions game"
      >
        <h2>AI in agriculture &amp; food-system decisions</h2>
        <p>
          Practice governing AI in farming and food supply: validating recommendations for local
          conditions, keeping farm data with the grower, checking advice does not disadvantage
          smallholders or thin-data regions, keeping human sign-off and audit trails on food safety and
          traceability, making environmental and animal-welfare trade-offs explicit, and leaving
          growers a workable fallback when a model fails. Scenarios are learning prompts, not
          agronomic, veterinary or food-safety advice.
        </p>
        <p>
          <strong>
            {agriFoodGame.correct}/{agriFoodGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {agriFoodGame.complete && (
            <Button variant="outline" onClick={() => setAgriFoodAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {AGRI_FOOD_ROUNDS.map((round) => {
            const selected = agriFoodAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAgriFoodAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good food-system safeguard."
                          : "Review the food-system gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="construction-assurance"
        className="checklist-phase"
        aria-label="AI in construction and the built environment game"
      >
        <h2>AI in construction &amp; the built environment</h2>
        <p>
          Practice keeping AI in design and delivery safe: requiring qualified professional checking of
          generated designs and calculations, refusing to let model output replace structural or fire
          sign-off, routing site-safety flags to the crews who can act, recording AI-authored design
          elements, and correcting and disclosing defects after handover. Scenarios are learning
          prompts, not engineering, building-safety or legal advice.
        </p>
        <p>
          <strong>
            {constructionGame.correct}/{constructionGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {constructionGame.complete && (
            <Button variant="outline" onClick={() => setConstructionAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CONSTRUCTION_ROUNDS.map((round) => {
            const selected = constructionAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setConstructionAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good built-environment safeguard."
                          : "Review the built-environment gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="emergency-response-assurance"
        className="checklist-phase"
        aria-label="AI in emergency response and public-safety triage game"
      >
        <h2>AI in emergency response &amp; public-safety triage</h2>
        <p>
          Practice keeping AI-supported dispatch and triage safe: keeping a trained human in final
          control and failing safe on degraded calls, testing outcomes for bias by location, language
          and disability, telling callers and staff when AI is involved with a route to a person,
          validating triage against local outcomes with decision logs, and rehearsing a manual process
          for model failure. Scenarios are learning prompts, not operational, clinical or legal advice.
        </p>
        <p>
          <strong>
            {emergencyResponseGame.correct}/{emergencyResponseGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {emergencyResponseGame.complete && (
            <Button variant="outline" onClick={() => setEmergencyResponseAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EMERGENCY_RESPONSE_ROUNDS.map((round) => {
            const selected = emergencyResponseAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEmergencyResponseAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good triage safeguard."
                          : "Review the triage gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="official-statistics-assurance"
        className="checklist-phase"
        aria-label="AI in official statistics and census data production game"
      >
        <h2>AI in official statistics &amp; census data production</h2>
        <p>
          Practice governing AI in official statistics and census production: documenting reproducible
          methods and quality checks, testing outputs for bias and small-area error before release,
          enforcing statistical confidentiality on derived tables, versioning revisions and model
          changes with an audit trail, and telling the public when AI materially influenced published
          figures. Scenarios are learning prompts, not statistical or legal advice.
        </p>
        <p>
          <strong>
            {officialStatisticsGame.correct}/{officialStatisticsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {officialStatisticsGame.complete && (
            <Button variant="outline" onClick={() => setOfficialStatisticsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {OFFICIAL_STATISTICS_ROUNDS.map((round) => {
            const selected = officialStatisticsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setOfficialStatisticsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good statistics safeguard."
                          : "Review the statistics gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="telecom-operations-assurance"
        className="checklist-phase"
        aria-label="AI in telecommunications network operations game"
      >
        <h2>AI in telecommunications network operations &amp; service continuity</h2>
        <p>
          Practice governing AI in network operations and service continuity: keeping operator
          oversight, limits and rollback on automated changes, testing traffic management for fairness
          under congestion, logging changes for traceable incidents, notifying customers and regulators
          of material AI-influenced impacts, and rehearsing manual operations to sustain essential
          service if the model fails. Scenarios are learning prompts, not operational, regulatory or
          legal advice.
        </p>
        <p>
          <strong>
            {telecomOperationsGame.correct}/{telecomOperationsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {telecomOperationsGame.complete && (
            <Button variant="outline" onClick={() => setTelecomOperationsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {TELECOM_OPERATIONS_ROUNDS.map((round) => {
            const selected = telecomOperationsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTelecomOperationsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good operations safeguard."
                          : "Review the operations gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="aviation-air-traffic-assurance"
        className="checklist-phase"
        aria-label="AI in aviation and air traffic operations game"
      >
        <h2>AI in aviation &amp; air traffic operations</h2>
        <p>
          Practice governing AI in aviation and air traffic operations: keeping human authority and
          quick override for safety-critical decisions, validating performance in edge and degraded
          conditions, logging decisions and model versions for traceability, controlling changes
          against certified or approved operational baselines, and rehearsing manual procedures and
          coordination when AI fails. Scenarios are learning prompts, not operational, safety or
          regulatory advice.
        </p>
        <p>
          <strong>
            {aviationAirTrafficGame.correct}/{aviationAirTrafficGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {aviationAirTrafficGame.complete && (
            <Button variant="outline" onClick={() => setAviationAirTrafficAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {AVIATION_AIR_TRAFFIC_ROUNDS.map((round) => {
            const selected = aviationAirTrafficAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAviationAirTrafficAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good operations safeguard."
                          : "Review the operations gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="maritime-port-operations-assurance"
        className="checklist-phase"
        aria-label="AI in maritime and port operations game"
      >
        <h2>AI in maritime &amp; port operations</h2>
        <p>
          Practice governing AI in maritime and port operations: keeping human oversight and override
          for safety- and security-critical actions, validating performance in adverse and degraded
          conditions, logging recommendations and model versions for traceability, testing screening
          and scheduling for fairness, and rehearsing manual procedures, coordination and incident
          notification when AI fails. Scenarios are learning prompts, not operational, safety,
          security or regulatory advice.
        </p>
        <p>
          <strong>
            {maritimePortOperationsGame.correct}/{maritimePortOperationsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {maritimePortOperationsGame.complete && (
            <Button variant="outline" onClick={() => setMaritimePortOperationsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MARITIME_PORT_OPERATIONS_ROUNDS.map((round) => {
            const selected = maritimePortOperationsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setMaritimePortOperationsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good operations safeguard."
                          : "Review the operations gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="pharma-clinical-trials-assurance"
        className="checklist-phase"
        aria-label="AI in pharmaceutical clinical trials game"
      >
        <h2>AI in pharmaceutical clinical trials</h2>
        <p>
          Practice governing AI in pharmaceutical clinical trials: keeping qualified human oversight
          over participant safety and protocol adherence, maintaining consent and transparency when AI
          is used, testing recruitment and stratification for bias and representativeness, preserving
          data integrity, provenance and protected access, and monitoring performance with clear
          escalation and the ability to pause or revert AI use. Scenarios are learning prompts, not
          clinical, research or regulatory advice.
        </p>
        <p>
          <strong>
            {pharmaClinicalTrialsGame.correct}/{pharmaClinicalTrialsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {pharmaClinicalTrialsGame.complete && (
            <Button variant="outline" onClick={() => setPharmaClinicalTrialsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PHARMA_CLINICAL_TRIALS_ROUNDS.map((round) => {
            const selected = pharmaClinicalTrialsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPharmaClinicalTrialsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good trial safeguard."
                          : "Review the trial gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="humanitarian-aid-allocation-assurance"
        className="checklist-phase"
        aria-label="AI in humanitarian and aid allocation game"
      >
        <h2>AI in humanitarian &amp; aid allocation</h2>
        <p>
          Practice governing AI in humanitarian response and aid allocation: testing targeting for
          fairness and non-discrimination, explaining allocation criteria and the AI's role, providing
          human review and recourse for high-impact decisions, protecting sensitive crisis data with
          quality checks and minimisation, and maintaining accountable records with manual fallback in
          rapidly changing conditions. Scenarios are learning prompts, not operational, legal or
          humanitarian-programme advice.
        </p>
        <p>
          <strong>
            {humanitarianAidAllocationGame.correct}/{humanitarianAidAllocationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {humanitarianAidAllocationGame.complete && (
            <Button variant="outline" onClick={() => setHumanitarianAidAllocationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {HUMANITARIAN_AID_ALLOCATION_ROUNDS.map((round) => {
            const selected = humanitarianAidAllocationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setHumanitarianAidAllocationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good aid safeguard."
                          : "Review the aid gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="water-wastewater-operations-assurance"
        className="checklist-phase"
        aria-label="AI in water and wastewater utility operations game"
      >
        <h2>AI in water &amp; wastewater utility operations</h2>
        <p>
          Practice governing AI in water and wastewater utility operations: keeping operator oversight
          and authority for safety- and quality-critical actions, validating performance under sensor
          faults and adverse conditions, monitoring thresholds with alarms and escalation, logging
          decisions and model versions for traceability, and maintaining controlled changes with
          fail-safe manual fallback and required incident notification. Scenarios are learning prompts,
          not operational, safety, public-health or regulatory advice.
        </p>
        <p>
          <strong>
            {waterWastewaterOperationsGame.correct}/{waterWastewaterOperationsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {waterWastewaterOperationsGame.complete && (
            <Button variant="outline" onClick={() => setWaterWastewaterOperationsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {WATER_WASTEWATER_OPERATIONS_ROUNDS.map((round) => {
            const selected = waterWastewaterOperationsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setWaterWastewaterOperationsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good operations safeguard."
                          : "Review the operations gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="border-immigration-screening-assurance"
        className="checklist-phase"
        aria-label="AI in border, immigration and mobility screening game"
      >
        <h2>AI in border, immigration &amp; mobility screening</h2>
        <p>
          Practice governing AI in border, immigration and mobility screening: requiring qualified
          human review for high-impact decisions, testing outcomes for fairness and disproportionate
          impact, validating accuracy and false matches, providing explanation, contestability and
          recourse where appropriate while protecting sensitive data, and maintaining audit trails with
          manual fallback. Scenarios are learning prompts, not legal, immigration or operational
          advice.
        </p>
        <p>
          <strong>
            {borderImmigrationScreeningGame.correct}/{borderImmigrationScreeningGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {borderImmigrationScreeningGame.complete && (
            <Button variant="outline" onClick={() => setBorderImmigrationScreeningAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {BORDER_IMMIGRATION_SCREENING_ROUNDS.map((round) => {
            const selected = borderImmigrationScreeningAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setBorderImmigrationScreeningAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good screening safeguard."
                          : "Review the screening gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="railway-signalling-operations-assurance"
        className="checklist-phase"
        aria-label="AI in railway operations and signalling support game"
      >
        <h2>AI in railway operations &amp; signalling support</h2>
        <p>
          Practice governing AI in railway operations and signalling support: keeping human authority
          and clear advisory-versus-control boundaries, validating performance in degraded conditions
          and signal faults, logging recommendations and model versions for traceability, controlling
          changes against approved or certified baselines, and rehearsing manual procedures,
          coordination and notifications when AI fails. Scenarios are learning prompts, not
          operational, safety or regulatory advice.
        </p>
        <p>
          <strong>
            {railwaySignallingOperationsGame.correct}/{railwaySignallingOperationsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {railwaySignallingOperationsGame.complete && (
            <Button variant="outline" onClick={() => setRailwaySignallingOperationsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RAILWAY_SIGNALLING_OPERATIONS_ROUNDS.map((round) => {
            const selected = railwaySignallingOperationsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRailwaySignallingOperationsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good operations safeguard."
                          : "Review the operations gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="mining-extractive-safety-assurance"
        className="checklist-phase"
        aria-label="AI in mining and extractive operations safety game"
      >
        <h2>AI in mining &amp; extractive operations safety</h2>
        <p>
          Practice governing AI in mining and extractive operations safety: keeping human authority
          over safety-critical alerts and actions, validating performance in harsh environments and
          sensor faults, monitoring hazard thresholds with timely alarms and escalation, logging
          decisions and model versions for traceability, and maintaining controlled changes with
          fail-safe manual procedures and incident coordination. Scenarios are learning prompts, not
          operational, safety or regulatory advice.
        </p>
        <p>
          <strong>
            {miningExtractiveSafetyGame.correct}/{miningExtractiveSafetyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {miningExtractiveSafetyGame.complete && (
            <Button variant="outline" onClick={() => setMiningExtractiveSafetyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MINING_EXTRACTIVE_SAFETY_ROUNDS.map((round) => {
            const selected = miningExtractiveSafetyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setMiningExtractiveSafetyAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good safety safeguard."
                          : "Review the safety gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="pharma-manufacturing-quality-assurance"
        className="checklist-phase"
        aria-label="AI in pharmaceutical manufacturing and quality game"
      >
        <h2>AI in pharmaceutical manufacturing &amp; quality</h2>
        <p>
          Practice governing AI in pharmaceutical manufacturing and quality control: maintaining
          qualified human review and release authority, preserving data integrity and audit trails,
          detecting and escalating deviations with timely investigation, validating performance
          across products, lines and conditions, and controlling changes with safe manual fallback
          to protect product quality and continuity. Scenarios are learning prompts, not
          manufacturing, quality, safety or regulatory advice.
        </p>
        <p>
          <strong>
            {pharmaManufacturingQualityGame.correct}/{pharmaManufacturingQualityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {pharmaManufacturingQualityGame.complete && (
            <Button variant="outline" onClick={() => setPharmaManufacturingQualityAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PHARMA_MANUFACTURING_QUALITY_ROUNDS.map((round) => {
            const selected = pharmaManufacturingQualityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPharmaManufacturingQualityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good quality safeguard."
                          : "Review the quality gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="customs-cargo-trade-screening-assurance"
        className="checklist-phase"
        aria-label="AI in customs cargo and trade screening game"
      >
        <h2>AI in customs cargo &amp; trade screening</h2>
        <p>
          Practice governing AI in customs cargo and trade screening: maintaining human authority
          for holds, inspections and enforcement actions, validating risk targeting for fairness and
          trade impacts, protecting trade and partner data, logging decisions and risk scores for
          traceability and audit, and controlling changes with manual fallback and expedited review
          to sustain legitimate facilitation. Scenarios are learning prompts, not customs, trade,
          legal or regulatory advice.
        </p>
        <p>
          <strong>
            {customsCargoTradeScreeningGame.correct}/{customsCargoTradeScreeningGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {customsCargoTradeScreeningGame.complete && (
            <Button variant="outline" onClick={() => setCustomsCargoTradeScreeningAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CUSTOMS_CARGO_TRADE_SCREENING_ROUNDS.map((round) => {
            const selected = customsCargoTradeScreeningAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCustomsCargoTradeScreeningAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good screening safeguard."
                          : "Review the screening gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="waste-recycling-operations-assurance"
        className="checklist-phase"
        aria-label="AI in waste management and recycling operations game"
      >
        <h2>AI in waste management &amp; recycling operations</h2>
        <p>
          Practice governing AI in waste management and recycling operations: maintaining human
          authority over safety-critical actions, validating performance across waste streams and
          sensor faults, detecting hazards and contamination with timely alarms and escalation,
          logging decisions and model versions for traceability and compliance evidence, and
          controlling changes with fail-safe manual procedures and worker-safety coordination.
          Scenarios are learning prompts, not operational, safety, environmental or regulatory
          advice.
        </p>
        <p>
          <strong>
            {wasteRecyclingOperationsGame.correct}/{wasteRecyclingOperationsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {wasteRecyclingOperationsGame.complete && (
            <Button variant="outline" onClick={() => setWasteRecyclingOperationsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {WASTE_RECYCLING_OPERATIONS_ROUNDS.map((round) => {
            const selected = wasteRecyclingOperationsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setWasteRecyclingOperationsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good operations safeguard."
                          : "Review the operations gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="archives-heritage-digitisation-assurance"
        className="checklist-phase"
        aria-label="AI in public archives and cultural heritage digitisation game"
      >
        <h2>AI in public archives &amp; cultural heritage digitisation</h2>
        <p>
          Practice governing AI in public archives and cultural heritage digitisation: preserving
          provenance and integrity, reviewing metadata and descriptions for quality and bias with
          subject-matter expertise, handling rights and sensitive content appropriately, disclosing
          AI assistance and limitations, and maintaining curatorial authority with traceable outputs
          and changes. Scenarios are learning prompts, not archival, legal, rights or regulatory
          advice.
        </p>
        <p>
          <strong>
            {archivesHeritageDigitisationGame.correct}/{archivesHeritageDigitisationGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {archivesHeritageDigitisationGame.complete && (
            <Button variant="outline" onClick={() => setArchivesHeritageDigitisationAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {ARCHIVES_HERITAGE_DIGITISATION_ROUNDS.map((round) => {
            const selected = archivesHeritageDigitisationAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setArchivesHeritageDigitisationAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good stewardship safeguard."
                          : "Review the stewardship gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="public-transport-operations-assurance"
        className="checklist-phase"
        aria-label="AI in public transport operations and passenger information game"
      >
        <h2>AI in public transport operations &amp; passenger information</h2>
        <p>
          Practice governing AI in public transport operations and passenger information:
          maintaining human oversight for service changes and safety-relevant communications,
          validating predictions across routes, times, demand and disruptions, providing accurate,
          timely, accessible and equitable information, protecting personal and location data, and
          keeping traceable outputs with manual fallback communications and operations support.
          Scenarios are learning prompts, not operational, safety, accessibility or regulatory
          advice.
        </p>
        <p>
          <strong>
            {publicTransportOperationsGame.correct}/{publicTransportOperationsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {publicTransportOperationsGame.complete && (
            <Button variant="outline" onClick={() => setPublicTransportOperationsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PUBLIC_TRANSPORT_OPERATIONS_ROUNDS.map((round) => {
            const selected = publicTransportOperationsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPublicTransportOperationsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good service safeguard."
                          : "Review the service gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="laboratory-research-safety-assurance"
        className="checklist-phase"
        aria-label="AI in laboratories and research safety/compliance game"
      >
        <h2>AI in laboratories &amp; research safety/compliance</h2>
        <p>
          Practice governing AI in laboratories and research safety/compliance: maintaining
          qualified oversight for safety-critical and protocol decisions, detecting hazards with
          timely alarms and escalation, validating performance across lab variability, preserving
          data integrity and investigating deviations, and controlling changes with safe manual
          fallback and required notifications. Scenarios are learning prompts, not laboratory
          safety, research, legal or regulatory advice.
        </p>
        <p>
          <strong>
            {laboratoryResearchSafetyGame.correct}/{laboratoryResearchSafetyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {laboratoryResearchSafetyGame.complete && (
            <Button variant="outline" onClick={() => setLaboratoryResearchSafetyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {LABORATORY_RESEARCH_SAFETY_ROUNDS.map((round) => {
            const selected = laboratoryResearchSafetyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setLaboratoryResearchSafetyAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good safety safeguard."
                          : "Review the safety gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="forestry-wildfire-land-management-assurance"
        className="checklist-phase"
        aria-label="AI in forestry, wildfire and land-management game"
      >
        <h2>AI in forestry, wildfire &amp; land-management</h2>
        <p>
          Practice governing AI in forestry, wildfire detection/prediction and land-management:
          validating performance across terrain, weather, seasonality and sensor limits, keeping
          human authority for response prioritization and safety-critical actions, managing false
          alarms and missed detections, communicating uncertainty and limitations transparently, and
          maintaining traceability with coordination, notifications and manual fallback. Scenarios
          are learning prompts, not operational, emergency response, safety or regulatory advice.
        </p>
        <p>
          <strong>
            {forestryWildfireLandManagementGame.correct}/{forestryWildfireLandManagementGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {forestryWildfireLandManagementGame.complete && (
            <Button variant="outline" onClick={() => setForestryWildfireLandManagementAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {FORESTRY_WILDFIRE_LAND_MANAGEMENT_ROUNDS.map((round) => {
            const selected = forestryWildfireLandManagementAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setForestryWildfireLandManagementAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good response safeguard."
                          : "Review the response gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="airport-port-ground-operations-assurance"
        className="checklist-phase"
        aria-label="AI in airport and port ground operations safety game"
      >
        <h2>AI in airport &amp; port ground operations safety</h2>
        <p>
          Practice governing AI in airport and port ground operations safety: maintaining human
          authority for safety-critical movements and clearances, validating performance in degraded
          visibility and congestion, ensuring timely proximity and hazard alerts, logging movements
          and model versions for traceability, and controlling changes with fail-safe manual
          procedures and cross-team coordination. Scenarios are learning prompts, not operational,
          safety or regulatory advice.
        </p>
        <p>
          <strong>
            {airportPortGroundOperationsGame.correct}/{airportPortGroundOperationsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {airportPortGroundOperationsGame.complete && (
            <Button variant="outline" onClick={() => setAirportPortGroundOperationsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {AIRPORT_PORT_GROUND_OPERATIONS_ROUNDS.map((round) => {
            const selected = airportPortGroundOperationsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setAirportPortGroundOperationsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good ground-operations safeguard."
                          : "Review the ground-operations gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="public-libraries-knowledge-access-assurance"
        className="checklist-phase"
        aria-label="AI in public libraries and knowledge access game"
      >
        <h2>AI in public libraries &amp; knowledge access</h2>
        <p>
          Practice governing AI in public libraries and knowledge access: monitoring search and
          recommendation quality and bias with curatorial review, supporting access, equity and
          age-appropriate safeguards, respecting rights and sensitive content, disclosing AI
          assistance and limitations transparently, and maintaining human/curatorial oversight with
          privacy and traceability. Scenarios are learning prompts, not library, legal, rights or
          regulatory advice.
        </p>
        <p>
          <strong>
            {publicLibrariesKnowledgeAccessGame.correct}/{publicLibrariesKnowledgeAccessGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {publicLibrariesKnowledgeAccessGame.complete && (
            <Button variant="outline" onClick={() => setPublicLibrariesKnowledgeAccessAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PUBLIC_LIBRARIES_KNOWLEDGE_ACCESS_ROUNDS.map((round) => {
            const selected = publicLibrariesKnowledgeAccessAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPublicLibrariesKnowledgeAccessAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good knowledge-access safeguard."
                          : "Review the knowledge-access gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="sports-officiating-competition-integrity-assurance"
        className="checklist-phase"
        aria-label="AI in sports officiating and competition integrity game"
      >
        <h2>AI in sports officiating &amp; competition integrity</h2>
        <p>
          Practice governing AI in sports officiating and competition integrity: maintaining human
          authority, review and appeals, validating performance across venues and conditions,
          monitoring fairness and bias, providing transparency with traceable evidence for review and
          integrity investigations, and controlling changes with fallback continuity when assistance
          is unavailable or contested. Scenarios are learning prompts, not officiating, integrity,
          legal or regulatory advice.
        </p>
        <p>
          <strong>
            {sportsOfficiatingCompetitionIntegrityGame.correct}/
            {sportsOfficiatingCompetitionIntegrityGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {sportsOfficiatingCompetitionIntegrityGame.complete && (
            <Button
              variant="outline"
              onClick={() => setSportsOfficiatingCompetitionIntegrityAnswers({})}
            >
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SPORTS_OFFICIATING_COMPETITION_INTEGRITY_ROUNDS.map((round) => {
            const selected = sportsOfficiatingCompetitionIntegrityAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSportsOfficiatingCompetitionIntegrityAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good officiating-integrity safeguard."
                          : "Review the officiating-integrity gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="veterinary-animal-welfare-assurance"
        className="checklist-phase"
        aria-label="AI in veterinary and animal welfare decisions game"
      >
        <h2>AI in veterinary &amp; animal welfare decisions</h2>
        <p>
          Practice governing AI in veterinary and animal welfare decisions: validating diagnostic and
          care-support recommendations for clinical context, species and breeds, maintaining
          veterinary and professional oversight for consequential decisions, assessing and monitoring
          welfare impacts and risks, documenting data quality and provenance with traceable outputs,
          and using escalation and safe fallback when AI is uncertain, unavailable or
          contraindicated. Scenarios are learning prompts, not veterinary, clinical, welfare or
          regulatory advice.
        </p>
        <p>
          <strong>
            {veterinaryAnimalWelfareGame.correct}/{veterinaryAnimalWelfareGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {veterinaryAnimalWelfareGame.complete && (
            <Button variant="outline" onClick={() => setVeterinaryAnimalWelfareAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {VETERINARY_ANIMAL_WELFARE_ROUNDS.map((round) => {
            const selected = veterinaryAnimalWelfareAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setVeterinaryAnimalWelfareAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good veterinary-welfare safeguard."
                          : "Review the veterinary-welfare gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="cemeteries-funerary-bereavement-services-assurance"
        className="checklist-phase"
        aria-label="AI in cemeteries, funerary and bereavement services game"
      >
        <h2>AI in cemeteries, funerary &amp; bereavement services</h2>
        <p>
          Practice governing AI in cemeteries, funerary and bereavement services: handling personal,
          bereavement and memorial information sensitively and with consent, ensuring accuracy,
          dignity and respectful presentation with human review for consequential outputs, protecting
          access to sensitive locations and records, maintaining human oversight and transparency,
          and providing traceable fallback and support pathways. Scenarios are learning prompts, not
          legal, funerary, pastoral or regulatory advice.
        </p>
        <p>
          <strong>
            {cemeteriesFuneraryBereavementServicesGame.correct}/
            {cemeteriesFuneraryBereavementServicesGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {cemeteriesFuneraryBereavementServicesGame.complete && (
            <Button
              variant="outline"
              onClick={() => setCemeteriesFuneraryBereavementServicesAnswers({})}
            >
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CEMETERIES_FUNERARY_BEREAVEMENT_SERVICES_ROUNDS.map((round) => {
            const selected = cemeteriesFuneraryBereavementServicesAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCemeteriesFuneraryBereavementServicesAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good bereavement-services safeguard."
                          : "Review the bereavement-services gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="ticketing-venue-access-assurance"
        className="checklist-phase"
        aria-label="AI in ticketing, box office and venue access control game"
      >
        <h2>AI in ticketing, box office &amp; venue access control</h2>
        <p>
          Practice governing AI in ticketing, box office and venue access control: keeping pricing
          and anti-fraud decisions fair, supporting accessible and equitable access, handling
          verification data with minimisation and safeguards, communicating decisions transparently
          with human review and appeals, and maintaining traceable records with tested fallback for
          entry or access failures. Scenarios are learning prompts, not legal, consumer, pricing or
          regulatory advice.
        </p>
        <p>
          <strong>
            {ticketingVenueAccessGame.correct}/{ticketingVenueAccessGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {ticketingVenueAccessGame.complete && (
            <Button variant="outline" onClick={() => setTicketingVenueAccessAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {TICKETING_VENUE_ACCESS_ROUNDS.map((round) => {
            const selected = ticketingVenueAccessAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setTicketingVenueAccessAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good ticketing-access safeguard."
                          : "Review the ticketing-access gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="parking-curb-management-assurance"
        className="checklist-phase"
        aria-label="AI in parking and curb/kerb management game"
      >
        <h2>AI in parking &amp; curb/kerb management</h2>
        <p>
          Practice governing AI in parking and curb/kerb management: validating detection accuracy
          and evidence, ensuring actions reflect current signage and conditions, monitoring fairness
          and accessible appeals, applying privacy and minimisation, and maintaining traceability
          with manual fallback when AI is uncertain or unavailable. Scenarios are learning prompts,
          not legal, enforcement or regulatory advice.
        </p>
        <p>
          <strong>
            {parkingCurbManagementGame.correct}/{parkingCurbManagementGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {parkingCurbManagementGame.complete && (
            <Button variant="outline" onClick={() => setParkingCurbManagementAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PARKING_CURB_MANAGEMENT_ROUNDS.map((round) => {
            const selected = parkingCurbManagementAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setParkingCurbManagementAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good parking-management safeguard."
                          : "Review the parking-management gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="large-event-crowd-safety-assurance"
        className="checklist-phase"
        aria-label="AI in stadiums, festivals and large-event crowd safety game"
      >
        <h2>AI in stadiums, festivals &amp; large-event crowd safety</h2>
        <p>
          Practice governing AI in stadiums, festivals and large-event crowd safety: validating
          crowd-density and risk alerts for venues and conditions, ensuring proportional and
          non-discriminatory use, maintaining clear human command and escalation, protecting
          attendees with privacy and communications safeguards, and keeping traceable records with
          tested fallback and continuity procedures. Scenarios are learning prompts, not safety,
          security, operational or regulatory advice.
        </p>
        <p>
          <strong>
            {largeEventCrowdSafetyGame.correct}/{largeEventCrowdSafetyGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {largeEventCrowdSafetyGame.complete && (
            <Button variant="outline" onClick={() => setLargeEventCrowdSafetyAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {LARGE_EVENT_CROWD_SAFETY_ROUNDS.map((round) => {
            const selected = largeEventCrowdSafetyAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setLargeEventCrowdSafetyAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good crowd-safety safeguard."
                          : "Review the crowd-safety gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="self-storage-property-access-assurance"
        className="checklist-phase"
        aria-label="AI in self-storage and property access facilities game"
      >
        <h2>AI in self-storage &amp; property access facilities</h2>
        <p>
          Practice governing AI in self-storage and property access facilities: maintaining
          accurate verification and access safeguards, ensuring fair and transparent access
          decisions, applying privacy and minimisation to monitoring and customer data, providing
          human review for consequential actions such as lockouts, holds or account restrictions,
          and keeping traceable records with tested fallback and support pathways. Scenarios are
          learning prompts, not legal, security or regulatory advice.
        </p>
        <p>
          <strong>
            {selfStoragePropertyAccessGame.correct}/{selfStoragePropertyAccessGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {selfStoragePropertyAccessGame.complete && (
            <Button variant="outline" onClick={() => setSelfStoragePropertyAccessAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SELF_STORAGE_PROPERTY_ACCESS_ROUNDS.map((round) => {
            const selected = selfStoragePropertyAccessAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSelfStoragePropertyAccessAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good access-facility safeguard."
                          : "Review the access-facility gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="laundry-garment-care-assurance"
        className="checklist-phase"
        aria-label="AI in laundry, dry-cleaning and garment care services game"
      >
        <h2>AI in laundry, dry-cleaning &amp; garment care services</h2>
        <p>
          Practice governing AI in laundry, dry-cleaning and garment care services: capturing
          accurate item identification and special-care instructions, supporting damage/loss
          handling and accountability, communicating pricing and service terms transparently,
          applying privacy and minimisation with traceable records, and providing human review and
          fallback for exceptions, disputes or uncertain cases. Scenarios are learning prompts, not
          consumer, legal or regulatory advice.
        </p>
        <p>
          <strong>
            {laundryGarmentCareGame.correct}/{laundryGarmentCareGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {laundryGarmentCareGame.complete && (
            <Button variant="outline" onClick={() => setLaundryGarmentCareAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {LAUNDRY_GARMENT_CARE_ROUNDS.map((round) => {
            const selected = laundryGarmentCareAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setLaundryGarmentCareAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good garment-care safeguard."
                          : "Review the garment-care gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="car-wash-vehicle-detailing-assurance"
        className="checklist-phase"
        aria-label="AI in car wash and vehicle detailing services game"
      >
        <h2>AI in car wash &amp; vehicle detailing services</h2>
        <p>
          Practice governing AI in car wash and vehicle detailing services: capturing accurate
          vehicle identification, service selection and pre-existing condition, supporting
          damage/incident handling and accountability, communicating pricing, packages/upsells and
          service terms transparently, minimising and safeguarding consented capture/use of vehicle
          and customer data or images with traceable records, and providing human review and
          fallback for exceptions, disputes or uncertain cases. Scenarios are learning prompts, not
          consumer, legal or regulatory advice.
        </p>
        <p>
          <strong>
            {carWashVehicleDetailingGame.correct}/{carWashVehicleDetailingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {carWashVehicleDetailingGame.complete && (
            <Button variant="outline" onClick={() => setCarWashVehicleDetailingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {CAR_WASH_VEHICLE_DETAILING_ROUNDS.map((round) => {
            const selected = carWashVehicleDetailingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCarWashVehicleDetailingAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good vehicle-detailing safeguard."
                          : "Review the vehicle-detailing gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="moving-relocation-household-goods-assurance"
        className="checklist-phase"
        aria-label="AI in moving, relocation and household goods storage game"
      >
        <h2>AI in moving, relocation &amp; household goods storage</h2>
        <p>
          Practice governing AI in moving, relocation and household goods storage: capturing accurate
          inventory and condition records, supporting handling, damage or loss detection and
          accountability, communicating quotes, pricing and service terms transparently, maintaining
          traceable scheduling and chain-of-custody with privacy and minimisation safeguards for
          customer and property data or images, and providing human review and fallback for
          exceptions, disputes or uncertain cases. Scenarios are learning prompts, not consumer,
          legal or regulatory advice.
        </p>
        <p>
          <strong>
            {movingRelocationHouseholdGoodsGame.correct}/{movingRelocationHouseholdGoodsGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {movingRelocationHouseholdGoodsGame.complete && (
            <Button variant="outline" onClick={() => setMovingRelocationHouseholdGoodsAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {MOVING_RELOCATION_HOUSEHOLD_GOODS_ROUNDS.map((round) => {
            const selected = movingRelocationHouseholdGoodsAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setMovingRelocationHouseholdGoodsAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good moving-assurance safeguard."
                          : "Review the moving-assurance gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="pet-boarding-daycare-grooming-assurance"
        className="checklist-phase"
        aria-label="AI in pet boarding, daycare and grooming services game"
      >
        <h2>AI in pet boarding, daycare &amp; grooming services</h2>
        <p>
          Practice governing AI in pet boarding, daycare and grooming services: capturing accurate
          pet identification and owner-provided care instructions, supporting health and welfare
          observation and incident handling, communicating owner consent, updates and service terms
          transparently, applying privacy and minimisation to owner and pet data or images with
          traceable care records, and providing human review, escalation and fallback for incidents,
          welfare concerns or uncertain cases. Scenarios are learning prompts, not veterinary,
          consumer, legal or regulatory advice.
        </p>
        <p>
          <strong>
            {petBoardingDaycareGroomingGame.correct}/{petBoardingDaycareGroomingGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {petBoardingDaycareGroomingGame.complete && (
            <Button variant="outline" onClick={() => setPetBoardingDaycareGroomingAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {PET_BOARDING_DAYCARE_GROOMING_ROUNDS.map((round) => {
            const selected = petBoardingDaycareGroomingAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setPetBoardingDaycareGroomingAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good pet-care safeguard."
                          : "Review the pet-care gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="vehicle-valet-parking-attendant-assurance"
        className="checklist-phase"
        aria-label="AI in vehicle valet and parking attendant services game"
      >
        <h2>AI in vehicle valet &amp; parking attendant services</h2>
        <p>
          Practice governing AI in vehicle valet and parking attendant services: capturing accurate
          vehicle identification and condition at handoff and retrieval, supporting key/custody
          handling and damage or incident accountability, communicating pricing, fees and service
          terms transparently with access and authorization checks, applying privacy and
          minimisation to vehicle, customer and location data or images with traceable records, and
          providing human review and fallback for exceptions, disputes or uncertain cases. Scenarios
          are learning prompts, not consumer, legal or regulatory advice.
        </p>
        <p>
          <strong>
            {vehicleValetParkingAttendantGame.correct}/{vehicleValetParkingAttendantGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {vehicleValetParkingAttendantGame.complete && (
            <Button variant="outline" onClick={() => setVehicleValetParkingAttendantAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {VEHICLE_VALET_PARKING_ATTENDANT_ROUNDS.map((round) => {
            const selected = vehicleValetParkingAttendantAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setVehicleValetParkingAttendantAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good valet-service safeguard."
                          : "Review the valet-service gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="equipment-tool-rental-assurance"
        className="checklist-phase"
        aria-label="AI in equipment and tool rental services game"
      >
        <h2>AI in equipment &amp; tool rental services</h2>
        <p>
          Practice governing AI in equipment and tool rental services: capturing accurate equipment
          or tool identification, condition and availability, supporting damage or loss detection,
          handling and accountability, communicating pricing, deposits and service terms
          transparently, maintaining traceable checkout, return and maintenance records with privacy
          and minimisation safeguards for renter and usage data or images, and providing human
          review and fallback for exceptions, disputes or uncertain cases. Scenarios are learning
          prompts, not consumer, legal or regulatory advice.
        </p>
        <p>
          <strong>
            {equipmentToolRentalGame.correct}/{equipmentToolRentalGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {equipmentToolRentalGame.complete && (
            <Button variant="outline" onClick={() => setEquipmentToolRentalAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EQUIPMENT_TOOL_RENTAL_ROUNDS.map((round) => {
            const selected = equipmentToolRentalAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEquipmentToolRentalAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good rental-service safeguard."
                          : "Review the rental-service gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="self-service-laundromat-smart-locker-assurance"
        className="checklist-phase"
        aria-label="AI in self-service laundromat and smart locker laundry services game"
      >
        <h2>AI in self-service laundromat &amp; smart locker laundry services</h2>
        <p>
          Practice governing AI in self-service laundromat and smart locker laundry services:
          ensuring accurate machine or locker access and order or user matching, supporting issue,
          damage or malfunction detection, reporting and accountability, communicating payment,
          pricing and usage terms transparently, applying privacy and minimisation to customer and
          usage data with traceable access, transaction and usage records, and providing human
          support and fallback for access failures, disputes or uncertain cases. Scenarios are
          learning prompts, not consumer, legal or regulatory advice.
        </p>
        <p>
          <strong>
            {selfServiceLaundromatSmartLockerGame.correct}/{selfServiceLaundromatSmartLockerGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {selfServiceLaundromatSmartLockerGame.complete && (
            <Button variant="outline" onClick={() => setSelfServiceLaundromatSmartLockerAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {SELF_SERVICE_LAUNDROMAT_SMART_LOCKER_ROUNDS.map((round) => {
            const selected = selfServiceLaundromatSmartLockerAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setSelfServiceLaundromatSmartLockerAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good self-service safeguard."
                          : "Review the self-service gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="bicycle-micromobility-rental-share-assurance"
        className="checklist-phase"
        aria-label="AI in bicycle and micromobility rental/share services game"
      >
        <h2>AI in bicycle &amp; micromobility rental/share services</h2>
        <p>
          Practice governing AI in bicycle and micromobility rental/share services: capturing
          accurate vehicle identification, availability and condition, supporting damage, theft or
          incident detection, handling and accountability, communicating pricing, fees and usage
          terms transparently, applying privacy and minimisation to location and usage data with
          traceable trip, access and condition records, and providing human review and fallback for
          disputes, safety exceptions or uncertain cases. Scenarios are learning prompts, not
          consumer, legal or regulatory advice.
        </p>
        <p>
          <strong>
            {bicycleMicromobilityRentalShareGame.correct}/{bicycleMicromobilityRentalShareGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {bicycleMicromobilityRentalShareGame.complete && (
            <Button variant="outline" onClick={() => setBicycleMicromobilityRentalShareAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {BICYCLE_MICROMOBILITY_RENTAL_SHARE_ROUNDS.map((round) => {
            const selected = bicycleMicromobilityRentalShareAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setBicycleMicromobilityRentalShareAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good micromobility safeguard."
                          : "Review the micromobility gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="coworking-flexible-workspace-access-assurance"
        className="checklist-phase"
        aria-label="AI in coworking and flexible workspace access game"
      >
        <h2>AI in coworking &amp; flexible workspace access</h2>
        <p>
          Practice governing AI in coworking and flexible workspace access: ensuring accurate member
          or guest identification, access authorization and booking access, supporting incident,
          amenity or access issue detection, handling and accountability, communicating pricing,
          plans and usage terms transparently, applying privacy and minimisation to member, guest
          and access or usage data with traceable records, and providing human review and fallback
          for access issues, disputes or uncertain cases. Scenarios are learning prompts, not
          consumer, legal or regulatory advice.
        </p>
        <p>
          <strong>
            {coworkingFlexibleWorkspaceAccessGame.correct}/{coworkingFlexibleWorkspaceAccessGame.attempted}
          </strong>{" "}
          sound assurance decisions ·{" "}
          {coworkingFlexibleWorkspaceAccessGame.complete && (
            <Button variant="outline" onClick={() => setCoworkingFlexibleWorkspaceAccessAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {COWORKING_FLEXIBLE_WORKSPACE_ACCESS_ROUNDS.map((round) => {
            const selected = coworkingFlexibleWorkspaceAccessAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.scenario}</h3>
                  {round.choices.map((choice, index) => (
                    <Button
                      key={choice}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setCoworkingFlexibleWorkspaceAccessAnswers((answers) => ({
                          ...answers,
                          [round.id]: index,
                        }))
                      }
                    >
                      {choice}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good workspace-access safeguard."
                          : "Review the workspace-access gap."}
                      </strong>{" "}
                      {round.feedback} <em>Assurance focus: {round.assurance}.</em>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="inclusive-design" className="checklist-phase" aria-label="Inclusive AI design game">
        <h2>Inclusive design challenge</h2>
        <p>
          Practice identifying evaluation, accessibility, and recourse gaps. Scenarios are learning
          prompts, not a substitute for impact assessment or consultation with affected communities.
        </p>
        <p>
          {inclusionScore.sound}/{inclusionScore.attempted} thoughtful decisions ·{" "}
          {inclusionScore.complete && (
            <Button variant="outline" onClick={() => setInclusionAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {INCLUSIVE_DESIGN_ROUNDS.map((round) => {
            const selected = inclusionAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.prompt}</h3>
                  {round.options.map((option, index) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setInclusionAnswers((answers) => ({ ...answers, [round.id]: index }))
                      }
                    >
                      {option}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Strong inclusive-design choice."
                          : "Consider the missing safeguard."}
                      </strong>{" "}
                      {round.lesson}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="evidence-detective" className="checklist-phase" aria-label="Evidence detective game">
        <h2>Evidence detective · Is it decision-grade?</h2>
        <p>
          Classify the strength of a governance evidence sample. Quality judgments are illustrative;
          adapt evidence criteria to your organization and applicable obligations.
        </p>
        <p>
          {evidenceGame.correct}/{evidenceGame.answered} identified ·{" "}
          {evidenceGame.complete && (
            <Button variant="outline" onClick={() => setEvidenceAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {EVIDENCE_DETECTIVE_ROUNDS.map((round) => {
            const selected = evidenceAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.evidence}</h3>
                  {["Weak", "Partial", "Strong"].map((grade) => (
                    <Button
                      key={grade}
                      size="sm"
                      variant={selected === grade ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setEvidenceAnswers((previous) => ({ ...previous, [round.id]: grade }))
                      }
                    >
                      {grade}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>
                        {selected === round.best
                          ? "Good assessment."
                          : `Better classification: ${round.best}.`}
                      </strong>{" "}
                      {round.lesson}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="red-team-defender" className="checklist-phase" aria-label="AI security defender game">
        <h2>AI red-team / defender challenge</h2>
        <p>
          Practice defending against fictional prompt injection, data exfiltration, and unsafe tool
          use. No attack payloads are executed; use the concepts to strengthen approved controls.
        </p>
        <p>
          <strong>
            {redTeam.defended}/{redTeam.attempted}
          </strong>{" "}
          defended ·{" "}
          {redTeam.complete && (
            <Button variant="outline" onClick={() => setRedTeamAnswers({})}>
              Replay
            </Button>
          )}
        </p>
        <div className="checklist-tasks">
          {RED_TEAM_ROUNDS.map((round) => {
            const selected = redTeamAnswers[round.id];
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.prompt}</h3>
                  {round.options.map((option, index) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={selected === index ? "default" : "outline"}
                      disabled={selected !== undefined}
                      onClick={() =>
                        setRedTeamAnswers((current) => ({ ...current, [round.id]: index }))
                      }
                    >
                      {option}
                    </Button>
                  ))}
                  {selected !== undefined && (
                    <p role="status">
                      <strong>{selected === round.best ? "Defended." : "Control gap."}</strong>{" "}
                      {round.feedback}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <a
          href="https://www.nist.gov/itl/ai-risk-management-framework"
          target="_blank"
          rel="noreferrer"
        >
          NIST AI RMF reference
        </a>
      </section>

      <section id="change-impact" className="checklist-phase" aria-label="AI change impact challenge">
        <h2>Change-impact challenge</h2>
        <p>
          Identify areas requiring review before implementing a system change. This practice
          exercise does not replace the formal change-review workflow.
        </p>
        <div className="checklist-tasks">
          {CHANGE_IMPACT_ROUNDS.map((round) => {
            const selected = changeSelections[round.id] ?? [];
            const result = changeSubmitted[round.id] ? scoreChangeImpact(round.id, selected) : null;
            return (
              <article className="checklist-task" key={round.id}>
                <div>
                  <h3>{round.change}</h3>
                  {[
                    "Purpose or intended use",
                    "Data source or processing",
                    "Model or AI provider",
                    "Integration or deployment context",
                    "Controls or operating procedure",
                  ].map((category) => (
                    <label className="block" key={category}>
                      <input
                        type="checkbox"
                        disabled={Boolean(result)}
                        checked={selected.includes(category)}
                        onChange={(event) =>
                          setChangeSelections((current) => ({
                            ...current,
                            [round.id]: event.target.checked
                              ? [...(current[round.id] ?? []), category]
                              : (current[round.id] ?? []).filter((item) => item !== category),
                          }))
                        }
                      />{" "}
                      {category}
                    </label>
                  ))}
                  {!result && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setChangeSubmitted((current) => ({ ...current, [round.id]: true }))
                      }
                    >
                      Check answer
                    </Button>
                  )}
                  {result && (
                    <p role="status">
                      <strong>
                        {result.correct ? "Good change map." : "Review the change map."}
                      </strong>{" "}
                      {result.feedback}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <div className="checklist-phases">
        {phases.map((phase) => (
          <section className="checklist-phase" key={phase.id}>
            <h2>{phase.title}</h2>
            <div className="checklist-tasks">
              {phase.tasks.map((task) => {
                const Icon =
                  task.status === "complete"
                    ? CheckCircle
                    : task.status === "action"
                      ? Circle
                      : MinusCircle;
                return (
                  <article className={`checklist-task checklist-${task.status}`} key={task.id}>
                    <Icon weight="duotone" />
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.detail}</p>
                      <small>{task.progress}</small>
                    </div>
                    <span className="checklist-status">{statusText[task.status]}</span>
                    <Button variant="ghost" asChild size="sm">
                      <Link to={task.href}>
                        {task.action}
                        <ArrowRight />
                      </Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <section className="checklist-phase system-profile-checks">
        <h2>System profile completeness</h2>
        <p className="muted">
          These checks assess whether inventory fields are present. They do not calculate an
          individual system’s governance score or determine legal applicability.
        </p>
        {profiles.length === 0 ? (
          <div className="empty-state muted">
            <EmptyChecklist />
            <p>Register systems to assess profile completeness.</p>
          </div>
        ) : (
          <div className="checklist-tasks">
            {profiles.map(({ system, index, complete }) => (
              <article
                className={`checklist-task ${complete === 4 ? "checklist-complete" : "checklist-action"}`}
                key={`${system.name}-${index}`}
              >
                {complete === 4 ? <CheckCircle weight="duotone" /> : <Circle weight="duotone" />}
                <div>
                  <h3>{system.name}</h3>
                  <p>
                    {system.kind} · Preliminary tier: {system.tier} · Governance disposition:{" "}
                    {system.status}
                  </p>
                  <small>
                    {complete} of 4 profile fields complete: system type, owner, supplier and data
                    classification
                  </small>
                </div>
                <Button variant="ghost" asChild size="sm">
                  <Link to="/inventory">
                    Review profile & tier
                    <ArrowRight />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="footnote">
        A readiness checklist supports internal governance coordination. It is not a certification,
        compliance conclusion or legal applicability assessment.
      </p>
    </>
  );
}
