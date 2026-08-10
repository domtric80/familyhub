// ─── Auth ───────────────────────────────────────────────────────────────────

/** Classificazione documentale con permessi (da GET /auth/me capabilities) */
export interface DocumentClassification {
  id?: number
  code: string
  name: string
  description?: string | null
  allowed_roles?: string[]
  is_active?: boolean
}

/** Capabilities effettive dell'utente autenticato */
export interface UserCapabilities {
  permissions: string[]                          // es. 'attachments.read', 'minors.update'
  document_classifications: DocumentClassification[]
}

export interface MfaClientState {
  required: boolean
  enabled: boolean
  confirmed: boolean
  setup_required: boolean
}

export interface UserProfile {
  id: number
  uuid: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  mfa_required: boolean
  mfa_confirmed_at?: string | null
  mfa?: MfaClientState
  user_facility_roles?: FacilityRole[]
  capabilities?: UserCapabilities | null         // richiesta 006
}

export interface FacilityRole {
  id: number
  is_active?: boolean
  valid_from?: string | null
  valid_to?: string | null
  facility?: { id: number; name: string; code: string } | null
  role?: { id: number; code: string; name: string } | null
}

export interface LoginRequest {
  email: string
  password: string
  otp?: string | null
  device_name: string
  login_context_token?: string | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_at: string | null
  mfa: MfaClientState
  user: UserProfile
}

export interface LoginContextResponse {
  token: string
  issued_at: string
  expires_at: string
}

export interface MfaSetupResponse {
  message?: string | null
  secret: string
  otp_auth_url: string | null
  recovery_codes: string[]
  confirmed: boolean
  already_enabled: boolean
}

export interface MfaStatusResponse {
  required: boolean
  enabled: boolean
  confirmed: boolean
  recovery_codes_remaining: number
}

// ─── Lookup ──────────────────────────────────────────────────────────────────

export interface LookupItem {
  id: number
  code: string
  name: string
}

export interface Country {
  id: number
  name: string
  iso2?: string
  iso_code?: string
  regions?: Region[]
}

export interface Region {
  id: number
  country_id?: number
  name: string
  code: string
  provinces_count?: number
  provinces?: Province[]
  country?: Country | null
}

export interface Province {
  id: number
  region_id?: number
  name: string
  code: string
  cities_count?: number
  cities?: City[]
  region?: Region | null
}

export interface City {
  id: number
  name: string
  province_id?: number
  cadastre_code?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  population?: number | null
  timezone?: string | null
  feature_code?: string | null
  province?: Province | null
}

export interface CountryWrite {
  iso_code: string
  name: string
}

export interface RegionWrite {
  country_id: number
  code: string
  name: string
}

export interface ProvinceWrite {
  region_id: number
  code: string
  name: string
}

export interface CityWrite {
  province_id: number
  name: string
  cadastre_code?: string | null
  postal_code?: string | null
}

export interface Role {
  id: number
  code: string
  name: string
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface Organization {
  id: number
  name: string
  legal_name: string | null
  email: string | null
  phone: string | null
}

export interface OrganizationWrite {
  name: string
  legal_name?: string | null
  email?: string | null
  phone?: string | null
}

export interface Facility {
  id: number
  organization_id: number
  code: string
  name: string
  address_line: string
  city_id: number
  postal_code: string | null
  capacity: number | null
  status?: string | null
  status_code?: string | null
  status_label?: string | null
  status_lookup?: { id: number; code: string; name: string } | null
  organization?: Organization | null
  city?: City | null
}

export interface FacilityWrite {
  organization_id: number
  code: string
  name: string
  address_line: string
  city_id: number
  postal_code?: string | null
  capacity?: number | null
  status_code?: string | null
}

export interface AdminUser {
  id: number
  uuid?: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  mfa_required: boolean
  mfa_confirmed_at?: string | null
  last_login_at: string | null
  user_facility_roles?: FacilityRole[]
}

export interface AdminUserWrite {
  first_name: string
  last_name: string
  email: string
  password: string
  is_active?: boolean
  mfa_required?: boolean
}

export interface AdminUserUpdate {
  first_name: string
  last_name: string
  email: string
  password?: string
  is_active?: boolean
  mfa_required?: boolean
}

export interface StaffQualification {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number | null
  is_active: boolean
}

export interface StaffStatus {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number | null
  is_active: boolean
}

export interface FacilityStatus {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number | null
  is_active: boolean
}

export interface StaffDocumentStatus {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number | null
  is_active: boolean
}

export interface StaffDocument {
  id: number
  staff_member_id: number
  document_type_id: number
  attachment_id?: number | null
  status?: string | null
  status_code?: string | null
  status_label?: string | null
  status_lookup?: { id: number; code: string; name: string } | null
  document_type?: { id: number; name: string } | null
  attachment?: Attachment | null
}

export interface DocumentIssuer {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number | null
  is_active: boolean
}

export interface StaffMember {
  id: number
  facility_id: number
  user_id?: number | null
  employee_code: string
  first_name: string
  last_name: string
  display_name?: string | null
  birth_date?: string | null
  birth_city_id?: number | null
  tax_code?: string | null
  email?: string | null
  phone?: string | null
  qualification?: string | null
  qualification_code?: string | null
  qualification_label?: string | null
  qualification_lookup?: { id: number; code: string; name: string } | null
  status?: string | null
  status_code?: string | null
  status_label?: string | null
  status_lookup?: { id: number; code: string; name: string } | null
  facility?: Facility | null
  birth_city?: City | null
  user?: AdminUser | null
}

export interface StaffMemberWrite {
  facility_id: number
  user_id?: number | null
  employee_code: string
  first_name: string
  last_name: string
  birth_date?: string | null
  birth_city_id?: number | null
  tax_code?: string | null
  email?: string | null
  phone?: string | null
  qualification?: string | null
  qualification_code?: string | null
  status?: string | null
  status_code?: string | null
}

/** Payload per POST /admin/users/educator-account */
export interface EducatorAccountPayload {
  // campi account
  email: string
  password: string
  first_name: string
  last_name: string
  // modalità A: collega educatore già esistente
  staff_member_id?: number | null
  // modalità B: crea contestualmente nuova anagrafica educatore
  staff_member?: {
    facility_id: number
    employee_code: string
    first_name?: string
    last_name?: string
    email?: string | null
    phone?: string | null
    qualification?: string | null
    qualification_code?: string | null
    status_code?: string | null
    tax_code?: string | null
  } | null
}

// ─── Anagrafiche admin ────────────────────────────────────────────────────────

export interface DocumentTypeItem {
  id: number
  code: string
  name: string
  scope?: string | null
  document_scope_code?: string | null
  document_scope?: DocumentScopeItem | null
}

export interface DocumentTypeWrite {
  code: string
  name: string
  document_scope_code: string
}

export interface DocumentScopeItem {
  id: number
  code: string
  name: string
  description?: string | null
  is_active: boolean
}

export interface DocumentScopeWrite {
  code: string
  name: string
  description?: string | null
  is_active?: boolean
}

export interface DocumentClassificationWrite {
  code: string
  name: string
  description?: string | null
  allowed_role_codes?: string[]
  is_active?: boolean
}

export interface LookupItemWrite {
  code: string
  name: string
}

export interface OrderedLookupItem {
  id: number
  code: string
  name: string
  sort_order: number
  is_active: boolean
}

export interface OrderedLookupItemWrite {
  code: string
  name: string
  sort_order: number
  is_active: boolean
}

// ─── Ruoli admin ──────────────────────────────────────────────────────────────

export interface AdminRole {
  id: number
  code: string
  name: string
  description: string | null
  is_system: boolean
  permissions_count?: number
  permissions?: Permission[]
}

export interface RoleWrite {
  code: string
  name: string
  description?: string | null
  is_system?: boolean
}

export interface Permission {
  id: number
  code: string
  resource: string
  action: string
  description?: string | null
}

export interface RolePermissionsMatrix {
  role: AdminRole
  permissions: Permission[]
  /** Alias retrocompatibile — usare fallback: all_permissions ?? permissions */
  all_permissions?: Permission[]
  assigned_permission_ids: number[]
}

export interface RolePermissionsWrite {
  permission_ids: number[]
}

// ─── Document Access Matrix (ABAC) ────────────────────────────────────────────

export interface DocumentAccessClassification {
  id: number
  code: string
  name: string
  description: string | null
  is_active: boolean
  allowed_role_codes: string[]
  allowed_download_role_codes: string[]
  assignment_required_for_minor_documents: boolean
}

export interface DocumentAccessEntry {
  classification_code: string
  classification_name: string
  classification_active: boolean
  allowed_by_classification: boolean
  allowed_by_download_classification: boolean
  requires_minor_assignment: boolean
  effective_read_access: boolean
  effective_download_access: boolean
  effective_read_rule: string
  effective_download_rule: string
  notes: string | null
}

export interface DocumentAccessRole {
  id: number
  code: string
  name: string
  description: string | null
  is_system: boolean
  rbac: {
    attachments_read: boolean
    attachments_download: boolean
    attachments_upload: boolean
  }
  document_access: DocumentAccessEntry[]
}

export interface DocumentAccessMatrix {
  meta: {
    model: string
    summary: string
    minor_assignment_required_for_sensitive_minor_documents: boolean
    document_rbac_permissions: {
      read: string
      download: string
      upload: string
    }
  }
  classifications: DocumentAccessClassification[]
  roles: DocumentAccessRole[]
}

export interface DocumentPolicyClassification {
  code: string
  name: string
  description: string | null
  is_active: boolean
  assigned_to_role: boolean
  download_assigned_to_role: boolean
  effective_read_access: boolean
  effective_download_access: boolean
  requires_minor_assignment: boolean
  notes: string | null
}

export interface DocumentPolicy {
  role: { id: number; code: string; name: string }
  rbac: { attachments_read: boolean; attachments_download: boolean; attachments_upload: boolean }
  summary: {
    can_read_any_documents: boolean
    can_download_any_documents: boolean
    can_upload_documents: boolean
    explanation: string
  }
  classifications: DocumentPolicyClassification[]
}

export interface DocumentPolicyWrite {
  classification_codes: string[]
  download_classification_codes: string[]
}

export interface SpreadsheetPreviewSheet {
  name: string
  rows: string[][]
  preview_row_count: number
  max_column_count: number
  truncated_rows: boolean
  truncated_columns: boolean
}

export interface SpreadsheetPreviewPayload {
  kind: 'spreadsheet'
  format: 'xlsx'
  file_name: string
  mime_type: string
  truncated_sheets: boolean
  limits: {
    max_sheets: number
    max_rows_per_sheet: number
    max_columns_per_sheet: number
    max_cell_length: number
  }
  sheets: SpreadsheetPreviewSheet[]
}

export interface Assignment {
  id: number
  user_id: number
  facility_id: number
  role_id: number
  valid_from: string
  valid_to: string | null
  is_active: boolean
  assigned_by_user_id?: number | null
  user?: AdminUser | null
  facility?: Facility | null
  role?: Role | null
  assignedBy?: AdminUser | null
}

export interface AssignmentWrite {
  user_id: number
  facility_id: number
  role_id: number
  valid_from: string
  valid_to?: string | null
  is_active?: boolean
}

export interface AssignmentRevokeResponse {
  message: string
  assignment: Assignment
}

// ─── Assegnazioni per-minore ─────────────────────────────────────────────────

export interface MinorAssignment {
  id:                   number
  minor_id:             number
  user_id:              number
  facility_id:          number
  valid_from:           string
  valid_to:             string | null
  is_active:            boolean
  notes?:               string | null
  assigned_by_user_id?: number | null
  effective_role_code?: string | null
  effective_role_name?: string | null
  minor?:               { id: number; first_name: string; last_name: string; internal_code: string } | null
  user?:                AdminUser | null
  facility?:            Facility | null
  assignedBy?:          AdminUser | null
}

export interface MinorAssignmentWrite {
  facility_id: number
  minor_id:    number
  user_id:     number
  valid_from:  string
  valid_to?:   string | null
  is_active?:  boolean
  notes?:      string | null
}

export interface MinorAssignmentBulkSyncFromMinor {
  user_ids:   number[]
  valid_from: string
  valid_to?:  string | null
  is_active?: boolean
  notes?:     string | null
}

export interface MinorAssignmentBulkSyncFromUser {
  facility_id: number
  minor_ids:   number[]
  valid_from:  string
  valid_to?:   string | null
  is_active?:  boolean
  notes?:      string | null
}

export interface MinorAssignmentRevokeResponse {
  message:    string
  assignment: MinorAssignment
}

// ─── Minori ──────────────────────────────────────────────────────────────────

export interface MinorAssignedUsersResponse {
  minor: Minor
  assignments: MinorAssignment[]
}

export interface UserAssignedMinorsResponse {
  user: Pick<AdminUser, 'id' | 'uuid' | 'email' | 'first_name' | 'last_name' | 'is_active'>
  assignments: MinorAssignment[]
}

export interface MinorPeiTrendEvent {
  objective_id?: number | null
  logged_at?: string | null
  progress_percent: number
  status?: string | null
  source_type?: string | null
  source_id?: string | null
  source_label?: string | null
  notes?: string | null
  actor?: { id: number; display_name?: string | null; email?: string | null } | null
}

export interface MinorPeiObjectiveTrend {
  objective_id: number
  minor_pei_id: number
  objective_code?: string | null
  objective_title: string
  status?: string | null
  current_progress_percent?: number | null
  last_progress_at?: string | null
  series: MinorPeiTrendEvent[]
}

export interface MinorPeiTrendDashboard {
  summary: {
    total_peis: number
    active_peis: number
    total_objectives: number
    completed_objectives: number
    average_progress_percent?: number | null
    linked_activity_events: number
    linked_journal_events: number
  }
  objective_trends: MinorPeiObjectiveTrend[]
  recent_events: MinorPeiTrendEvent[]
}

export interface MinorCaseDetail {
  entry_city_id?: number | null
  origin_facility_id?: number | null
  origin_structure_name?: string | null
  placement_order_reference?: string | null
  placement_order_minor_document_id?: number | null
  judicial_authority_document_issuer_id?: number | null
  proceeding_number?: string | null
  next_hearing_at?: string | null
  general_practitioner_staff_member_id?: number | null
  pediatrician_staff_member_id?: number | null
  health_authority_document_issuer_id?: number | null
  vaccination_minor_document_id?: number | null
  // relazioni
  entry_city?: { id: number; name: string } | null
  origin_facility?: { id: number; name: string } | null
  placement_order_document?: MinorDocument | null
  judicial_authority?: DocumentIssuer | null
  general_practitioner?: StaffMember | null
  pediatrician?: StaffMember | null
  health_authority?: DocumentIssuer | null
  vaccination_document?: MinorDocument | null
}

export interface MinorCaseOptions {
  origin_facilities:     { id: number; name: string }[]
  judicial_authorities:  { id: number; name: string }[]
  health_authorities:    { id: number; name: string }[]
  general_practitioners: { id: number; first_name: string; last_name: string; display_name?: string | null }[]
  pediatricians:         { id: number; first_name: string; last_name: string; display_name?: string | null }[]
  vaccination_documents: { id: number; label?: string | null; attachment?: { original_name?: string } | null }[]
}

export interface Minor {
  id: number
  facility_id: number
  internal_code: string
  first_name: string
  last_name: string
  preferred_name?: string | null
  birth_date: string
  birth_city_id?: number | null
  biological_sex_id?: number | null
  gender_identity_id?: number | null
  tax_code?: string | null
  entry_date: string
  minor_status_id: number
  profile?: MinorProfile | null
  case_detail?: MinorCaseDetail | null
  diagnoses?: MinorDiagnosis[]
  peis?: MinorPei[]
  pei_trends?: MinorPeiTrendDashboard | null
  needs?: MinorNeed[]
  contacts?: MinorContact[]
  documents?: MinorDocument[]
  facility?: Facility | null
  minor_status?: LookupItem | null
  biological_sex?: LookupItem | null
  gender_identity?: LookupItem | null
  birth_city?: City | null
}

export interface MinorWrite {
  facility_id: number
  internal_code: string
  first_name: string
  last_name: string
  preferred_name?: string | null
  birth_date: string
  birth_city_id?: number | null
  biological_sex_id?: number | null
  gender_identity_id?: number | null
  tax_code?: string | null
  entry_date: string
  minor_status_id: number
}

export interface MinorProfile {
  family_background?: string | null
  life_history?: string | null
  learning_styles?: string | null
  interests?: string | null
  hobbies?: string | null
  strengths?: string | null
  risk_factors?: string | null
  crisis_indicators?: string | null
  clinical_notes_encrypted?: string | null
}

export interface MinorDiagnosis {
  id: number
  diagnosis_code?: string | null
  diagnosis_label?: string | null
  dsm_code?: string | null
  diagnosis_notes_encrypted?: string | null
  diagnosed_at?: string | null
  review_due_at?: string | null
  is_primary?: boolean
  is_active?: boolean
}

export interface MinorDiagnosisWrite {
  diagnosis_code?: string | null
  diagnosis_label?: string | null
  dsm_code?: string | null
  diagnosis_notes_encrypted?: string | null
  diagnosed_at?: string | null
  review_due_at?: string | null
  is_primary?: boolean
  is_active?: boolean
}

export interface PeiObjective {
  id: number
  code?: string | null
  title: string
  description?: string | null
  due_date?: string | null
  status?: string | null
  progress_percent?: number | null
  responsible_staff_member_id?: number | null
  responsible_staff_member?: { id: number; display_name?: string | null; first_name?: string; last_name?: string } | null
}

export interface PeiObjectiveWrite {
  code?: string | null
  title: string
  description?: string | null
  due_date?: string | null
  status?: string | null
  progress_percent?: number | null
  responsible_staff_member_id?: number | null
}

export interface MinorPeiHistoryEntry {
  id: number
  event_type: string
  version_number?: number | null
  snapshot?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  actor?: { id: number; display_name?: string | null; email?: string | null } | null
  created_at: string
}

export interface MinorPeiObjectiveProgressEntry {
  id: number
  progress_percent: number
  status?: string | null
  notes?: string | null
  source_type?: string | null
  source_id?: string | null
  source_label?: string | null
  actor?: { id: number; display_name?: string | null; email?: string | null } | null
  created_at: string
}

export interface MinorPei {
  id: number
  title: string
  summary?: string | null
  start_date?: string | null
  review_date?: string | null
  end_date?: string | null
  status?: string | null
  digital_signature_status?: string | null
  signed_at?: string | null
  objectives?: PeiObjective[]
}

export interface MinorPeiWrite {
  title: string
  summary?: string | null
  start_date?: string | null
  review_date?: string | null
  end_date?: string | null
  status?: string | null
  digital_signature_status?: string | null
  signed_at?: string | null
}

export interface MinorNeed {
  id: number
  category_code: string
  title: string
  description?: string | null
  priority: string
  status: string
  responsible_staff_member_id?: number | null
  attachment_minor_document_id?: number | null
  responsible_staff_member?: { id: number; display_name?: string | null; first_name?: string; last_name?: string } | null
  attachment_document?: MinorDocument | null
}

export interface MinorNeedWrite {
  category_code: string
  title: string
  description?: string | null
  priority: string
  status: string
  responsible_staff_member_id?: number | null
  attachment_minor_document_id?: number | null
}

export interface MinorNote {
  id: number
  minor_id: number
  facility_id: number
  classification_code: string
  classification_label: string
  document_classification?: { id: number; code: string; name: string; is_active: boolean } | null
  title: string
  body: string
  is_encrypted: boolean
  created_at: string
  updated_at: string
  created_by?: { id: number; first_name: string; last_name: string } | null
  updated_by?: { id: number; first_name: string; last_name: string } | null
}

export interface MinorNoteWrite {
  classification_code: string
  title: string
  body: string
}

export interface MinorContact {
  id: number
  contact_type_id?: number | null
  first_name: string
  last_name: string
  phone?: string | null
  email?: string | null
  city_id?: number | null
  notes?: string | null
  contact_type?: LookupItem | null
}

export interface MinorContactWrite {
  contact_type_id: number
  first_name: string
  last_name: string
  phone?: string | null
  email?: string | null
  city_id?: number | null
  notes?: string | null
}

export interface MinorDocument {
  id: number
  minor_id: number
  document_type_id: number
  attachment_id: number
  label?: string | null
  issued_by?: string | null
  issue_date?: string | null
  expiry_date?: string | null
  classification?: string | null
  classification_code?: string | null
  classification_label?: string | null
  document_classification?: { id: number; code: string; name: string } | null
  document_issuer_id?: number | null
  issuer_label?: string | null
  document_issuer?: DocumentIssuer | null
  document_type?: LookupItem | null
  attachment?: Attachment | null
}

/** Stato sicurezza allegato — richiesta 007 */
export type AttachmentSecurityStatus = 'pending' | 'clean' | 'infected' | 'rejected'

export interface Attachment {
  id: number
  disk: string
  bucket: string
  path: string
  original_name: string
  mime_type: string
  size_bytes: number
  sha256: string
  is_encrypted: boolean
  // campi quarantena/sicurezza (richiesta 007)
  security_status?: AttachmentSecurityStatus | null
  security_notes?: string | null
  scanned_at?: string | null
  quarantined_at?: string | null
  released_at?: string | null
  scanner_engine?: string | null
}

export interface MinorHistoryActor {
  first_name: string
  last_name: string
  email: string
}

export interface MinorHistoryEntry {
  id: number
  event_type: string
  description: string
  metadata?: Record<string, unknown> | null
  actor_user_id?: number | null
  actor?: MinorHistoryActor | null
  created_at: string
}

export type MinorExitStatus = 'planned' | 'out' | 'returned' | 'cancelled'
export type ReturnCondition = 'regular' | 'delayed' | 'critical'

export interface JournalSummary {
  total: number
  green: number
  yellow: number
  red: number
  follow_up_required: number
  handover_required: number
  handover_pending: number
  daily_series: { date: string; total: number; green: number; yellow: number; red: number }[]
}

export interface ExitSummary {
  total: number
  planned: number
  out: number
  returned: number
  cancelled: number
  overdue_open: number
  follow_up_required: number
  delayed_returns: number
  critical_returns: number
}

export interface MinorExit {
  id: number
  facility_id: number
  minor_id: number
  exit_type_id: number
  destination: string
  reason?: string | null
  accompanied_by?: string | null
  authorized_by_user_id?: number | null
  created_by_user_id?: number | null
  updated_by_user_id?: number | null
  planned_exit_at: string
  expected_return_at?: string | null
  actual_exit_at?: string | null
  actual_return_at?: string | null
  status: MinorExitStatus
  outcome_notes?: string | null
  cancellation_reason?: string | null
  // v2
  is_overdue?: boolean
  delay_minutes?: number | null
  return_condition?: ReturnCondition | null
  follow_up_required?: boolean
  follow_up_notes?: string | null
  facility?: Facility | null
  minor?: Minor | null
  exit_type?: OrderedLookupItem | null
  authorized_by?: AdminUser | null
  created_by?: AdminUser | null
  updated_by?: AdminUser | null
  accompaniers?: ExitAccompanier[] | null
}

export interface MinorExitWrite {
  facility_id: number
  minor_id: number
  exit_type_id: number
  destination: string
  reason?: string | null
  accompanied_by?: string | null
  accompaniers?: ExitAccompanierWrite[]
  authorized_by_user_id?: number | null
  planned_exit_at: string
  expected_return_at?: string | null
  outcome_notes?: string | null
}

export interface MinorExitUpdate {
  exit_type_id: number
  destination: string
  reason?: string | null
  accompanied_by?: string | null
  accompaniers?: ExitAccompanierWrite[]
  authorized_by_user_id?: number | null
  planned_exit_at: string
  expected_return_at?: string | null
  status: MinorExitStatus
  outcome_notes?: string | null
  cancellation_reason?: string | null
}

export interface MinorExitTransition {
  actual_exit_at?: string | null
  actual_return_at?: string | null
  outcome_notes?: string | null
  cancellation_reason?: string | null
  // v2 mark-returned
  return_condition?: ReturnCondition | null
  follow_up_required?: boolean
  follow_up_notes?: string | null
}

export interface ApproachTrendSummary {
  total: number
  planned: number
  in_progress: number
  completed: number
  suspended: number
  cancelled: number
  authorization_expiring: number
  authorization_expired: number
}

export interface ApproachTrend {
  summary: ApproachTrendSummary
  monthly_series: { month: string; total: number; avg_post_reaction_score: number | null }[]
  reaction_distribution: { phase: 'pre' | 'during' | 'post'; level: string; total: number }[]
}

// ─── Exit accompaniers — modello relazionale (spec 069) ──────────────────────

export interface ExitAccompanier {
  id?: number
  person_type: 'staff_member' | 'minor_contact' | 'external'
  staff_member_id?: number | null
  minor_contact_id?: number | null
  external_name?: string | null
  notes?: string | null
  display_name?: string | null
  staff_member?: { id: number; first_name: string; last_name: string } | null
  minor_contact?: {
    id: number
    first_name: string
    last_name: string
    contact_type?: { id: number; code: string; name: string } | null
  } | null
}

export interface ExitAccompanierWrite {
  person_type: 'staff_member' | 'minor_contact' | 'external'
  staff_member_id?: number | null
  minor_contact_id?: number | null
  external_name?: string | null
  notes?: string | null
}

export interface ExitAccompanierOptions {
  minor: {
    id: number
    internal_code: string
    first_name: string
    last_name: string
    facility_id: number
  }
  facility: { id: number; code: string; name: string }
  staff_members: StaffMember[]
  minor_contacts: MinorContact[]
}

// ─── Geography sync (spec 015) ────────────────────────────────────────────────

export type SyncRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed'
  | 'rolled_back'

export interface SyncRun {
  id: number
  run_uuid?: string | null
  trigger_mode?: string | null
  status: SyncRunStatus
  scope?: string | null
  sources?: string[] | null
  started_at?: string | null
  finished_at?: string | null
  duration_seconds?: number | null
  source_file_count?: number | null
  raw_record_count?: number | null
  normalized_record_count?: number | null
  published_record_count?: number | null
  issue_count?: number | null
  error_count?: number | null
  warning_count?: number | null
  decision_count?: number | null
  stats?: Record<string, number> | null
  summary?: Record<string, unknown> | null
}

export type IssueSeverity = 'critical' | 'error' | 'warning' | 'info'

export interface SyncIssue {
  id: number
  severity: IssueSeverity
  issue_type?: string | null
  entity_level?: string | null
  source_system?: string | null
  source_record_key?: string | null
  target_table?: string | null
  target_record_id?: number | null
  message: string
  is_blocking: boolean
  resolved_at?: string | null
  resolution_notes?: string | null
  details?: Record<string, unknown> | null
}

export type DecisionAction = 'create' | 'update' | 'deactivate' | 'skip' | 'manual_review'

export interface SyncDecision {
  id: number
  action: DecisionAction
  entity_level?: string | null
  target_table?: string | null
  target_record_id?: number | null
  source_system?: string | null
  source_record_key?: string | null
  reason_code?: string | null
  executed: boolean
}

export interface SyncRunRequest {
  scope?: string | null
  source?: string | null
  dry_run?: boolean
}

export interface GeoLoadRunOption {
  id: number
  scope?: string | null
  status: SyncRunStatus
  source?: string | null
  dataset?: string | null
  display_name?: string | null
  available_levels?: string[] | null
  is_loadable?: boolean | null
  started_at?: string | null
  finished_at?: string | null
  summary?: Record<string, unknown> | null
}

export interface GeoLoadContinentOption {
  code: string
  name: string
}

export interface GeoLoadCountryOption {
  key: string
  name: string
  iso_code?: string | null
  iso3_code?: string | null
  continent_code?: string | null
  continent_name?: string | null
}

export interface GeoLoadRegionOption {
  key: string
  parent_key?: string | null
  name: string
  code?: string | null
  istat_code?: string | null
}

export interface GeoLoadProvinceOption {
  key: string
  parent_key?: string | null
  name: string
  code?: string | null
  istat_code?: string | null
  vehicle_code?: string | null
}

export interface GeoLoadCityOption {
  key: string
  parent_key?: string | null
  name: string
  istat_code?: string | null
  cadastre_code?: string | null
  postal_code?: string | null
}

export interface GeoLoadExecuteRequest {
  run_id: number
  source: 'geonames' | 'seed' | 'istat'
  level: 'countries' | 'regions' | 'provinces' | 'cities'
  recursive?: boolean
  continent_code?: string | null
  country_key?: string | null
  region_key?: string | null
  province_key?: string | null
}

export interface GeoLoadExecuteResponse {
  countries: number
  regions: number
  provinces: number
  cities: number
  level: 'countries' | 'regions' | 'provinces' | 'cities'
  recursive: boolean
}

// ─── Geography providers (spec 020) ──────────────────────────────────────────

export type GeoProviderType = 'generic' | 'country_specific'
export type GeoProviderMode = 'local_file' | 'remote_file' | 'api'
export type GeoProviderFormat = 'csv' | 'zip' | 'json' | 'xml' | 'txt'
export type GeoProviderAuthType = 'none' | 'api_key' | 'basic'

export interface GeoProvider {
  id: number
  code: string
  name: string
  type: GeoProviderType
  driver?: string | null
  mode?: GeoProviderMode | null
  format?: GeoProviderFormat | null
  source_path?: string | null
  source_url?: string | null
  auth_type?: string | null
  auth_config_json?: Record<string, unknown> | null
  priority?: number | null
  is_active: boolean
  notes?: string | null
  countries_count?: number | null
}

export interface GeoProviderWrite {
  code: string
  name: string
  type: GeoProviderType
  driver?: string | null
  mode?: GeoProviderMode | null
  format?: GeoProviderFormat | null
  source_path?: string | null
  source_url?: string | null
  auth_type?: string | null
  auth_config_json?: Record<string, unknown> | null
  priority?: number | null
  is_active?: boolean
  notes?: string | null
}

export interface CountryProviderMapping {
  id?: number
  provider_id: number
  country_id: number
  is_default: boolean
  priority?: number | null
  is_active: boolean
  config_override_json?: Record<string, unknown> | null
  provider?: GeoProvider | null
  country?: Country | null
}

export interface CountryProviderMappingWrite {
  provider_id: number
  geography_provider_id?: number
  country_id?: number
  is_default?: boolean
  priority?: number | null
  is_active?: boolean
  config_override_json?: Record<string, unknown> | null
}

// ─── Geography import on-demand (spec 021-022) ───────────────────────────────

export interface GeoImportRequest {
  country_id?: number | null
  country_iso_code?: string | null
  provider_id?: number | null
}

export interface GeoImportResultProvider {
  id: number
  code: string
  name: string
  driver?: string | null
  mode?: string | null
  format?: string | null
}

export interface GeoImportResultRun {
  id: number
  status: string
  scope?: string | null
  summary?: Record<string, unknown> | null
}

export interface GeoImportResultCounts {
  countries: number
  regions: number
  provinces: number
  cities: number
}

export interface GeoImportResponseData {
  country: { id: number; iso_code?: string | null; name: string }
  provider: GeoImportResultProvider
  run: GeoImportResultRun
  raw: GeoImportResultCounts
  loaded: GeoImportResultCounts
  warning?: string | null
}

export interface GeoImportResponse {
  message: string
  data: GeoImportResponseData
}

export interface GeoProviderCountriesImportResponseData {
  provider: {
    id: number
    code: string
    name: string
    driver: string
    mode: string
    format?: string | null
  }
  run: {
    id: number
    status: string
    scope: string
    summary?: Record<string, unknown> | null
  }
  raw: GeoLoadExecuteResponse
  loaded: GeoLoadExecuteResponse
  stats: {
    created_countries: number
    updated_countries: number
  }
}

export interface GeoProviderCountriesImportResponse {
  message: string
  data: GeoProviderCountriesImportResponseData
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}

// ── Tipi attività ──────────────────────────────────────────────────────────────
export interface ActivityType {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number
  is_active: boolean
}

export interface ActivityTypeWrite {
  code: string
  name: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

// ── Attività ───────────────────────────────────────────────────────────────────
export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'
export type AttendanceStatus = 'present' | 'partial' | 'absent'
export type SupportLevel = 'autonomous' | 'light' | 'medium' | 'high'

export interface Activity {
  id: number
  minor_id: number
  activity_type_id: number
  title: string
  description?: string | null
  location?: string | null
  planned_start_at: string
  planned_end_at?: string | null
  actual_start_at?: string | null
  actual_end_at?: string | null
  status: ActivityStatus
  pei_objective_id?: number | null
  pei_objective_ref?: string | null
  pei_objective?: PeiObjective | null
  outcome_notes?: string | null
  // v2
  responsible_staff_member_id?: number | null
  attendance_status?: AttendanceStatus | null
  support_level?: SupportLevel | null
  requires_transport?: boolean
  materials_needed?: string | null
  follow_up_required?: boolean
  follow_up_notes?: string | null
  minor?: { id: number; first_name: string; last_name: string; internal_code: string } | null
  activity_type?: ActivityType | null
  responsible_staff_member?: { id: number; display_name: string } | null
}

export interface ActivityWrite {
  minor_id: number
  activity_type_id: number
  title: string
  description?: string | null
  location?: string | null
  planned_start_at: string
  planned_end_at?: string | null
  actual_start_at?: string | null
  actual_end_at?: string | null
  status: ActivityStatus
  pei_objective_id?: number | null
  pei_objective_ref?: string | null
  outcome_notes?: string | null
  // v2
  responsible_staff_member_id?: number | null
  attendance_status?: AttendanceStatus | null
  support_level?: SupportLevel | null
  requires_transport?: boolean
  materials_needed?: string | null
  follow_up_required?: boolean
  follow_up_notes?: string | null
}

// ── Audit ──────────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: number
  occurred_at_utc: string
  ip_address?: string | null
  actor_user_id?: number | null
  actor_display_name?: string | null
  actor_role_name?: string | null
  operation_summary?: string | null
  action?: string | null
  resource_type?: string | null
  resource_id?: number | null
  resource_label?: string | null
  facility_id?: number | null
  minor_id?: number | null
  old_values_json?: Record<string, unknown> | null
  new_values_json?: Record<string, unknown> | null
  actor_user?: AdminUser | null
  facility?: Facility | null
  minor?: { id: number; first_name: string; last_name: string; internal_code: string } | null
}

export interface AuditPreset {
  code: string
  label: string
  query?: Record<string, string>
  actions?: string[]
  resource_types?: string[]
}

export interface AuditLogFilters {
  actions: string[]
  resource_types: string[]
  presets?: AuditPreset[]
}

export interface AuditKpiTopActor {
  user_id?: number | null
  actor_display_name: string | null
  total: number
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export interface AuditKpiBreakdown {
  resource_type?: string | null
  action?: string | null
  total: number
}

export interface AuditKpiDailySeries {
  day: string | null
  total: number
}

export interface AuditKpi {
  summary: {
    login_failures: number
    document_access_events: number
    permission_change_events: number
    minor_read_events: number
    total_events: number
  }
  top_actors: AuditKpiTopActor[]
  resource_breakdown: AuditKpiBreakdown[]
  action_breakdown: AuditKpiBreakdown[]
  daily_series: AuditKpiDailySeries[]
}

// ── Avvicinamenti ─────────────────────────────────────────────────────────────

// ─── Avvicinamenti — Partecipanti ────────────────────────────────────────────

export interface ApproachParticipant {
  id?: number
  minor_contact_id: number
  contact_type_id?: number | null
  sort_order?: number
  contact?: { id: number; first_name: string; last_name: string } | null
  contact_type?: { id: number; name: string } | null
}

export interface ApproachParticipantWrite {
  minor_contact_id: number
  contact_type_id?: number | null
}

export interface ApproachStaffParticipant {
  id?: number
  staff_member_id: number
  qualification_code?: string | null
  sort_order?: number
  staff_member?: { id: number; first_name: string; last_name: string; display_name?: string } | null
  qualification?: { code: string; name: string } | null
}

export interface ApproachStaffParticipantWrite {
  staff_member_id: number
  qualification_code?: string | null
}

export type ApproachStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'suspended'
export type ReactionLevel = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
export type AuthorizationStatus = 'active' | 'expiring' | 'expired'

export interface ApproachType {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number | null
  is_active: boolean
}

export interface Approach {
  id: number
  minor_id: number
  approach_type_id: number
  minor_contact_id?: number | null
  supervising_staff_member_id?: number | null
  title: string
  objective?: string | null
  location?: string | null
  scheduled_at?: string | null
  planned_start_at: string
  planned_end_at?: string | null
  actual_start_at?: string | null
  actual_end_at?: string | null
  status: ApproachStatus
  outcome_notes?: string | null
  next_steps?: string | null
  // v2 — Provvedimento autorizzativo
  authorization_reference?: string | null
  authorization_issued_at?: string | null
  authorization_expires_at?: string | null
  authorization_renewal_alert_days?: number | null
  authorization_status?: AuthorizationStatus | null
  authorization_needs_renewal?: boolean
  // v2 — Reazione del minore
  pre_reaction_level?: ReactionLevel | null
  pre_reaction_notes?: string | null
  during_reaction_level?: ReactionLevel | null
  during_reaction_notes?: string | null
  post_reaction_level?: ReactionLevel | null
  post_reaction_notes?: string | null
  // v2 — Note riservate
  reserved_psychologist_notes?: string | null
  reserved_coordinator_notes?: string | null
  can_view_reserved_psychologist_notes?: boolean
  can_view_reserved_coordinator_notes?: boolean
  has_reserved_notes?: boolean
  // v2 — Sospensione
  suspension_reason?: string | null
  suspended_at?: string | null
  suspended_by_user_id?: number | null
  suspension_signed_at?: string | null
  // v3 — Multi-contatto
  minor_contact_ids?: number[] | null
  minor_contacts_count?: number | null
  minor_contacts?: { id: number; first_name: string; last_name: string }[] | null
  // v3 — Partecipanti strutturati
  participants?: ApproachParticipant[] | null
  staff_participants?: ApproachStaffParticipant[] | null
  staff_participants_count?: number | null
  authorization_minor_document_id?: number | null
  authorization_minor_document?: { id: number; original_name: string } | null
  // Relations
  facility?: { id: number; name: string } | null
  minor?: { id: number; first_name: string; last_name: string; internal_code: string } | null
  approach_type?: ApproachType | null
  minor_contact?: { id: number; first_name: string; last_name: string } | null
  supervising_staff_member?: { id: number; first_name: string; last_name: string } | null
  created_by?: { id: number; display_name: string } | null
  updated_by?: { id: number; display_name: string } | null
}

export interface ApproachWrite {
  minor_id: number
  approach_type_id: number
  minor_contact_ids?: number[]
  minor_contact_id?: number | null
  participants?: ApproachParticipantWrite[]
  staff_participants?: ApproachStaffParticipantWrite[]
  authorization_minor_document_id?: number | null
  supervising_staff_member_id?: number | null
  title: string
  objective?: string | null
  location?: string | null
  planned_start_at: string
  planned_end_at?: string | null
  actual_start_at?: string | null
  actual_end_at?: string | null
  status: ApproachStatus
  outcome_notes?: string | null
  next_steps?: string | null
  // v2
  authorization_reference?: string | null
  authorization_issued_at?: string | null
  authorization_expires_at?: string | null
  authorization_renewal_alert_days?: number | null
  pre_reaction_level?: ReactionLevel | null
  pre_reaction_notes?: string | null
  during_reaction_level?: ReactionLevel | null
  during_reaction_notes?: string | null
  post_reaction_level?: ReactionLevel | null
  post_reaction_notes?: string | null
  reserved_psychologist_notes?: string | null
  reserved_coordinator_notes?: string | null
  suspension_reason?: string | null
  suspended_at?: string | null
  suspension_signed_at?: string | null
}

// ── Diario educativo ──────────────────────────────────────────────────────────

export interface JournalEntryType {
  id: number
  code: string
  name: string
  description?: string | null
  sort_order?: number | null
  is_active: boolean
}

export type PriorityLevel = 'green' | 'yellow' | 'red'
export type MoodLevel = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'

export interface JournalEntry {
  id: number
  minor_id: number
  journal_entry_type_id: number
  observed_at: string
  title: string
  content: string
  follow_up_required: boolean
  follow_up_notes?: string | null
  pei_objective_id?: number | null
  pei_objective?: PeiObjective | null
  // v2
  priority_level?: PriorityLevel | null
  mood_level?: MoodLevel | null
  nutrition_summary?: string | null
  hygiene_summary?: string | null
  sleep_summary?: string | null
  handover_required?: boolean
  handover_notes?: string | null
  handover_read_at?: string | null
  handover_read_by_user_id?: number | null
  // Relations
  facility?: { id: number; name: string } | null
  minor?: { id: number; first_name: string; last_name: string; internal_code: string } | null
  journal_entry_type?: JournalEntryType | null
  created_by?: { id: number; display_name: string } | null
  updated_by?: { id: number; display_name: string } | null
}

export interface JournalEntryWrite {
  minor_id: number
  journal_entry_type_id: number
  observed_at: string
  title: string
  content: string
  follow_up_required?: boolean
  follow_up_notes?: string | null
  pei_objective_id?: number | null
  priority_level?: PriorityLevel | null
  mood_level?: MoodLevel | null
  nutrition_summary?: string | null
  hygiene_summary?: string | null
  sleep_summary?: string | null
  handover_required?: boolean
  handover_notes?: string | null
  handover_read_at?: string | null
  handover_read_by_user_id?: number | null
}

// ─── Messaggistica interna ────────────────────────────────────────────────────

export type ThreadType = 'facility' | 'minor'

export interface MessageParticipantOption {
  id: number
  display_name: string
  first_name?: string
  last_name?: string
  email?: string | null
  role_code?: string | null
  role_name?: string | null
  is_minor_scoped?: boolean
}

export interface MessageParticipantOptionsResponse {
  facility_id: number
  minor_id?: number | null
  classification_code?: string | null
  users: MessageParticipantOption[]
}

export interface MessageParticipant {
  id: number
  thread_id: number
  user_id: number
  joined_at?: string | null
  last_read_at?: string | null
  is_active: boolean
  // user nested (schema reale backend)
  user?: { id: number; first_name: string; last_name: string; email?: string } | null
  // campi opzionali per compatibilità
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
}

export interface InternalMessage {
  id: number
  thread_id: number
  sender_user_id: number
  body: string
  created_at?: string | null
  updated_at?: string | null
  // sender nested (schema reale backend)
  sender?: { id: number; first_name: string; last_name: string; email?: string } | null
  // compat: alcuni backend popolano created_by, altri sender
  created_by?: { id: number; display_name?: string | null; first_name?: string | null; last_name?: string | null } | null
}

export interface InternalMessageThread {
  id: number
  facility_id: number
  minor_id?: number | null
  thread_type: ThreadType
  subject: string
  topic?: string | null
  classification_code?: string | null
  classification_label?: string | null
  document_classification?: { id: number; code: string; name: string; is_active?: boolean } | null
  last_message_at?: string | null
  archived_at?: string | null
  unread_count: number
  facility?: { id: number; name: string } | null
  minor?: { id: number; first_name: string; last_name: string; internal_code: string } | null
  participants: MessageParticipant[]
  latest_message?: InternalMessage | null
  messages?: InternalMessage[]
  created_by?: { id: number; display_name: string } | null
}

export interface InternalMessageThreadWrite {
  facility_id: number
  minor_id?: number | null
  thread_type: ThreadType
  subject: string
  topic?: string | null
  classification_code?: string | null
  participant_user_ids: number[]
  message_body: string
}

// Turni H24

export type ShiftAssignmentStatus = 'planned' | 'confirmed' | 'completed' | 'cancelled'

export interface StaffShiftTemplate {
  id: number
  facility_id: number
  code: string
  name: string
  start_time: string
  end_time: string
  minimum_staff_required: number
  sort_order: number
  is_active: boolean
  facility?: { id: number; name: string } | null
}

export interface StaffShiftTemplateWrite {
  facility_id: number
  code: string
  name: string
  start_time: string
  end_time: string
  minimum_staff_required: number
  sort_order?: number
  is_active?: boolean
}

export interface StaffShiftAssignment {
  id: number
  facility_id: number
  shift_template_id: number
  staff_member_id: number
  shift_date: string
  starts_at: string
  ends_at: string
  status: ShiftAssignmentStatus
  notes?: string | null
  facility?: { id: number; name: string } | null
  shift_template?: StaffShiftTemplate | null
  staff_member?: { id: number; first_name: string; last_name: string; display_name?: string | null } | null
}

export interface StaffShiftAssignmentWrite {
  facility_id: number
  shift_template_id: number
  staff_member_id: number
  shift_date: string
  starts_at?: string
  ends_at?: string
  status?: ShiftAssignmentStatus
  notes?: string | null
}

export interface ShiftWeekBlock {
  shift_template: StaffShiftTemplate
  minimum_staff_required: number
  assigned_count: number
  coverage_gap: number
  assignments: StaffShiftAssignment[]
}

export interface ShiftWeekDay {
  date: string
  shifts: ShiftWeekBlock[]
}

export interface StaffShiftWeekView {
  facility_id: number
  week_start: string
  week_end: string
  days: ShiftWeekDay[]
}

export type MyWeekAssignment = StaffShiftAssignment

export interface StaffShiftMyWeek {
  staff_member: { id: number; first_name: string; last_name: string; display_name?: string | null }
  week_start: string
  week_end: string
  assignments: MyWeekAssignment[]
}

// Timesheet

export type TimesheetEntryStatus = 'draft' | 'computed' | 'submitted' | 'approved' | 'rejected' | 'locked'
export type TimesheetAdjustmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type AttendanceEventType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end'
export type AttendanceEventSource = 'web' | 'mobile' | 'manual' | 'system'

export interface AttendanceEvent {
  id: number
  staff_member_id: number
  shift_assignment_id?: number | null
  event_type: AttendanceEventType
  source: AttendanceEventSource
  occurred_at: string
  latitude?: number | null
  longitude?: number | null
  notes?: string | null
  staff_member?: { id: number; first_name: string; last_name: string } | null
}

export interface TimesheetAdjustment {
  id: number
  timesheet_entry_id: number
  adjustment_type: string
  delta_minutes: number
  reason: string
  status: TimesheetAdjustmentStatus
  created_by_id?: number | null
  created_at?: string | null
  reviewed_by_id?: number | null
  reviewed_at?: string | null
  review_notes?: string | null
}

export interface TimesheetAdjustmentQueueItem {
  id: number
  timesheet_entry_id: number
  adjustment_type: string
  delta_minutes: number
  reason: string
  status: TimesheetAdjustmentStatus
  created_at?: string | null
  reviewed_at?: string | null
  review_notes?: string | null
  created_by?: { id: number; first_name: string; last_name: string; email?: string | null } | null
  reviewed_by?: { id: number; first_name: string; last_name: string; email?: string | null } | null
  timesheet_entry?: {
    id: number
    work_date?: string | null
    status?: TimesheetEntryStatus | string | null
    worked_minutes?: number | null
    planned_minutes?: number | null
    variance_minutes?: number | null
    facility?: { id: number; name: string } | null
    staff_member?: { id: number; first_name: string; last_name: string; display_name?: string | null; employee_code?: string | null } | null
    shift_assignment?: { id: number; shift_template?: { id: number; name: string; code?: string | null } | null } | null
  } | null
}

export interface TimesheetAdjustmentQueueFilters {
  facility_id?: number
  staff_member_id?: number
  status?: TimesheetAdjustmentStatus
  adjustment_type?: string
  date_from?: string
  date_to?: string
}

export interface TimesheetAdjustmentQueueKpis {
  pending_count: number
  approved_count: number
  rejected_count: number
  average_review_hours?: number | null
}

export interface TimesheetAdjustmentWrite {
  adjustment_type: string
  delta_minutes: number
  reason: string
}

export interface TimesheetEntry {
  id: number
  staff_member_id: number
  shift_assignment_id?: number | null
  work_date: string
  planned_start?: string | null
  planned_end?: string | null
  actual_start?: string | null
  actual_end?: string | null
  planned_minutes?: number | null
  worked_minutes?: number | null
  ordinary_minutes?: number | null
  overtime_minutes?: number | null
  night_minutes?: number | null
  absence_minutes?: number | null
  break_minutes?: number | null
  delta_minutes?: number | null
  has_anomaly: boolean
  anomaly_notes?: string | null
  status: TimesheetEntryStatus
  submitted_at?: string | null
  approved_at?: string | null
  approved_by_id?: number | null
  facility_id?: number | null
  notes?: string | null
  staff_member?: { id: number; first_name: string; last_name: string; display_name?: string | null } | null
  shift_assignment?: StaffShiftAssignment | null
  facility?: { id: number; name: string } | null
  attendance_events?: AttendanceEvent[]
  adjustments?: TimesheetAdjustment[]
}

export interface TimesheetEntryFilters {
  facility_id?: number
  staff_member_id?: number
  date_from?: string
  date_to?: string
  status?: TimesheetEntryStatus
  has_anomaly?: boolean
}

// Backup database

export interface DatabaseBackup {
  filename: string
  path: string
  size_bytes: number
  created_at: string
  download_url: string
}

export interface DatabaseBackupListResponse {
  items: DatabaseBackup[]
  restore_confirm_text: string
}

export interface DatabaseRestoreRequest {
  backup_filename: string
  confirm_text: string
  create_pre_restore_backup: boolean
}

export interface DatabaseRestoreResponse {
  restored: boolean
  source: { filename: string; uploaded: boolean }
  pre_restore_backup?: DatabaseBackup | null
  post_restore_counts: Record<string, number>
}


// ─── Timesheet Month Lock ─────────────────────────────────────────────────────

export interface TimesheetMonthLockUser {
  id: number
  first_name: string
  last_name: string
  email: string
}

export interface TimesheetMonthLock {
  id: number
  facility_id: number
  year: number
  month: number
  is_locked: boolean
  locked_at: string | null
  unlocked_at: string | null
  notes: string | null
  facility: { id: number; name: string }
  locked_by: TimesheetMonthLockUser | null
  unlocked_by: TimesheetMonthLockUser | null
}

export interface TimesheetMonthLockCreate {
  facility_id: number
  year: number
  month: number
  notes?: string
}

export interface TimesheetMonthLockResponse {
  message: string
  lock: TimesheetMonthLock
  entries_locked: number
}

export interface TimesheetMonthUnlockResponse {
  message: string
  lock: TimesheetMonthLock
  entries_unlocked: number
}

export interface TimesheetDashboardSummaryEntryRef {
  id: number
  work_date: string
  status: TimesheetEntryStatus | string
  facility?: { id: number; name: string } | null
  staff_member?: { id: number; first_name: string; last_name: string; display_name?: string | null; employee_code?: string | null } | null
}

export interface TimesheetDashboardOpenAnomaly extends TimesheetDashboardSummaryEntryRef {
  variance_minutes: number
  overtime_minutes: number
  absence_minutes: number
  anomaly_flags: string[]
}

export interface TimesheetDashboardOvertimeEntry extends TimesheetDashboardSummaryEntryRef {
  worked_minutes: number
  planned_minutes: number
  overtime_minutes: number
  shift_template?: { id: number; name: string; code?: string | null } | null
}

export interface TimesheetDashboardAbsenceReconciliation {
  id: number
  timesheet_entry_id: number
  delta_minutes: number
  reason: string
  reviewed_at?: string | null
  timesheet_entry?: TimesheetDashboardSummaryEntryRef | null
}

export interface TimesheetDashboardPendingAdjustment {
  id: number
  timesheet_entry_id: number
  adjustment_type: string
  delta_minutes: number
  reason: string
  status: TimesheetAdjustmentStatus
  created_at?: string | null
  timesheet_entry?: TimesheetDashboardSummaryEntryRef | null
}

export interface TimesheetDashboardSummary {
  entries_total: number
  submitted_entries_count: number
  approved_or_locked_entries_count: number
  open_anomalies_count: number
  overtime_minutes_total: number
  absence_reconciliations_count: number
  absence_reconciled_minutes_total: number
  pending_adjustments_count: number
}

export interface TimesheetCoordinatorDashboardResponse {
  summary: TimesheetDashboardSummary
  open_anomalies: TimesheetDashboardOpenAnomaly[]
  top_overtime_entries: TimesheetDashboardOvertimeEntry[]
  absence_reconciliations: TimesheetDashboardAbsenceReconciliation[]
  pending_adjustments: TimesheetDashboardPendingAdjustment[]
}
