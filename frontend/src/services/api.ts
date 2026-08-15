import axios, { type AxiosError } from 'axios'
import type {
  LoginRequest, LoginResponse, LoginContextResponse, MfaSetupResponse, MfaStatusResponse,
  UserProfile, Country, City, Role, LookupItem, DocumentClassification,
  CountryWrite, RegionWrite, ProvinceWrite, CityWrite, Region, Province,
  Organization, OrganizationWrite,
  Facility, FacilityWrite, FacilityStatus,
  StaffDocumentStatus, StaffDocument, DocumentIssuer,
  AdminUser, AdminUserWrite, AdminUserUpdate,
  StaffMember, StaffMemberWrite, StaffQualification, StaffStatus,
  Assignment, AssignmentWrite,
  Minor, MinorWrite, MinorProfile,
  MinorContact, MinorContactWrite,
  MinorDocument, MinorHistoryEntry, MinorExit, MinorExitWrite, MinorExitUpdate, MinorExitTransition,
  ExitAccompanierOptions,
  DocumentTypeItem, DocumentTypeWrite, DocumentScopeItem, DocumentScopeWrite, DocumentClassificationWrite,
  LookupItemWrite,
  OrderedLookupItem, OrderedLookupItemWrite,
  AdminRole, RoleWrite,
  RolePermissionsMatrix, RolePermissionsWrite,
  AssignmentRevokeResponse,
  MinorAssignment, MinorAssignmentWrite, MinorAssignmentRevokeResponse, MinorAssignedUsersResponse, UserAssignedMinorsResponse,
  MinorAssignmentBulkSyncFromMinor, MinorAssignmentBulkSyncFromUser,
  SyncRun, SyncIssue, SyncDecision, SyncRunRequest,
  GeoLoadRunOption, GeoLoadContinentOption, GeoLoadCountryOption, GeoLoadRegionOption, GeoLoadProvinceOption, GeoLoadCityOption,
  GeoLoadExecuteRequest, GeoLoadExecuteResponse,
  GeoProvider, GeoProviderWrite, CountryProviderMapping, CountryProviderMappingWrite,
  GeoImportRequest, GeoImportResponse, GeoProviderCountriesImportResponse,
  ApiError,
  EducatorAccountPayload,
  ActivityType, ActivityTypeWrite, Activity, ActivityWrite, ActivityStatus,
  AuditLog, AuditLogFilters, AuditPreset, AuditKpi, AuditKpiTopActor, AuditKpiBreakdown, AuditKpiDailySeries, PaginatedResponse,
  ApproachType, Approach, ApproachWrite, ApproachTrend,
  JournalEntryType, JournalEntry, JournalEntryWrite, JournalSummary,
  JournalShift, JournalShiftWrite, JournalShiftClosePayload, JournalShiftCloseResponse,
  InternalMessage, InternalMessageThread, InternalMessageThreadWrite, MessageParticipantOption, MessageParticipantOptionsResponse,
  ExitSummary,
  DocumentAccessMatrix,
  DocumentPolicy,
  DocumentPolicyWrite,
  StaffShiftTemplate, StaffShiftTemplateWrite,
  StaffShiftAssignment, StaffShiftAssignmentWrite, StaffShiftSubstitution, StaffShiftSubstitutionWrite, ShiftExceptionsResponse, ShiftSubmitResponse,
  StaffShiftWeekView, StaffShiftMonthView, StaffShiftMyWeek, StaffShiftMyMonth,
  AttendanceEvent, AttendanceEventType,
  TimesheetEntry, TimesheetEntryFilters, TimesheetAdjustmentWrite, TimesheetAdjustment, TimesheetAdjustmentQueueFilters, TimesheetAdjustmentQueueKpis,
  TimesheetCoordinatorDashboardResponse,
  TimesheetMonthLock, TimesheetMonthLockCreate, TimesheetMonthLockResponse, TimesheetMonthUnlockResponse,
  DatabaseBackup, DatabaseBackupListResponse, DatabaseRestoreRequest, DatabaseRestoreResponse,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

const http = axios.create({ baseURL: BASE_URL })

// Inietta token JWT ad ogni richiesta
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect a /login su 401 — escluse le rotte /auth/ (es. login con credenziali errate)
http.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    const url = err.config?.url ?? ''
    const isAuthRoute = url.includes('/auth/')
    if (err.response?.status === 401 && !isAuthRoute) {
      // Salva il messaggio backend (es. "Sessione scaduta per inattività oltre 60 minuti.")
      const msg = (err.response?.data as Record<string, unknown>)?.message as string | undefined
      sessionStorage.setItem('auth_expired_message', msg ?? 'Sessione scaduta. Accedi nuovamente.')
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export function apiError(err: unknown): ApiError {
  const e = err as AxiosError<ApiError>
  const httpStatus = e.response?.status
  const data = e.response?.data ?? { message: 'Errore di rete' }
  // Assicura che status sia sempre popolato dall'HTTP response (non solo dal body backend)
  return { ...data, status: httpStatus ?? data.status }
}

/** Messaggio user-friendly basato su HTTP status (da usare nelle pagine CRUD) */
export function errorMessage(ae: ApiError): string {
  if (ae.status === 403) return 'Permesso insufficiente — contatta l\'amministratore'
  if (ae.status === 409) return ae.message ?? 'Record in uso: impossibile completare l\'operazione'
  return ae.message ?? 'Errore di sistema'
}

// ─── Auth ───────────────────────────────────────────────────────────────────────────────

export const authApi = {
  loginContext: () =>
    http.get<LoginContextResponse>('/auth/login-context').then((r) => r.data),

  login: (data: LoginRequest) =>
    http.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  me: () =>
    http.get<{ user: UserProfile }>('/auth/me').then((r) => r.data.user),

  logout: () => http.post('/auth/logout'),

  setupMfa: () =>
    http.post<MfaSetupResponse>('/auth/mfa/setup').then((r) => r.data),

  confirmMfa: (code: string) =>
    http.post('/auth/mfa/confirm', { code }),

  mfaStatus: () =>
    http.get<MfaStatusResponse>('/auth/mfa/status').then((r) => r.data),

  regenerateRecoveryCodes: (code: string) =>
    http.post<{ message: string; recovery_codes: string[] }>('/auth/mfa/recovery-codes/regenerate', { code }).then((r) => r.data),

  disableMfa: () => http.post('/auth/mfa/disable'),
}

// ─── Lookups ──────────────────────────────────────────────────────────────────────────

export const lookupsApi = {
  geography: () =>
    http.get<Country[]>('/lookups/geography').then((r) => r.data),

  cities: (params?: { province_id?: number; region_id?: number; country_id?: number; id?: number; q?: string; limit?: number }) =>
    http.get<City[]>('/lookups/cities', { params }).then((r) => r.data),

  roles: () =>
    http.get<Role[]>('/lookups/roles').then((r) => r.data),

  documentTypes: () =>
    http.get<LookupItem[]>('/lookups/document-types').then((r) => r.data),

  contactTypes: () =>
    http.get<LookupItem[]>('/lookups/contact-types').then((r) => r.data),

  minorStatuses: () =>
    http.get<LookupItem[]>('/lookups/minor-statuses').then((r) => r.data),

  biologicalSexes: () =>
    http.get<LookupItem[]>('/lookups/biological-sexes').then((r) => r.data),

  exitTypes: () =>
    http.get<LookupItem[]>('/lookups/exit-types').then((r) => r.data),

  approachTypes: () =>
    http.get<ApproachType[]>('/lookups/approach-types').then((r) => r.data),

  journalEntryTypes: () =>
    http.get<JournalEntryType[]>('/lookups/journal-entry-types').then((r) => r.data),

  genderIdentities: () =>
    http.get<LookupItem[]>('/lookups/gender-identities').then((r) => r.data),

  documentClassifications: () =>
    http.get<DocumentClassification[]>('/lookups/document-classifications').then((r) => r.data),

  documentScopes: () =>
    http.get<DocumentScopeItem[]>('/lookups/document-scopes').then((r) => r.data),

  activityTypes: () =>
    http.get<ActivityType[]>('/lookups/activity-types').then((r) => r.data),

  staffQualifications: () =>
    http.get<StaffQualification[]>('/lookups/staff-qualifications').then((r) => r.data),

  staffStatuses: () =>
    http.get<StaffStatus[]>('/lookups/staff-statuses').then((r) => r.data),

  facilityStatuses: () =>
    http.get<FacilityStatus[]>('/lookups/facility-statuses').then((r) => r.data),

  staffDocumentStatuses: () =>
    http.get<StaffDocumentStatus[]>('/lookups/staff-document-statuses').then((r) => r.data),

  documentIssuers: () =>
    http.get<DocumentIssuer[]>('/lookups/document-issuers').then((r) => r.data),
}

// ─── Admin — Organizzazioni ───────────────────────────────────────────────────────────────────────────

export const orgApi = {
  list: () =>
    http.get<Organization[]>('/admin/organizations').then((r) => r.data),

  get: (id: number) =>
    http.get<Organization>(`/admin/organizations/${id}`).then((r) => r.data),

  create: (data: OrganizationWrite) =>
    http.post<Organization>('/admin/organizations', data).then((r) => r.data),

  update: (id: number, data: OrganizationWrite) =>
    http.put<Organization>(`/admin/organizations/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/organizations/${id}`),
}

// ─── Admin — Strutture ─────────────────────────────────────────────────────────────────────────────

export const facilityApi = {
  list: () =>
    http.get<Facility[]>('/admin/facilities').then((r) => r.data),

  get: (id: number) =>
    http.get<Facility>(`/admin/facilities/${id}`).then((r) => r.data),

  create: (data: FacilityWrite) =>
    http.post<Facility>('/admin/facilities', data).then((r) => r.data),

  update: (id: number, data: FacilityWrite) =>
    http.put<Facility>(`/admin/facilities/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/facilities/${id}`),
}

// ─── Admin — Utenti ──────────────────────────────────────────────────────────────────────────────

export const adminUserApi = {
  list: () =>
    http.get<AdminUser[]>('/admin/users').then((r) => r.data),

  get: (id: number) =>
    http.get<AdminUser>(`/admin/users/${id}`).then((r) => r.data),

  create: (data: AdminUserWrite) =>
    http.post<AdminUser>('/admin/users', data).then((r) => r.data),

  update: (id: number, data: AdminUserUpdate) =>
    http.put<AdminUser>(`/admin/users/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/users/${id}`),

  deactivate: (id: number) =>
    http.post<{ message: string }>(`/admin/users/${id}/deactivate`).then((r) => r.data),

  resetMfa: (id: number) =>
    http.post<{ message: string }>(`/admin/users/${id}/reset-mfa`).then((r) => r.data),

  /** Educatori non ancora collegati a un account (per wizard utente educatore) */
  linkableStaffMembers: (params?: { facility_id?: number; q?: string }) =>
    http.get<StaffMember[]>('/admin/users/linkable-staff-members', { params }).then((r) => r.data),

  /** Creazione guidata account educatore (link esistente o crea anagrafica) */
  createEducatorAccount: (data: EducatorAccountPayload) =>
    http.post<AdminUser>('/admin/users/educator-account', data).then((r) => r.data),
}

export const staffMemberApi = {
  list: (params?: { facility_id?: number; user_id?: number; status?: string }) =>
    http.get<StaffMember[]>('/admin/staff-members', { params }).then((r) => r.data),

  get: (id: number) =>
    http.get<StaffMember>(`/admin/staff-members/${id}`).then((r) => r.data),

  create: (data: StaffMemberWrite) =>
    http.post<StaffMember>('/admin/staff-members', data).then((r) => r.data),

  update: (id: number, data: StaffMemberWrite) =>
    http.put<StaffMember>(`/admin/staff-members/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/staff-members/${id}`),

  /** Collega un educatore a un account utente esistente */
  linkUser: (staffMemberId: number, userId: number) =>
    http.post<StaffMember>(`/admin/staff-members/${staffMemberId}/link-user`, { user_id: userId }).then((r) => r.data),

  previewDocument: (staffId: number, documentId: number) =>
    http.get(`/admin/staff-members/${staffId}/documents/${documentId}/preview`, { responseType: 'blob' }).then((r) => r.data as Blob),

  previewDocumentStructured: (staffId: number, documentId: number) =>
    http.get<import('../types').SpreadsheetPreviewPayload>(`/admin/staff-members/${staffId}/documents/${documentId}/preview-structured`).then((r) => r.data),

  downloadDocument: (staffId: number, documentId: number) =>
    http.get(`/admin/staff-members/${staffId}/documents/${documentId}/download`, { responseType: 'blob' }).then((r) => r.data as Blob),
}

export const staffMemberDocumentApi = {
  list: (staffId: number) =>
    http.get<import('../types').StaffDocument[]>(`/admin/staff-members/${staffId}/documents`).then((r) => r.data),

  upload: (staffId: number, formData: FormData) =>
    http.post<import('../types').StaffDocument>(`/admin/staff-members/${staffId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  update: (staffId: number, docId: number, data: import('../types').StaffDocumentWrite) =>
    http.put<import('../types').StaffDocument>(`/admin/staff-members/${staffId}/documents/${docId}`, data).then((r) => r.data),

  /** Archiviazione logica — non cancella il file */
  archive: (staffId: number, docId: number) =>
    http.delete(`/admin/staff-members/${staffId}/documents/${docId}`),

  expirySummary: (params?: { facility_id?: number }) =>
    http.get<import('../types').StaffDocumentExpirySummary>('/admin/staff-documents/expiry-summary', { params }).then((r) => r.data),

  previewDocument: (staffId: number, documentId: number) =>
    http.get(`/admin/staff-members/${staffId}/documents/${documentId}/preview`, { responseType: 'blob' }).then((r) => r.data as Blob),

  downloadDocument: (staffId: number, documentId: number) =>
    http.get(`/admin/staff-members/${staffId}/documents/${documentId}/download`, { responseType: 'blob' }).then((r) => r.data as Blob),
}

export const staffProfessionalProfileApi = {
  get: (staffId: number) =>
    http.get<import('../types').StaffProfessionalProfile>(`/admin/staff-members/${staffId}/professional-profile`).then((r) => r.data),

  save: (staffId: number, data: import('../types').StaffProfessionalProfileWrite) =>
    http.put<import('../types').StaffProfessionalProfile>(`/admin/staff-members/${staffId}/professional-profile`, data).then((r) => r.data),

  lookups: (type: 'skills' | 'languages' | 'specializations' | 'proficiency-levels' | 'certification-types') =>
    http.get<import('../types').StaffProfileLookupItem[]>(`/admin/staff-profile-lookups/${type}`).then((r) => r.data),

  createLookupItem: (type: 'skills' | 'languages' | 'specializations' | 'proficiency-levels' | 'certification-types', data: Omit<import('../types').StaffProfileLookupItem, 'id'>) =>
    http.post<import('../types').StaffProfileLookupItem>(`/admin/staff-profile-lookups/${type}`, data).then((r) => r.data),

  updateLookupItem: (type: 'skills' | 'languages' | 'specializations' | 'proficiency-levels' | 'certification-types', id: number, data: Partial<Omit<import('../types').StaffProfileLookupItem, 'id'>>) =>
    http.put<import('../types').StaffProfileLookupItem>(`/admin/staff-profile-lookups/${type}/${id}`, data).then((r) => r.data),

  deleteLookupItem: (type: 'skills' | 'languages' | 'specializations' | 'proficiency-levels' | 'certification-types', id: number) =>
    http.delete(`/admin/staff-profile-lookups/${type}/${id}`),
}

export const staffCertificationApi = {
  list: (staffId: number) =>
    http.get<import('../types').StaffCertification[]>(`/admin/staff-members/${staffId}/certifications`).then((r) => r.data),
  create: (staffId: number, data: import('../types').StaffCertificationWrite) =>
    http.post<import('../types').StaffCertification>(`/admin/staff-members/${staffId}/certifications`, data).then((r) => r.data),
  update: (staffId: number, certId: number, data: import('../types').StaffCertificationWrite) =>
    http.put<import('../types').StaffCertification>(`/admin/staff-members/${staffId}/certifications/${certId}`, data).then((r) => r.data),
  delete: (staffId: number, certId: number) =>
    http.delete(`/admin/staff-members/${staffId}/certifications/${certId}`),
}

export const facilityCertificationApi = {
  listRequirements: (facilityId: number) =>
    http.get<import('../types').FacilityCertificationRequirement[]>(`/admin/facilities/${facilityId}/certification-requirements`).then((r) => r.data),
  createRequirement: (facilityId: number, data: import('../types').FacilityCertificationRequirementWrite) =>
    http.post<import('../types').FacilityCertificationRequirement>(`/admin/facilities/${facilityId}/certification-requirements`, data).then((r) => r.data),
  updateRequirement: (facilityId: number, reqId: number, data: import('../types').FacilityCertificationRequirementWrite) =>
    http.put<import('../types').FacilityCertificationRequirement>(`/admin/facilities/${facilityId}/certification-requirements/${reqId}`, data).then((r) => r.data),
  deleteRequirement: (facilityId: number, reqId: number) =>
    http.delete(`/admin/facilities/${facilityId}/certification-requirements/${reqId}`),
  compliance: (facilityId: number) =>
    http.get<import('../types').FacilityCertificationCompliance>(`/admin/facilities/${facilityId}/certification-compliance`).then((r) => r.data),
}

export const staffHRDashboardApi = {
  get: (params?: { facility_id?: number }) =>
    http.get<import('../types').StaffHRDashboard>('/admin/staff-hr-dashboard', { params }).then((r) => r.data),
}

export const adminStaffQualificationApi = {
  list: (params?: { is_active?: boolean }) =>
    http.get<StaffQualification[]>('/admin/staff-qualifications', { params }).then((r) => r.data),

  get: (id: number) =>
    http.get<StaffQualification>(`/admin/staff-qualifications/${id}`).then((r) => r.data),

  create: (data: Omit<StaffQualification, 'id'>) =>
    http.post<StaffQualification>('/admin/staff-qualifications', data).then((r) => r.data),

  update: (id: number, data: Partial<Omit<StaffQualification, 'id'>>) =>
    http.put<StaffQualification>(`/admin/staff-qualifications/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/staff-qualifications/${id}`),
}

export const adminStaffStatusApi = {
  list: (params?: { is_active?: boolean }) =>
    http.get<StaffStatus[]>('/admin/staff-statuses', { params }).then((r) => r.data),

  get: (id: number) =>
    http.get<StaffStatus>(`/admin/staff-statuses/${id}`).then((r) => r.data),

  create: (data: Omit<StaffStatus, 'id'>) =>
    http.post<StaffStatus>('/admin/staff-statuses', data).then((r) => r.data),

  update: (id: number, data: Partial<Omit<StaffStatus, 'id'>>) =>
    http.put<StaffStatus>(`/admin/staff-statuses/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/staff-statuses/${id}`),
}

// ─── Admin — Stati struttura ──────────────────────────────────────────────────────────────────

export const adminFacilityStatusApi = {
  list: (params?: { is_active?: boolean }) =>
    http.get<FacilityStatus[]>('/admin/facility-statuses', { params }).then((r) => r.data),

  get: (id: number) =>
    http.get<FacilityStatus>(`/admin/facility-statuses/${id}`).then((r) => r.data),

  create: (data: Omit<FacilityStatus, 'id'>) =>
    http.post<FacilityStatus>('/admin/facility-statuses', data).then((r) => r.data),

  update: (id: number, data: Partial<Omit<FacilityStatus, 'id'>>) =>
    http.put<FacilityStatus>(`/admin/facility-statuses/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/facility-statuses/${id}`),
}

// ─── Admin — Stati documenti staff ───────────────────────────────────────────

export const adminStaffDocumentStatusApi = {
  list: (params?: { is_active?: boolean }) =>
    http.get<StaffDocumentStatus[]>('/admin/staff-document-statuses', { params }).then((r) => r.data),

  get: (id: number) =>
    http.get<StaffDocumentStatus>(`/admin/staff-document-statuses/${id}`).then((r) => r.data),

  create: (data: Omit<StaffDocumentStatus, 'id'>) =>
    http.post<StaffDocumentStatus>('/admin/staff-document-statuses', data).then((r) => r.data),

  update: (id: number, data: Partial<Omit<StaffDocumentStatus, 'id'>>) =>
    http.put<StaffDocumentStatus>(`/admin/staff-document-statuses/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/staff-document-statuses/${id}`),
}

// ─── Admin — Enti rilascio documenti ─────────────────────────────────────────

export const adminDocumentIssuerApi = {
  list: (params?: { is_active?: boolean }) =>
    http.get<DocumentIssuer[]>('/admin/document-issuers', { params }).then((r) => r.data),

  get: (id: number) =>
    http.get<DocumentIssuer>(`/admin/document-issuers/${id}`).then((r) => r.data),

  create: (data: Omit<DocumentIssuer, 'id'>) =>
    http.post<DocumentIssuer>('/admin/document-issuers', data).then((r) => r.data),

  update: (id: number, data: Partial<Omit<DocumentIssuer, 'id'>>) =>
    http.put<DocumentIssuer>(`/admin/document-issuers/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/document-issuers/${id}`),
}


export const adminActivityTypeApi = {
  list: () =>
    http.get<ActivityType[]>('/admin/activity-types').then((r) => r.data),
  get: (id: number) =>
    http.get<ActivityType>(`/admin/activity-types/${id}`).then((r) => r.data),
  create: (data: ActivityTypeWrite) =>
    http.post<ActivityType>('/admin/activity-types', data).then((r) => r.data),
  update: (id: number, data: ActivityTypeWrite) =>
    http.put<ActivityType>(`/admin/activity-types/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    http.delete(`/admin/activity-types/${id}`),
}

export const activityApi = {
  list: (params?: { facility_id?: number; minor_id?: number; activity_type_id?: number; status?: ActivityStatus; attendance_status?: string; support_level?: string; follow_up_required?: string }) =>
    http.get<Activity[]>('/activities', { params }).then((r) => r.data),
  get: (id: number) =>
    http.get<Activity>(`/activities/${id}`).then((r) => r.data),
  create: (data: ActivityWrite) =>
    http.post<Activity>('/activities', data).then((r) => r.data),
  update: (id: number, data: ActivityWrite) =>
    http.put<Activity>(`/activities/${id}`, data).then((r) => r.data),
  patch: (id: number, data: Partial<ActivityWrite>) =>
    http.patch<Activity>(`/activities/${id}`, data).then((r) => r.data),
  delete: (id: number) =>
    http.delete(`/activities/${id}`),
}

// ─── Admin — Assegnazioni ──────────────────────────────────────────────────────────────────────────

export const assignmentApi = {
  list: (params?: { facility_id?: number; is_active?: boolean }) =>
    http.get<Assignment[]>('/admin/user-facility-roles', { params }).then((r) => r.data),

  get: (id: number) =>
    http.get<Assignment>(`/admin/user-facility-roles/${id}`).then((r) => r.data),

  create: (data: AssignmentWrite) =>
    http.post<Assignment>('/admin/user-facility-roles', data).then((r) => r.data),

  update: (id: number, data: AssignmentWrite) =>
    http.put<Assignment>(`/admin/user-facility-roles/${id}`, data).then((r) => r.data),

  revoke: (id: number, valid_to?: string | null) =>
    http.patch<AssignmentRevokeResponse>(`/admin/user-facility-roles/${id}/revoke`, { valid_to: valid_to || null }).then((r) => r.data),
}

// ─── Admin — Assegnazioni per-minore ─────────────────────────────────────────────────

export const minorAssignmentApi = {
  list: (params?: { facility_id?: number; minor_id?: number; user_id?: number; assignment_role_code?: string; is_active?: boolean }) =>
    http.get<MinorAssignment[]>('/admin/minor-assignments', { params }).then((r) => r.data),

  get: (id: number) =>
    http.get<MinorAssignment>(`/admin/minor-assignments/${id}`).then((r) => r.data),

  create: (data: MinorAssignmentWrite) =>
    http.post<MinorAssignment>('/admin/minor-assignments', data).then((r) => r.data),

  update: (id: number, data: MinorAssignmentWrite) =>
    http.put<MinorAssignment>(`/admin/minor-assignments/${id}`, data).then((r) => r.data),

  revoke: (id: number, valid_to?: string | null) =>
    http.patch<MinorAssignmentRevokeResponse>(`/admin/minor-assignments/${id}/revoke`, { valid_to: valid_to || null }).then((r) => r.data),

  // endpoint aggregati — con fallback su minor-assignments filtrato se il backend non ha ancora i dedicati
  assignedUsers: async (minorId: number): Promise<MinorAssignment[]> => {
    try {
      const r = await http.get<MinorAssignedUsersResponse>(`/admin/minors/${minorId}/assigned-users`)
      return Array.isArray(r.data?.assignments) ? r.data.assignments : []
    } catch (e) {
      if ((e as { response?: { status?: number } })?.response?.status === 404) {
        const r = await http.get<MinorAssignment[]>('/admin/minor-assignments', { params: { minor_id: minorId } })
        return r.data
      }
      throw e
    }
  },

  assignedMinors: async (userId: number): Promise<MinorAssignment[]> => {
    try {
      const r = await http.get<UserAssignedMinorsResponse>(`/admin/users/${userId}/assigned-minors`)
      return Array.isArray(r.data?.assignments) ? r.data.assignments : []
    } catch (e) {
      if ((e as { response?: { status?: number } })?.response?.status === 404) {
        const r = await http.get<MinorAssignment[]>('/admin/minor-assignments', { params: { user_id: userId } })
        return r.data
      }
      throw e
    }
  },

  bulkSyncFromMinor: async (minorId: number, data: MinorAssignmentBulkSyncFromMinor): Promise<{ message: string; assignments: MinorAssignment[] }> => {
    try {
      const r = await http.post<{ message: string; assignments: MinorAssignment[] }>(
        `/admin/minors/${minorId}/user-assignments/bulk-sync`, data
      )
      return r.data
    } catch (e) {
      if ((e as { response?: { status?: number } })?.response?.status === 404) {
        // Fallback: crea/aggiorna assegnazioni singole
        const existing = await http.get<MinorAssignment[]>('/admin/minor-assignments', { params: { minor_id: minorId } })
        const existingArr: MinorAssignment[] = Array.isArray(existing.data) ? existing.data : []
        const results: MinorAssignment[] = []
        for (const userId of data.user_ids) {
          const found = existingArr.find((a) => a.user_id === userId)
          if (found) {
            const r = await http.put<MinorAssignment>(`/admin/minor-assignments/${found.id}`, {
              facility_id: found.facility_id, minor_id: minorId, user_id: userId,
              valid_from: data.valid_from, valid_to: data.valid_to ?? null,
              is_active: data.is_active ?? true, notes: data.notes ?? null,
            })
            results.push(r.data)
          } else {
            const r = await http.post<MinorAssignment>('/admin/minor-assignments', {
              facility_id: 0, minor_id: minorId, user_id: userId,
              valid_from: data.valid_from, valid_to: data.valid_to ?? null,
              is_active: data.is_active ?? true, notes: data.notes ?? null,
            })
            results.push(r.data)
          }
        }
        return { message: 'ok', assignments: results }
      }
      throw e
    }
  },

  bulkSyncFromUser: async (userId: number, data: MinorAssignmentBulkSyncFromUser): Promise<{ message: string; assignments: MinorAssignment[] }> => {
    try {
      const r = await http.post<{ message: string; assignments: MinorAssignment[] }>(
        `/admin/users/${userId}/minor-assignments/bulk-sync`, data
      )
      return r.data
    } catch (e) {
      if ((e as { response?: { status?: number } })?.response?.status === 404) {
        // Fallback: crea/aggiorna assegnazioni singole
        const existing = await http.get<MinorAssignment[]>('/admin/minor-assignments', { params: { user_id: userId, facility_id: data.facility_id } })
        const existingArr: MinorAssignment[] = Array.isArray(existing.data) ? existing.data : []
        const results: MinorAssignment[] = []
        for (const minorId of data.minor_ids) {
          const found = existingArr.find((a) => a.minor_id === minorId)
          if (found) {
            const r = await http.put<MinorAssignment>(`/admin/minor-assignments/${found.id}`, {
              facility_id: data.facility_id, minor_id: minorId, user_id: userId,
              valid_from: data.valid_from, valid_to: data.valid_to ?? null,
              is_active: data.is_active ?? true, notes: data.notes ?? null,
            })
            results.push(r.data)
          } else {
            const r = await http.post<MinorAssignment>('/admin/minor-assignments', {
              facility_id: data.facility_id, minor_id: minorId, user_id: userId,
              valid_from: data.valid_from, valid_to: data.valid_to ?? null,
              is_active: data.is_active ?? true, notes: data.notes ?? null,
            })
            results.push(r.data)
          }
        }
        return { message: 'ok', assignments: results }
      }
      throw e
    }
  },
}

// ─── Admin — Geografia ────────────────────────────────────────────────────────────────────────────

// Helper: normalizza risposta array o paginata Laravel { data: [...] }
function unwrapList<T>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[]
  if (d && typeof d === 'object' && Array.isArray((d as Record<string, unknown>).data)) return (d as { data: T[] }).data
  return []
}

export const adminCountryApi = {
  list: () => http.get<unknown>('/admin/countries').then((r) => unwrapList<Country>(r.data)),
  create: (data: CountryWrite) => http.post<Country>('/admin/countries', data).then((r) => r.data),
  update: (id: number, data: CountryWrite) => http.put<Country>(`/admin/countries/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/admin/countries/${id}`),
}

export const adminRegionApi = {
  list: (countryId?: number) =>
    http.get<unknown>('/admin/regions', { params: countryId ? { country_id: countryId } : undefined }).then((r) => unwrapList<Region>(r.data)),
  create: (data: RegionWrite) => http.post<Region>('/admin/regions', data).then((r) => r.data),
  update: (id: number, data: RegionWrite) => http.put<Region>(`/admin/regions/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/admin/regions/${id}`),
}

export const adminProvinceApi = {
  list: (regionId?: number) =>
    http.get<unknown>('/admin/provinces', { params: regionId ? { region_id: regionId } : undefined }).then((r) => unwrapList<Province>(r.data)),
  create: (data: ProvinceWrite) => http.post<Province>('/admin/provinces', data).then((r) => r.data),
  update: (id: number, data: ProvinceWrite) => http.put<Province>(`/admin/provinces/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/admin/provinces/${id}`),
}

export const adminCityApi = {
  list: (provinceId: number) =>
    http.get<unknown>('/admin/cities', { params: { province_id: provinceId } }).then((r) => unwrapList<City>(r.data)),
  get: (id: number) =>
    http.get<City>(`/admin/cities/${id}`).then((r) => r.data),
  create: (data: CityWrite) => http.post<City>('/admin/cities', data).then((r) => r.data),
  update: (id: number, data: CityWrite) => http.put<City>(`/admin/cities/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/admin/cities/${id}`),
}

// ─── Admin — Tipi documento ─────────────────────────────────────────────────────────────────────────

export const adminDocTypeApi = {
  list: () =>
    http.get<DocumentTypeItem[]>('/admin/document-types').then((r) => r.data),

  get: (id: number) =>
    http.get<DocumentTypeItem>(`/admin/document-types/${id}`).then((r) => r.data),

  create: (data: DocumentTypeWrite) =>
    http.post<DocumentTypeItem>('/admin/document-types', data).then((r) => r.data),

  update: (id: number, data: DocumentTypeWrite) =>
    http.put<DocumentTypeItem>(`/admin/document-types/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/document-types/${id}`),
}

export const adminDocScopeApi = {
  list: () =>
    http.get<DocumentScopeItem[]>('/admin/document-scopes').then((r) => r.data),

  get: (id: number) =>
    http.get<DocumentScopeItem>(`/admin/document-scopes/${id}`).then((r) => r.data),

  create: (data: DocumentScopeWrite) =>
    http.post<DocumentScopeItem>('/admin/document-scopes', data).then((r) => r.data),

  update: (id: number, data: DocumentScopeWrite) =>
    http.put<DocumentScopeItem>(`/admin/document-scopes/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/document-scopes/${id}`),
}

export const adminDocClassificationApi = {
  list: () =>
    http.get<DocumentClassification[]>('/admin/document-classifications').then((r) => r.data),

  get: (id: number) =>
    http.get<DocumentClassification>(`/admin/document-classifications/${id}`).then((r) => r.data),

  create: (data: DocumentClassificationWrite) =>
    http.post<DocumentClassification>('/admin/document-classifications', data).then((r) => r.data),

  update: (id: number, data: DocumentClassificationWrite) =>
    http.put<DocumentClassification>(`/admin/document-classifications/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/document-classifications/${id}`),
}

// ─── Admin — Tipi contatto ──────────────────────────────────────────────────────────────────────────

export const adminContactTypeApi = {
  list: () =>
    http.get<LookupItem[]>('/admin/contact-types').then((r) => r.data),

  get: (id: number) =>
    http.get<LookupItem>(`/admin/contact-types/${id}`).then((r) => r.data),

  create: (data: LookupItemWrite) =>
    http.post<LookupItem>('/admin/contact-types', data).then((r) => r.data),

  update: (id: number, data: LookupItemWrite) =>
    http.put<LookupItem>(`/admin/contact-types/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/contact-types/${id}`),
}

// ─── Admin — Stati minore ─────────────────────────────────────────────────────────────────────────────

export const adminMinorStatusApi = {
  list: () =>
    http.get<OrderedLookupItem[]>('/admin/minor-statuses').then((r) => r.data),

  get: (id: number) =>
    http.get<OrderedLookupItem>(`/admin/minor-statuses/${id}`).then((r) => r.data),

  create: (data: OrderedLookupItemWrite) =>
    http.post<OrderedLookupItem>('/admin/minor-statuses', data).then((r) => r.data),

  update: (id: number, data: OrderedLookupItemWrite) =>
    http.put<OrderedLookupItem>(`/admin/minor-statuses/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/minor-statuses/${id}`),
}

// ─── Admin — Generi ─────────────────────────────────────────────────────────────────────────────────

export const adminGenderApi = {
  list: () =>
    http.get<OrderedLookupItem[]>('/admin/gender-identities').then((r) => r.data),

  get: (id: number) =>
    http.get<OrderedLookupItem>(`/admin/gender-identities/${id}`).then((r) => r.data),

  create: (data: OrderedLookupItemWrite) =>
    http.post<OrderedLookupItem>('/admin/gender-identities', data).then((r) => r.data),

  update: (id: number, data: OrderedLookupItemWrite) =>
    http.put<OrderedLookupItem>(`/admin/gender-identities/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/gender-identities/${id}`),
}

// ─── Admin — Sesso biologico ──────────────────────────────────────────────────────────────────────────

export const adminBiologicalSexApi = {
  list: () =>
    http.get<OrderedLookupItem[]>('/admin/biological-sexes').then((r) => r.data),

  get: (id: number) =>
    http.get<OrderedLookupItem>(`/admin/biological-sexes/${id}`).then((r) => r.data),

  create: (data: OrderedLookupItemWrite) =>
    http.post<OrderedLookupItem>('/admin/biological-sexes', data).then((r) => r.data),

  update: (id: number, data: OrderedLookupItemWrite) =>
    http.put<OrderedLookupItem>(`/admin/biological-sexes/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/biological-sexes/${id}`),
}

export const adminExitTypeApi = {
  list: () =>
    http.get<OrderedLookupItem[]>('/admin/exit-types').then((r) => r.data),

  get: (id: number) =>
    http.get<OrderedLookupItem>(`/admin/exit-types/${id}`).then((r) => r.data),

  create: (data: OrderedLookupItemWrite) =>
    http.post<OrderedLookupItem>('/admin/exit-types', data).then((r) => r.data),

  update: (id: number, data: OrderedLookupItemWrite) =>
    http.put<OrderedLookupItem>(`/admin/exit-types/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/exit-types/${id}`),
}

// ─── Admin — Ruoli e permessi ─────────────────────────────────────────────────────────────────────────────

export const adminRoleApi = {
  list: () =>
    http.get<AdminRole[]>('/admin/roles').then((r) => r.data),

  get: (id: number) =>
    http.get<AdminRole>(`/admin/roles/${id}`).then((r) => r.data),

  create: (data: RoleWrite) =>
    http.post<AdminRole>('/admin/roles', data).then((r) => r.data),

  update: (id: number, data: RoleWrite) =>
    http.put<AdminRole>(`/admin/roles/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/roles/${id}`),

  getPermissions: (id: number) =>
    http.get<RolePermissionsMatrix>(`/admin/roles/${id}/permissions`).then((r) => r.data),

  updatePermissions: (id: number, data: RolePermissionsWrite) =>
    http.put<RolePermissionsMatrix>(`/admin/roles/${id}/permissions`, data).then((r) => r.data),

  getDocumentAccessMatrix: () =>
    http.get<DocumentAccessMatrix>('/admin/document-access-matrix').then((r) => r.data),

  getDocumentPolicy: (roleId: number) =>
    http.get<DocumentPolicy>(`/admin/roles/${roleId}/document-policy`).then((r) => r.data),

  updateDocumentPolicy: (roleId: number, data: DocumentPolicyWrite) =>
    http.put<DocumentPolicy>(`/admin/roles/${roleId}/document-policy`, data).then((r) => r.data),
}

// ─── Admin — Geography sync ────────────────────────────────────────────────────────────────────────────

export const adminGeoSyncApi = {
  latestRun: () =>
    http.get<{ data: SyncRun }>('/admin/geography-sync/runs/latest').then((r) => r.data.data),

  runs: () =>
    http.get<{ data: SyncRun[] }>('/admin/geography-sync/runs').then((r) => r.data.data),

  run: (id: number) =>
    http.get<{ data: SyncRun }>(`/admin/geography-sync/runs/${id}`).then((r) => r.data.data),

  issues: (runId: number) =>
    http.get<{ data: SyncIssue[] }>(`/admin/geography-sync/runs/${runId}/issues`).then((r) => r.data.data),

  decisions: (runId: number) =>
    http.get<{ data: SyncDecision[] }>(`/admin/geography-sync/runs/${runId}/decisions`).then((r) => r.data.data),

  startRun: (data: SyncRunRequest) =>
    http.post<{ message: string; data: SyncRun; exit_code: number }>('/admin/geography-sync/runs', data).then((r) => r.data),

  publish: (runId: number) =>
    http.post<{ message: string }>(`/admin/geography-sync/runs/${runId}/publish`).then((r) => r.data),
}

export const adminGeoLoadApi = {
  runs: () =>
    http.get<{ data: GeoLoadRunOption[] }>('/admin/geography-load/runs').then((r) => r.data.data),

  continents: (runId: number, source: string) =>
    http.get<{ data: GeoLoadContinentOption[] }>('/admin/geography-load/options/continents', { params: { run_id: runId, source } }).then((r) => r.data.data),

  countries: (runId: number, source: string, continentCode?: string | null) =>
    http.get<{ data: GeoLoadCountryOption[] }>('/admin/geography-load/options/countries', { params: { run_id: runId, source, continent_code: continentCode || undefined } }).then((r) => r.data.data),

  regions: (runId: number, source: string, countryKey: string) =>
    http.get<{ data: GeoLoadRegionOption[] }>('/admin/geography-load/options/regions', { params: { run_id: runId, source, country_key: countryKey } }).then((r) => r.data.data),

  provinces: (runId: number, source: string, regionKey: string) =>
    http.get<{ data: GeoLoadProvinceOption[] }>('/admin/geography-load/options/provinces', { params: { run_id: runId, source, region_key: regionKey } }).then((r) => r.data.data),

  cities: (runId: number, source: string, provinceKey: string) =>
    http.get<{ data: GeoLoadCityOption[] }>('/admin/geography-load/options/cities', { params: { run_id: runId, source, province_key: provinceKey } }).then((r) => r.data.data),

  execute: (data: GeoLoadExecuteRequest) =>
    http.post<{ message: string; data: GeoLoadExecuteResponse }>('/admin/geography-load/execute', data).then((r) => r.data),
}

// ─── Geography import on-demand (spec 021) ───────────────────────────────────────────

export const adminGeoImportApi = {
  import: (data: GeoImportRequest) =>
    http.post<GeoImportResponse>('/admin/geography-imports', data).then((r) => r.data),
}

// ─── Geography providers (spec 020) ──────────────────────────────────────────────────────────

export const adminGeoProvidersApi = {
  list: () =>
    http.get<GeoProvider[]>('/admin/geography-providers').then((r) => r.data),

  create: (data: GeoProviderWrite) =>
    http.post<GeoProvider>('/admin/geography-providers', data).then((r) => r.data),

  update: (id: number, data: GeoProviderWrite) =>
    http.put<GeoProvider>(`/admin/geography-providers/${id}`, data).then((r) => r.data),

  importCountries: (id: number) =>
    http.post<GeoProviderCountriesImportResponse>(`/admin/geography-providers/${id}/import-countries`).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/admin/geography-providers/${id}`),

  countryMappings: (countryId: number) =>
    http.get<{ country: Country; providers: CountryProviderMapping[] }>(`/admin/countries/${countryId}/geography-providers`).then((r) => r.data.providers),

  addMapping: (countryId: number, data: CountryProviderMappingWrite) =>
    http.post<{ country: Country; providers: CountryProviderMapping[] }>(`/admin/countries/${countryId}/geography-providers`, data).then((r) => r.data.providers[0] as CountryProviderMapping),

  updateMapping: (countryId: number, providerId: number, data: CountryProviderMappingWrite) =>
    http.put<{ country: Country; providers: CountryProviderMapping[] }>(`/admin/countries/${countryId}/geography-providers/${providerId}`, data).then((r) => r.data.providers.find((p) => p.provider_id === providerId) as CountryProviderMapping),

  deleteMapping: (countryId: number, providerId: number) =>
    http.delete(`/admin/countries/${countryId}/geography-providers/${providerId}`),
}

// ─── Minori ──────────────────────────────────────────────────────────────────────────────

export const minorApi = {
  list: () =>
    http.get<Minor[]>('/minors').then((r) => r.data),

  get: (id: number) =>
    http.get<Minor>(`/minors/${id}`).then((r) => r.data),

  create: (data: MinorWrite) =>
    http.post<Minor>('/minors', data).then((r) => r.data),

  update: (id: number, data: Partial<MinorWrite>) =>
    http.patch<Minor>(`/minors/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/minors/${id}`),

  // Profilo psico-educativo
  getProfile: (id: number) =>
    http.get<MinorProfile>(`/minors/${id}/profile`).then((r) => r.data),

  upsertProfile: (id: number, data: MinorProfile) =>
    http.put<MinorProfile>(`/minors/${id}/profile`, data).then((r) => r.data),

  // Contatti
  createContact: (id: number, data: MinorContactWrite) =>
    http.post<MinorContact>(`/minors/${id}/contacts`, data).then((r) => r.data),

  updateContact: (id: number, contactId: number, data: Partial<MinorContactWrite>) =>
    http.put<MinorContact>(`/minors/${id}/contacts/${contactId}`, data).then((r) => r.data),

  // Documenti
  uploadDocument: (id: number, formData: FormData) =>
    http.post<MinorDocument>(`/minors/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  listDocuments: (id: number) =>
    http.get<MinorDocument[]>(`/minors/${id}/documents`).then((r) => r.data),

  deleteDocument: (id: number, documentId: number) =>
    http.delete(`/minors/${id}/documents/${documentId}`),

  downloadDocument: (id: number, documentId: number) =>
    http.get(`/minors/${id}/documents/${documentId}/download`, { responseType: 'blob' }),

  previewDocument: (minorId: number, documentId: number) =>
    http.get(`/minors/${minorId}/documents/${documentId}/preview`, { responseType: 'blob' }).then((r) => r.data as Blob),

  previewDocumentStructured: (minorId: number, documentId: number) =>
    http.get<import('../types').SpreadsheetPreviewPayload>(`/minors/${minorId}/documents/${documentId}/preview-structured`).then((r) => r.data),

  // Contatti — lista (GET /minors/{id}/contacts non esiste: i contatti sono embedded in GET /minors/{id})
  listContacts: (id: number) =>
    http.get<Minor>(`/minors/${id}`).then((r) => r.data.contacts ?? []),

  deleteContact: (id: number, contactId: number) =>
    http.delete(`/minors/${id}/contacts/${contactId}`),

  // Storico
  history: (id: number) =>
    http.get<MinorHistoryEntry[]>(`/minors/${id}/history`).then((r) => r.data),

  // Scheda caso legale e sanitaria
  getCaseDetails: (id: number) =>
    http.get<import('../types').MinorCaseDetail>(`/minors/${id}/case-details`).then((r) => r.data),

  upsertCaseDetails: (id: number, data: import('../types').MinorCaseDetail) =>
    http.put<import('../types').MinorCaseDetail>(`/minors/${id}/case-details`, data).then((r) => r.data),

  getCaseOptions: (id: number) =>
    http.get<import('../types').MinorCaseOptions>(`/minors/${id}/case-options`).then((r) => r.data),

  // Diagnosi
  listDiagnoses: (id: number) =>
    http.get<import('../types').MinorDiagnosis[]>(`/minors/${id}/diagnoses`).then((r) => r.data),
  createDiagnosis: (id: number, data: import('../types').MinorDiagnosisWrite) =>
    http.post<import('../types').MinorDiagnosis>(`/minors/${id}/diagnoses`, data).then((r) => r.data),
  updateDiagnosis: (id: number, diagId: number, data: import('../types').MinorDiagnosisWrite) =>
    http.put<import('../types').MinorDiagnosis>(`/minors/${id}/diagnoses/${diagId}`, data).then((r) => r.data),
  deleteDiagnosis: (id: number, diagId: number) =>
    http.delete(`/minors/${id}/diagnoses/${diagId}`),

  // PEI
  listPeis: (id: number) =>
    http.get<import('../types').MinorPei[]>(`/minors/${id}/peis`).then((r) => r.data),
  createPei: (id: number, data: import('../types').MinorPeiWrite) =>
    http.post<import('../types').MinorPei>(`/minors/${id}/peis`, data).then((r) => r.data),
  updatePei: (id: number, peiId: number, data: import('../types').MinorPeiWrite) =>
    http.put<import('../types').MinorPei>(`/minors/${id}/peis/${peiId}`, data).then((r) => r.data),

  // Obiettivi PEI
  createPeiObjective: (id: number, peiId: number, data: import('../types').PeiObjectiveWrite) =>
    http.post<import('../types').PeiObjective>(`/minors/${id}/peis/${peiId}/objectives`, data).then((r) => r.data),
  updatePeiObjective: (id: number, peiId: number, objId: number, data: import('../types').PeiObjectiveWrite) =>
    http.put<import('../types').PeiObjective>(`/minors/${id}/peis/${peiId}/objectives/${objId}`, data).then((r) => r.data),
  deletePeiObjective: (id: number, peiId: number, objId: number) =>
    http.delete(`/minors/${id}/peis/${peiId}/objectives/${objId}`),

  // PEI storico e avanzamento obiettivi
  getPeiHistory: (id: number, peiId: number) =>
    http.get<import('../types').MinorPeiHistoryEntry[]>(`/minors/${id}/peis/${peiId}/history`).then((r) => r.data),
  getObjectiveProgress: (id: number, peiId: number, objId: number) =>
    http.get<import('../types').MinorPeiObjectiveProgressEntry[]>(`/minors/${id}/peis/${peiId}/objectives/${objId}/progress`).then((r) => r.data),

  // Bisogni
  listNeeds: (id: number) =>
    http.get<import('../types').MinorNeed[]>(`/minors/${id}/needs`).then((r) => r.data),
  createNeed: (id: number, data: import('../types').MinorNeedWrite) =>
    http.post<import('../types').MinorNeed>(`/minors/${id}/needs`, data).then((r) => r.data),
  updateNeed: (id: number, needId: number, data: import('../types').MinorNeedWrite) =>
    http.put<import('../types').MinorNeed>(`/minors/${id}/needs/${needId}`, data).then((r) => r.data),
  deleteNeed: (id: number, needId: number) =>
    http.delete(`/minors/${id}/needs/${needId}`),

  // Note classificate
  listNotes: (id: number) =>
    http.get<import('../types').MinorNote[]>(`/minors/${id}/notes`).then((r) => r.data),
  createNote: (id: number, data: import('../types').MinorNoteWrite) =>
    http.post<import('../types').MinorNote>(`/minors/${id}/notes`, data).then((r) => r.data),
  updateNote: (id: number, noteId: number, data: import('../types').MinorNoteWrite) =>
    http.put<import('../types').MinorNote>(`/minors/${id}/notes/${noteId}`, data).then((r) => r.data),
  deleteNote: (id: number, noteId: number) =>
    http.delete(`/minors/${id}/notes/${noteId}`),
}

export const minorExitApi = {
  list: (params?: { facility_id?: number; minor_id?: number; status?: string; exit_type_id?: number; follow_up_required?: string; return_condition?: string }) =>
    http.get<MinorExit[]>('/exits', { params }).then((r) => r.data),

  summary: (params?: { facility_id?: number; minor_id?: number }) =>
    http.get<{ summary: ExitSummary }>('/exits/summary', { params }).then((r) => r.data),

  get: (id: number) =>
    http.get<MinorExit>(`/exits/${id}`).then((r) => r.data),

  create: (data: MinorExitWrite) =>
    http.post<MinorExit>('/exits', data).then((r) => r.data),

  update: (id: number, data: MinorExitUpdate) =>
    http.patch<MinorExit>(`/exits/${id}`, data).then((r) => r.data),

  markOut: (id: number, data?: MinorExitTransition) =>
    http.post<MinorExit>(`/exits/${id}/mark-out`, data ?? {}).then((r) => r.data),

  markReturned: (id: number, data?: MinorExitTransition) =>
    http.post<MinorExit>(`/exits/${id}/mark-returned`, data ?? {}).then((r) => r.data),

  cancel: (id: number, data?: MinorExitTransition) =>
    http.post<MinorExit>(`/exits/${id}/cancel`, data ?? {}).then((r) => r.data),

  delete: (id: number) =>
    http.delete(`/exits/${id}`),

  getAccompanierOptions: (minorId: number) =>
    http.get<ExitAccompanierOptions>('/exits/options/accompaniers', { params: { minor_id: minorId } }).then((r) => r.data),
}

// ── Admin — Audit ─────────────────────────────────────────────────────────────
export const adminAuditApi = {
  list: (params?: {
    q?: string
    facility_id?: number
    minor_id?: number
    actor_user_id?: number
    action?: string
    resource_type?: string
    resource_id?: number
    date_from?: string
    date_to?: string
    per_page?: number
    page?: number
  }) =>
    http.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params }).then((r) => r.data),

  filters: () =>
    http.get<AuditLogFilters>('/admin/audit-logs/filters').then((r) => r.data),

  get: (id: number) =>
    http.get<AuditLog>(`/admin/audit-logs/${id}`).then((r) => r.data),

  exportCsv: (params?: {
    q?: string
    facility_id?: number
    minor_id?: number
    actor_user_id?: number
    action?: string
    'actions[]'?: string[]
    resource_type?: string
    'resource_types[]'?: string[]
    date_from?: string
    date_to?: string
  }) =>
    http.get('/admin/audit-logs/export.csv', { params, responseType: 'blob' }).then((r) => r.data as Blob),

  kpis: () =>
    http.get<AuditKpi>('/admin/audit-logs/kpis').then((r) => r.data),
}

// ─── Alias retrocompatibile ───────────────────────────────────────────────────
// ── Admin: tipi avvicinamento ─────────────────────────────────────────────────
export const adminApproachTypeApi = {
  list: () => http.get<ApproachType[]>('/admin/approach-types').then((r) => r.data),
  get: (id: number) => http.get<ApproachType>(`/admin/approach-types/${id}`).then((r) => r.data),
  create: (data: Omit<ApproachType, 'id'>) => http.post<ApproachType>('/admin/approach-types', data).then((r) => r.data),
  update: (id: number, data: Omit<ApproachType, 'id'>) => http.put<ApproachType>(`/admin/approach-types/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/admin/approach-types/${id}`),
}

// ── Admin: tipi diario ────────────────────────────────────────────────────────
export const adminJournalEntryTypeApi = {
  list: () => http.get<JournalEntryType[]>('/admin/journal-entry-types').then((r) => r.data),
  get: (id: number) => http.get<JournalEntryType>(`/admin/journal-entry-types/${id}`).then((r) => r.data),
  create: (data: Omit<JournalEntryType, 'id'>) => http.post<JournalEntryType>('/admin/journal-entry-types', data).then((r) => r.data),
  update: (id: number, data: Omit<JournalEntryType, 'id'>) => http.put<JournalEntryType>(`/admin/journal-entry-types/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/admin/journal-entry-types/${id}`),
}

// ── Avvicinamenti operativi ───────────────────────────────────────────────────
export const approachApi = {
  list: (params?: { facility_id?: number; minor_id?: number; approach_type_id?: number; minor_contact_id?: number; status?: string }) =>
    http.get<Approach[]>('/approaches', { params }).then((r) => r.data),
  get: (id: number) => http.get<Approach>(`/approaches/${id}`).then((r) => r.data),
  create: (data: ApproachWrite) => http.post<Approach>('/approaches', data).then((r) => r.data),
  update: (id: number, data: ApproachWrite) => http.put<Approach>(`/approaches/${id}`, data).then((r) => r.data),
  patch: (id: number, data: Partial<ApproachWrite>) => http.patch<Approach>(`/approaches/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/approaches/${id}`),
  trend: (params?: { facility_id?: number; minor_id?: number; date_from?: string; date_to?: string }) =>
    http.get<ApproachTrend>('/approaches/trend', { params }).then((r) => r.data),
  renewAuthorization: (id: number, data: {
    authorization_reference?: string | null
    authorization_minor_document_id?: number | null
    authorization_issued_at?: string | null
    authorization_expires_at: string
    authorization_renewal_alert_days?: number | null
  }) =>
    http.post<Approach>(`/approaches/${id}/renew-authorization`, data).then((r) => r.data),
  signSuspension: (id: number, data?: { suspension_reason?: string; suspended_at?: string }) =>
    http.post<Approach>(`/approaches/${id}/sign-suspension`, data ?? {}).then((r) => r.data),
}

// ── Diario educativo ──────────────────────────────────────────────────────────
export const journalApi = {
  list: (params?: { facility_id?: number; minor_id?: number; journal_entry_type_id?: number; priority_level?: string; mood_level?: string; handover_required?: boolean; handover_pending?: boolean; minor_journal_shift_id?: number; search?: string; date_from?: string; date_to?: string }) =>
    http.get<JournalEntry[]>('/journals', { params }).then((r) => r.data),
  get: (id: number) => http.get<JournalEntry>(`/journals/${id}`).then((r) => r.data),
  create: (data: JournalEntryWrite) => http.post<JournalEntry>('/journals', data).then((r) => r.data),
  update: (id: number, data: JournalEntryWrite) => http.put<JournalEntry>(`/journals/${id}`, data).then((r) => r.data),
  patch: (id: number, data: Partial<JournalEntryWrite>) => http.patch<JournalEntry>(`/journals/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/journals/${id}`),
  summary: (params?: { facility_id?: number; minor_id?: number }) =>
    http.get<JournalSummary>('/journals/summary', { params }).then((r) => r.data),
  // Turni diario (handoff 180)
  listShifts: (params?: { facility_id?: number; status?: 'open' | 'closed'; date_from?: string; date_to?: string }) =>
    http.get<JournalShift[]>('/journals/shifts', { params }).then((r) => r.data),
  openShift: (data: JournalShiftWrite) =>
    http.post<JournalShift>('/journals/shifts', data).then((r) => r.data),
  closeShift: (shiftId: number, data: JournalShiftClosePayload) =>
    http.post<JournalShiftCloseResponse>(`/journals/shifts/${shiftId}/close`, data).then((r) => r.data),
  acknowledgeHandover: (journalId: number) =>
    http.post<JournalEntry>(`/journals/${journalId}/acknowledge-handover`).then((r) => r.data),
}

// ── Messaggistica interna ─────────────────────────────────────────────────────
export const internalMessageApi = {
  participantOptions: (params: { facility_id: number; minor_id?: number; classification_code?: string }) =>
    http.get<MessageParticipantOptionsResponse>('/internal-messages/options/participants', { params }).then((r) => r.data.users),

  listThreads: (params?: { facility_id?: number; minor_id?: number; thread_type?: string; topic?: string; classification_code?: string; archived?: boolean }) =>
    http.get<InternalMessageThread[]>('/internal-messages/threads', { params }).then((r) => r.data),

  createThread: (data: InternalMessageThreadWrite) =>
    http.post<InternalMessageThread>('/internal-messages/threads', data).then((r) => r.data),

  getThread: (threadId: number) =>
    http.get<InternalMessageThread>(`/internal-messages/threads/${threadId}`).then((r) => r.data),

  sendMessage: (threadId: number, body: string) =>
    http.post<InternalMessage>(`/internal-messages/threads/${threadId}/messages`, { body }).then((r) => r.data),

  markRead: (threadId: number) =>
    http.post(`/internal-messages/threads/${threadId}/mark-read`).then((r) => r.data),

  archiveThread: (threadId: number) =>
    http.post(`/internal-messages/threads/${threadId}/archive`).then((r) => r.data),
}

// Alcune pagine importano adminGeoApi.countries() — corrisponde ad adminCountryApi.list()
export const adminGeoApi = {
  countries: () => adminCountryApi.list(),
  createCountry: (data: CountryWrite) => adminCountryApi.create(data),
  updateCountry: (id: number, data: CountryWrite) => adminCountryApi.update(id, data),
  deleteCountry: (id: number) => adminCountryApi.delete(id),
  regions: (countryId?: number) => adminRegionApi.list(countryId),
  createRegion: (data: RegionWrite) => adminRegionApi.create(data),
  updateRegion: (id: number, data: RegionWrite) => adminRegionApi.update(id, data),
  deleteRegion: (id: number) => adminRegionApi.delete(id),

  provinces: (regionId?: number) => adminProvinceApi.list(regionId),
  createProvince: (data: ProvinceWrite) => adminProvinceApi.create(data),
  updateProvince: (id: number, data: ProvinceWrite) => adminProvinceApi.update(id, data),
  deleteProvince: (id: number) => adminProvinceApi.delete(id),

  cities: (provinceId: number) => adminCityApi.list(provinceId),
  createCity: (data: CityWrite) => adminCityApi.create(data),
  updateCity: (id: number, data: CityWrite) => adminCityApi.update(id, data),
  deleteCity: (id: number) => adminCityApi.delete(id),
}

// Turni H24

export const shiftTemplatesApi = {
  list: (params?: { facility_id?: number; is_active?: boolean }) =>
    http.get<StaffShiftTemplate[]>('/admin/staff-shift-templates', { params }).then((r) => r.data),
  get: (id: number) =>
    http.get<StaffShiftTemplate>(`/admin/staff-shift-templates/${id}`).then((r) => r.data),
  create: (data: StaffShiftTemplateWrite) =>
    http.post<StaffShiftTemplate>('/admin/staff-shift-templates', data).then((r) => r.data),
  update: (id: number, data: StaffShiftTemplateWrite) =>
    http.put<StaffShiftTemplate>(`/admin/staff-shift-templates/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/admin/staff-shift-templates/${id}`),
}

export const shiftAssignmentsApi = {
  list: (params?: { facility_id?: number; staff_member_id?: number; date_from?: string; date_to?: string; status?: string }) =>
    http.get<StaffShiftAssignment[]>('/admin/staff-shifts', { params }).then((r) => r.data),
  get: (id: number) =>
    http.get<StaffShiftAssignment>(`/admin/staff-shifts/${id}`).then((r) => r.data),
  create: (data: StaffShiftAssignmentWrite) =>
    http.post<StaffShiftAssignment>('/admin/staff-shifts', data).then((r) => r.data),
  update: (id: number, data: Partial<StaffShiftAssignmentWrite>) =>
    http.put<StaffShiftAssignment>(`/admin/staff-shifts/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/admin/staff-shifts/${id}`),
  weekView: (params: { facility_id: number; week_start: string }) =>
    http.get<StaffShiftWeekView>('/admin/staff-shifts/week', { params }).then((r) => r.data),
  monthView: (params: { facility_id: number; year: number; month: number; staff_member_id?: number }) =>
    http.get<StaffShiftMonthView>('/admin/staff-shifts/month', { params }).then((r) => r.data),
  exceptions: (params: { facility_id: number; date_from?: string; date_to?: string; types?: string[] }) =>
    http.get<ShiftExceptionsResponse>('/admin/staff-shifts/exceptions', { params }).then((r) => r.data),
  myWeek: (params?: { week_start?: string }) =>
    http.get<StaffShiftMyWeek>('/staff-shifts/my-week', { params }).then((r) => r.data),
  myMonth: (params: { year: number; month: number }) =>
    http.get<StaffShiftMyMonth>('/staff-shifts/my-month', { params }).then((r) => r.data),
  submitMyShift: (shiftAssignmentId: number, data?: { notes?: string }) =>
    http.post<ShiftSubmitResponse>(`/staff-shifts/${shiftAssignmentId}/submit`, data ?? {}).then((r) => r.data),
  substitutions: (shiftAssignmentId: number) =>
    http.get<StaffShiftSubstitution[]>(`/admin/staff-shifts/${shiftAssignmentId}/substitutions`).then((r) => r.data),
  createSubstitution: (shiftAssignmentId: number, data: StaffShiftSubstitutionWrite) =>
    http.post<StaffShiftSubstitution>(`/admin/staff-shifts/${shiftAssignmentId}/substitutions`, data).then((r) => r.data),
  cancelSubstitution: (shiftAssignmentId: number, substitutionId: number) =>
    http.post<StaffShiftSubstitution>(`/admin/staff-shifts/${shiftAssignmentId}/substitutions/${substitutionId}/cancel`).then((r) => r.data),
}

function normalizeAttendanceEvent(event: any): AttendanceEvent {
  return {
    id: event.id,
    staff_member_id: event.staff_member_id,
    shift_assignment_id: event.shift_assignment_id ?? null,
    event_type: event.event_type,
    source: event.source_type ?? event.source ?? 'web',
    occurred_at: event.occurred_at,
    latitude: event.geo_latitude ?? event.latitude ?? null,
    longitude: event.geo_longitude ?? event.longitude ?? null,
    notes: event.notes ?? null,
    staff_member: event.staff_member ?? event.staffMember ?? null,
  }
}

function anomalyLabel(flag: string): string {
  const labels: Record<string, string> = {
    missing_clock_in: 'Entrata mancante',
    missing_clock_out: 'Uscita mancante',
    unplanned_work: 'Lavoro non pianificato',
    late_clock_in: 'Entrata in ritardo',
    early_clock_out: 'Uscita anticipata',
    no_break_logged: 'Pausa non registrata',
  }

  return labels[flag] ?? flag
}

function normalizeTimesheetEntry(entry: any): TimesheetEntry {
  const anomalyFlags: string[] = Array.isArray(entry.anomaly_flags_json) ? entry.anomaly_flags_json : []
  const attendanceEvents = Array.isArray(entry.attendance_events)
    ? entry.attendance_events.map((event: any) => normalizeAttendanceEvent(event))
    : []

  return {
    id: entry.id,
    staff_member_id: entry.staff_member_id,
    shift_assignment_id: entry.shift_assignment_id ?? null,
    work_date: entry.work_date,
    planned_start: entry.planned_starts_at ?? entry.planned_start ?? null,
    planned_end: entry.planned_ends_at ?? entry.planned_end ?? null,
    actual_start: entry.actual_starts_at ?? entry.actual_start ?? null,
    actual_end: entry.actual_ends_at ?? entry.actual_end ?? null,
    planned_minutes: entry.planned_minutes ?? 0,
    worked_minutes: entry.worked_minutes ?? 0,
    ordinary_minutes: entry.ordinary_minutes ?? 0,
    overtime_minutes: entry.overtime_minutes ?? 0,
    night_minutes: entry.night_minutes ?? 0,
    absence_minutes: entry.absence_minutes ?? 0,
    break_minutes: entry.break_minutes ?? 0,
    delta_minutes: entry.variance_minutes ?? entry.delta_minutes ?? 0,
    has_anomaly: anomalyFlags.length > 0,
    anomaly_notes: anomalyFlags.length > 0 ? anomalyFlags.map(anomalyLabel).join(', ') : null,
    status: entry.status,
    submitted_at: entry.submitted_at ?? null,
    approved_at: entry.approved_at ?? null,
    approved_by_id: entry.approved_by_user_id ?? entry.approved_by_id ?? null,
    facility_id: entry.facility_id ?? null,
    notes: entry.notes ?? null,
    staff_member: entry.staff_member ?? entry.staffMember ?? null,
    shift_assignment: entry.shift_assignment ?? entry.shiftAssignment ?? null,
    facility: entry.facility ?? null,
    attendance_events: attendanceEvents,
    adjustments: Array.isArray(entry.adjustments) ? entry.adjustments : [],
  }
}

export const attendanceApi = {
  clockEvent: async (data: { event_type: AttendanceEventType; shift_assignment_id?: number | null; notes?: string | null }) => {
    const me = await authApi.me()
    const activeFacilityId = me.user_facility_roles?.find((item) => item.is_active !== false)?.facility?.id

    if (!activeFacilityId) {
      throw new Error('Nessuna struttura attiva disponibile per registrare la timbratura.')
    }

    return http.post<{ event: any }>('/staff/attendance-events', {
      facility_id: activeFacilityId,
      event_type: data.event_type,
      shift_assignment_id: data.shift_assignment_id ?? null,
      notes: data.notes ?? null,
      occurred_at: new Date().toISOString(),
      source_type: 'web',
    }).then((r) => normalizeAttendanceEvent(r.data.event))
  },
  myToday: () =>
    http.get<any[]>('/staff/attendance-events/today').then((r) => r.data.map((event) => normalizeAttendanceEvent(event))),
  listForEntry: (timesheetEntryId: number) =>
    http.get<any[]>('/staff/attendance-events', { params: { timesheet_entry_id: timesheetEntryId } }).then((r) => r.data.map((event) => normalizeAttendanceEvent(event))),
}

export const timesheetApi = {
  myEntries: (params?: { date_from?: string; date_to?: string }) =>
    http.get<{ items: any[] }>('/staff/timesheets/me', { params }).then((r) => r.data.items.map((entry) => normalizeTimesheetEntry(entry))),
  list: (params?: TimesheetEntryFilters) =>
    http.get<any[]>('/admin/timesheets', { params }).then((r) => r.data.map((entry) => normalizeTimesheetEntry(entry))),
  coordinatorDashboard: (params?: TimesheetEntryFilters) =>
    http.get<TimesheetCoordinatorDashboardResponse>('/admin/timesheets/dashboard-summary', { params }).then((r) => r.data),
  adjustmentQueue: (params?: TimesheetAdjustmentQueueFilters) =>
    http.get<any[]>('/admin/timesheet-adjustments', { params }).then((r) => r.data),
  adjustmentKpis: (params?: TimesheetAdjustmentQueueFilters) =>
    http.get<TimesheetAdjustmentQueueKpis>('/admin/timesheet-adjustments/kpis', { params }).then((r) => r.data),
  get: (id: number) =>
    http.get<any>(`/admin/timesheets/${id}`).then((r) => normalizeTimesheetEntry(r.data)),
  submit: (id: number) =>
    http.post<any>(`/staff/timesheets/${id}/submit`).then((r) => normalizeTimesheetEntry(r.data)),
  approve: (id: number) =>
    http.post<any>(`/admin/timesheets/${id}/approve`).then((r) => normalizeTimesheetEntry(r.data)),
  reject: (id: number, reason: string) =>
    http.post<any>(`/admin/timesheets/${id}/reject`, { reason }).then((r) => normalizeTimesheetEntry(r.data)),
  addAdjustment: (id: number, data: TimesheetAdjustmentWrite) =>
    http.post<any>(`/admin/timesheets/${id}/adjustments`, data).then((r) => normalizeTimesheetEntry(r.data)),
  approveAdjustment: (timesheetId: number, adjustmentId: number, review_notes?: string) =>
    http.post<any>(`/admin/timesheets/${timesheetId}/adjustments/${adjustmentId}/approve`, { review_notes }).then((r) => normalizeTimesheetEntry(r.data)),
  rejectAdjustment: (timesheetId: number, adjustmentId: number, review_notes: string) =>
    http.post<any>(`/admin/timesheets/${timesheetId}/adjustments/${adjustmentId}/reject`, { review_notes }).then((r) => normalizeTimesheetEntry(r.data)),
  exportMonthly: (params: { facility_id: number; year: number; month: number; format: 'csv'; preset?: 'payroll' | 'review' | 'labor_consultant' }) =>
    http.get('/admin/timesheets/export.csv', { params, responseType: 'blob' }),
  exportMonthlyPdf: (params: { facility_id: number; year: number; month: number; preset?: 'payroll' | 'review' | 'labor_consultant' }) =>
    http.get('/admin/timesheets/export.pdf', { params, responseType: 'blob' }),
  dashboardSummary: (params?: { facility_id?: number; staff_member_id?: number; date_from?: string; date_to?: string }) =>
    http.get<TimesheetCoordinatorDashboardResponse>('/admin/timesheets/dashboard-summary', { params }).then((r) => r.data),
  }

// ─── System Health ────────────────────────────────────────────────────────────

export interface SystemHealthService {
  service: string
  label: string
  status: 'ok' | 'warning' | 'error' | 'not_configured'
  checked_at: string | null
  latency_ms: number | null
  message: string | null
  error: string | null
  meta: Record<string, unknown>
}

export interface SystemHealthSummary {
  ok: number
  warning: number
  error: number
  not_configured: number
}

export interface SystemHealthResponse {
  generated_at: string
  storage_config_source: string
  summary: SystemHealthSummary
  services: SystemHealthService[]
}

export const timesheetMonthLockApi = {
  list: (facility_id?: number) =>
    http.get<TimesheetMonthLock[]>('/admin/timesheet-month-locks', { params: facility_id ? { facility_id } : undefined }).then((r) => r.data),
  lock: (data: TimesheetMonthLockCreate) =>
    http.post<TimesheetMonthLockResponse>('/admin/timesheet-month-locks', data).then((r) => r.data),
  unlock: (id: number) =>
    http.post<TimesheetMonthUnlockResponse>(`/admin/timesheet-month-locks/${id}/unlock`).then((r) => r.data),
}

export const systemHealthApi = {
  snapshot: () =>
    http.get<SystemHealthResponse>('/admin/system/health').then((r) => r.data),
  run: () =>
    http.post<SystemHealthResponse>('/admin/system/health/run').then((r) => r.data),
}

// ─── System Storage ───────────────────────────────────────────────────────────

export type StorageProviderType = 'minio' | 'aws_s3' | 's3_compatible'
export type StorageCurrentSource = 'ENV' | 'DB'
export type StorageTestStatus = 'ok' | 'error' | null

export interface StorageEnvFallback {
  provider_type: string
  bucket: string
  region: string
  endpoint: string
  use_path_style_endpoint: boolean
  access_key_masked: string
  secret_key_masked: string
  disk: string
}

export interface StorageConfigItem {
  id: number
  code: string
  name: string
  provider_type: StorageProviderType
  bucket: string
  region: string
  endpoint: string
  use_path_style_endpoint: boolean
  prefix: string | null
  is_active: boolean
  is_default: boolean
  last_tested_at: string | null
  last_test_status: StorageTestStatus
  last_test_message: string | null
  access_key_masked: string | null
  secret_key_masked: string | null
  has_access_key: boolean
  has_secret_key: boolean
  created_at: string
  updated_at: string
}

export interface StorageConfigListResponse {
  current_source: StorageCurrentSource
  active_config_id: number | null
  active_config: StorageConfigItem | null
  env_fallback: StorageEnvFallback | null
  items: StorageConfigItem[]
}

export interface StorageConfigWrite {
  code: string
  name: string
  provider_type: StorageProviderType
  bucket: string
  region?: string
  endpoint?: string
  use_path_style_endpoint?: boolean
  access_key?: string
  secret_key?: string
  prefix?: string
  is_active?: boolean
  is_default?: boolean
}

export interface StorageTestResponse {
  status: 'ok' | 'error'
  message: string
  tested_at: string
}

export interface StorageActivateResponse {
  message: string
  current_source: StorageCurrentSource
  item: StorageConfigItem
}

export const systemStorageApi = {
  list: () =>
    http.get<StorageConfigListResponse>('/admin/system/storage-configs').then((r) => r.data),
  create: (data: StorageConfigWrite) =>
    http.post<StorageConfigItem>('/admin/system/storage-configs', data).then((r) => r.data),
  update: (id: number, data: Partial<StorageConfigWrite>) =>
    http.put<StorageConfigItem>(`/admin/system/storage-configs/${id}`, data).then((r) => r.data),
  test: (id: number) =>
    http.post<StorageTestResponse>(`/admin/system/storage-configs/${id}/test`).then((r) => r.data),
  activate: (id: number) =>
    http.post<StorageActivateResponse>(`/admin/system/storage-configs/${id}/activate`).then((r) => r.data),
  delete: (id: number) =>
    http.delete<{ message: string }>(`/admin/system/storage-configs/${id}`).then((r) => r.data),
}

// ─── Backup database ──────────────────────────────────────────────────────────

export const backupApi = {
  list: () =>
    http.get<DatabaseBackupListResponse>('/admin/database-backups').then((r) => r.data),
  export: (label?: string) =>
    http.post<DatabaseBackup>('/admin/database-backups/export', label ? { label } : {}).then((r) => r.data),
  download: (filename: string) =>
    http.get('/admin/database-backups/download', { params: { filename }, responseType: 'blob' }).then((r) => r.data as Blob),
  restore: (data: DatabaseRestoreRequest) =>
    http.post<DatabaseRestoreResponse>('/admin/database-backups/restore', data).then((r) => r.data),
  restoreUpload: (fd: FormData) =>
    http.post<DatabaseRestoreResponse>('/admin/database-backups/restore', fd).then((r) => r.data),
}
