// Configuration state interface
export interface ConfigState {
  data: AppConfig | null;
  error: string | null;
  lastFetched: number | null;
}

// Language model
export interface LanguageModel {
  [key: string]: unknown;
}

// Patient registration fields config model
export interface PatientRegistrationFieldsConfigModel {
  [key: string]: unknown;
}

// Vital model
export interface VitalModel {
  name: string;
  key: string;
  uuid: string;
  is_mandatory: boolean;
  lang: Record<string, string> | null;
  is_enabled: boolean;
}

// Specialization model
export interface SpecializationModel {
  [key: string]: unknown;
}

// WebRTC config model
export interface WebRTCConfigModel {
  [key: string]: unknown;
}

// Patient visit summary config model
export interface PatientVisitSummaryConfigModel {
  [key: string]: unknown;
}

// Patient visit section
export interface PatientVisitSection {
  lang?: string | Record<string, unknown>;
  [key: string]: unknown;
}

// Dropdown values model
export interface DropdownValuesModel {
  [key: string]: unknown;
}

// App configuration interface - based on Angular app-config.service.ts
export interface AppConfig {
  version?: string;
  apiEndpoint?: string;
  specialization?: SpecializationModel[];
  language?: LanguageModel[];
  patient_registration?: PatientRegistrationFieldsConfigModel;
  theme_config?: unknown[];
  patient_vitals?: VitalModel[];
  patient_diagnostics?: unknown[];
  webrtc_section?: boolean;
  webrtc?: WebRTCConfigModel;
  patient_visit_summary?: PatientVisitSummaryConfigModel;
  patient_vitals_section?: boolean;
  patient_reg_other?: boolean;
  patient_reg_address?: boolean;
  abha_section?: boolean;
  sidebar_menus?: { [key: string]: boolean };
  patient_visit_sections?: PatientVisitSection[];
  dropdown_values?: DropdownValuesModel[];
  patient_diagnostics_section?: boolean;
  ai_llm_section?: boolean;
  ai_llm_recording_section?: boolean;
  [key: string]: unknown;
}
