<?php

use App\Http\Controllers\Api\Admin\FacilityController;
use App\Http\Controllers\Api\Admin\FacilityStatusController;
use App\Http\Controllers\Api\Admin\BiologicalSexController;
use App\Http\Controllers\Api\Admin\ContactTypeController;
use App\Http\Controllers\Api\Admin\CountryController;
use App\Http\Controllers\Api\Admin\AuditLogController;
use App\Http\Controllers\Api\Admin\DatabaseBackupController;
use App\Http\Controllers\Api\Admin\CountryGeographyProviderController;
use App\Http\Controllers\Api\Admin\DocumentTypeController;
use App\Http\Controllers\Api\Admin\ExitTypeController;
use App\Http\Controllers\Api\Admin\DocumentScopeController;
use App\Http\Controllers\Api\Admin\DocumentIssuerController;
use App\Http\Controllers\Api\Admin\DocumentClassificationController;
use App\Http\Controllers\Api\Admin\DocumentAccessMatrixController;
use App\Http\Controllers\Api\Admin\RoleDocumentPolicyController;
use App\Http\Controllers\Api\Admin\GenderIdentityController;
use App\Http\Controllers\Api\Admin\GeoLoadController;
use App\Http\Controllers\Api\Admin\GeographyImportController;
use App\Http\Controllers\Api\Admin\GeographyProviderController;
use App\Http\Controllers\Api\Admin\GeoSyncController;
use App\Http\Controllers\Api\Admin\CityController;
use App\Http\Controllers\Api\Admin\ActivityTypeController;
use App\Http\Controllers\Api\Admin\ApproachTypeController;
use App\Http\Controllers\Api\Admin\JournalEntryTypeController;
use App\Http\Controllers\Api\Admin\MinorStatusController;
use App\Http\Controllers\Api\Admin\MinorUserAssignmentController;
use App\Http\Controllers\Api\Admin\OrganizationController;
use App\Http\Controllers\Api\Admin\ProvinceController;
use App\Http\Controllers\Api\Admin\RegionController;
use App\Http\Controllers\Api\Admin\RoleController;
use App\Http\Controllers\Api\Admin\StaffMemberController;
use App\Http\Controllers\Api\Admin\StaffShiftAssignmentController;
use App\Http\Controllers\Api\Admin\StaffShiftTemplateController;
use App\Http\Controllers\Api\Admin\StaffTimesheetController as AdminStaffTimesheetController;
use App\Http\Controllers\Api\Admin\StaffQualificationController;
use App\Http\Controllers\Api\Admin\StaffDocumentStatusController;
use App\Http\Controllers\Api\Admin\StaffStatusController;
use App\Http\Controllers\Api\Admin\SystemStorageConfigController;
use App\Http\Controllers\Api\Admin\SystemHealthController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\UserFacilityRoleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InternalMessageController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\MinorController;
use App\Http\Controllers\Api\MinorActivityController;
use App\Http\Controllers\Api\MinorApproachController;
use App\Http\Controllers\Api\MinorExitController;
use App\Http\Controllers\Api\MinorJournalController;
use App\Http\Controllers\Api\StaffAttendanceEventController;
use App\Http\Controllers\Api\StaffTimesheetController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

Route::get('/health', function (): JsonResponse {
    return response()->json([
        'status' => 'ok',
        'service' => 'familyhub-api',
    ]);
});

Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/login-context', [AuthController::class, 'loginContext']);

Route::middleware(['auth:sanctum', 'session.timeout.api'])->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/mfa/status', [AuthController::class, 'mfaStatus']);
    Route::post('/auth/mfa/setup', [AuthController::class, 'mfaSetup']);
    Route::post('/auth/mfa/confirm', [AuthController::class, 'mfaConfirm']);
    Route::post('/auth/mfa/recovery-codes/regenerate', [AuthController::class, 'mfaRegenerateRecoveryCodes']);
    Route::post('/auth/mfa/disable', [AuthController::class, 'mfaDisable']);
});

Route::prefix('lookups')->group(function (): void {
    Route::get('/geography', [LookupController::class, 'geography']);
    Route::get('/cities', [LookupController::class, 'cities']);
    Route::get('/roles', [LookupController::class, 'roles']);
    Route::get('/document-types', [LookupController::class, 'documentTypes']);
    Route::get('/document-classifications', [LookupController::class, 'documentClassifications']);
    Route::get('/document-scopes', [LookupController::class, 'documentScopes']);
    Route::get('/document-issuers', [LookupController::class, 'documentIssuers']);
    Route::get('/contact-types', [LookupController::class, 'contactTypes']);
    Route::get('/staff-qualifications', [LookupController::class, 'staffQualifications']);
    Route::get('/staff-statuses', [LookupController::class, 'staffStatuses']);
    Route::get('/facility-statuses', [LookupController::class, 'facilityStatuses']);
    Route::get('/staff-document-statuses', [LookupController::class, 'staffDocumentStatuses']);
    Route::get('/minor-statuses', [LookupController::class, 'minorStatuses']);
    Route::get('/biological-sexes', [LookupController::class, 'biologicalSexes']);
    Route::get('/exit-types', [LookupController::class, 'exitTypes']);
    Route::get('/activity-types', [LookupController::class, 'activityTypes']);
    Route::get('/approach-types', [LookupController::class, 'approachTypes']);
    Route::get('/journal-entry-types', [LookupController::class, 'journalEntryTypes']);
    Route::get('/gender-identities', [LookupController::class, 'genderIdentities']);
});

Route::middleware(['auth:sanctum', 'admin.api', 'audit.api'])->prefix('admin')->group(function (): void {
    Route::get('/organizations', [OrganizationController::class, 'index'])->middleware('permission.api:organizations.read');
    Route::post('/organizations', [OrganizationController::class, 'store'])->middleware('permission.api:organizations.create');

    Route::get('/facilities', [FacilityController::class, 'index'])->middleware('permission.api:facilities.read');
    Route::get('/facilities/{facility}', [FacilityController::class, 'show'])->middleware('permission.api:facilities.read');
    Route::get('/facility-statuses', [FacilityStatusController::class, 'index'])->middleware('permission.api:facilities.read');
    Route::post('/facility-statuses', [FacilityStatusController::class, 'store'])->middleware('permission.api:facilities.create');
    Route::get('/facility-statuses/{facility_status}', [FacilityStatusController::class, 'show'])->middleware('permission.api:facilities.read');
    Route::put('/facility-statuses/{facility_status}', [FacilityStatusController::class, 'update'])->middleware('permission.api:facilities.update');
    Route::delete('/facility-statuses/{facility_status}', [FacilityStatusController::class, 'destroy'])->middleware('permission.api:facilities.delete');
    Route::post('/facilities', [FacilityController::class, 'store'])->middleware('permission.api:facilities.create');
    Route::put('/facilities/{facility}', [FacilityController::class, 'update'])->middleware('permission.api:facilities.update');
    Route::delete('/facilities/{facility}', [FacilityController::class, 'destroy'])->middleware('permission.api:facilities.delete');

    Route::get('/users', [UserController::class, 'index'])->middleware('permission.api:users.read');
    Route::post('/users', [UserController::class, 'store'])->middleware('permission.api:users.create');
    Route::get('/users/linkable-staff-members', [UserController::class, 'linkableStaffMembers'])->middleware('permission.api:staff_members.read');
    Route::post('/users/educator-account', [UserController::class, 'storeEducatorAccount'])->middleware('permission.api:users.create,request:facility_id');
    Route::get('/users/{user}/assigned-minors', [UserController::class, 'assignedMinors'])->middleware('permission.api:minor_user_assignments.read');
    Route::post('/users/{user}/minor-assignments/bulk-sync', [MinorUserAssignmentController::class, 'bulkSyncForUser'])->middleware('permission.api:minor_user_assignments.update,request:facility_id');
    Route::get('/users/{user}', [UserController::class, 'show'])->middleware('permission.api:users.read');
    Route::put('/users/{user}', [UserController::class, 'update'])->middleware('permission.api:users.update');
    Route::post('/users/{user}/deactivate', [UserController::class, 'deactivate'])->middleware('permission.api:users.update');
    Route::post('/users/{user}/reset-mfa', [UserController::class, 'resetMfa'])->middleware('permission.api:users.update');

    Route::get('/staff-members', [StaffMemberController::class, 'index'])->middleware('permission.api:staff_members.read');
    Route::get('/staff-qualifications', [StaffQualificationController::class, 'index'])->middleware('permission.api:staff_members.read');
    Route::post('/staff-qualifications', [StaffQualificationController::class, 'store'])->middleware('permission.api:staff_members.create');
    Route::get('/staff-qualifications/{staff_qualification}', [StaffQualificationController::class, 'show'])->middleware('permission.api:staff_members.read');
    Route::put('/staff-qualifications/{staff_qualification}', [StaffQualificationController::class, 'update'])->middleware('permission.api:staff_members.update');
    Route::delete('/staff-qualifications/{staff_qualification}', [StaffQualificationController::class, 'destroy'])->middleware('permission.api:staff_members.delete');
    Route::get('/staff-statuses', [StaffStatusController::class, 'index'])->middleware('permission.api:staff_members.read');
    Route::post('/staff-statuses', [StaffStatusController::class, 'store'])->middleware('permission.api:staff_members.create');
    Route::get('/staff-statuses/{staff_status}', [StaffStatusController::class, 'show'])->middleware('permission.api:staff_members.read');
    Route::put('/staff-statuses/{staff_status}', [StaffStatusController::class, 'update'])->middleware('permission.api:staff_members.update');
    Route::delete('/staff-statuses/{staff_status}', [StaffStatusController::class, 'destroy'])->middleware('permission.api:staff_members.delete');
    Route::get('/staff-document-statuses', [StaffDocumentStatusController::class, 'index'])->middleware('permission.api:staff_members.read');
    Route::post('/staff-document-statuses', [StaffDocumentStatusController::class, 'store'])->middleware('permission.api:staff_members.create');
    Route::get('/staff-document-statuses/{staff_document_status}', [StaffDocumentStatusController::class, 'show'])->middleware('permission.api:staff_members.read');
    Route::put('/staff-document-statuses/{staff_document_status}', [StaffDocumentStatusController::class, 'update'])->middleware('permission.api:staff_members.update');
    Route::delete('/staff-document-statuses/{staff_document_status}', [StaffDocumentStatusController::class, 'destroy'])->middleware('permission.api:staff_members.delete');
    Route::post('/staff-members', [StaffMemberController::class, 'store'])->middleware('permission.api:staff_members.create,request:facility_id');
    Route::get('/staff-members/{staff_member}', [StaffMemberController::class, 'show'])->middleware('permission.api:staff_members.read');
    Route::post('/staff-members/{staff_member}/link-user', [StaffMemberController::class, 'linkUser'])->middleware('permission.api:staff_members.update,staff_member');
    Route::get('/staff-members/{staff_member}/documents/{document}/preview', [StaffMemberController::class, 'previewDocument'])->middleware('permission.api:attachments.read,staff_member');
    Route::get('/staff-members/{staff_member}/documents/{document}/preview-structured', [StaffMemberController::class, 'previewDocumentStructured'])->middleware('permission.api:attachments.read,staff_member');
    Route::get('/staff-members/{staff_member}/documents/{document}/download', [StaffMemberController::class, 'downloadDocument'])->middleware('permission.api:attachments.download,staff_member');
    Route::put('/staff-members/{staff_member}', [StaffMemberController::class, 'update'])->middleware('permission.api:staff_members.update,staff_member');
    Route::delete('/staff-members/{staff_member}', [StaffMemberController::class, 'destroy'])->middleware('permission.api:staff_members.delete,staff_member');

    Route::get('/minor-assignments', [MinorUserAssignmentController::class, 'index'])->middleware('permission.api:minor_user_assignments.read');
    Route::post('/minor-assignments', [MinorUserAssignmentController::class, 'store'])->middleware('permission.api:minor_user_assignments.create,request:facility_id');
    Route::get('/minors/{minor}/assigned-users', [MinorUserAssignmentController::class, 'assignedUsers'])->middleware('permission.api:minor_user_assignments.read,minor');
    Route::post('/minors/{minor}/user-assignments/bulk-sync', [MinorUserAssignmentController::class, 'bulkSyncForMinor'])->middleware('permission.api:minor_user_assignments.update,minor');
    Route::get('/minor-assignments/{minor_assignment}', [MinorUserAssignmentController::class, 'show'])->middleware('permission.api:minor_user_assignments.read,minor_assignment');
    Route::put('/minor-assignments/{minor_assignment}', [MinorUserAssignmentController::class, 'update'])->middleware('permission.api:minor_user_assignments.update,minor_assignment');
    Route::patch('/minor-assignments/{minor_assignment}/revoke', [MinorUserAssignmentController::class, 'revoke'])->middleware('permission.api:minor_user_assignments.revoke,minor_assignment');

    Route::get('/user-facility-roles', [UserFacilityRoleController::class, 'index'])->middleware('permission.api:user_facility_roles.read');
    Route::post('/user-facility-roles', [UserFacilityRoleController::class, 'store'])->middleware('permission.api:user_facility_roles.create');
    Route::get('/user-facility-roles/{assignment}', [UserFacilityRoleController::class, 'show'])->middleware('permission.api:user_facility_roles.read');
    Route::put('/user-facility-roles/{assignment}', [UserFacilityRoleController::class, 'update'])->middleware('permission.api:user_facility_roles.update');
    Route::patch('/user-facility-roles/{assignment}/revoke', [UserFacilityRoleController::class, 'revoke'])->middleware('permission.api:user_facility_roles.revoke');

    Route::get('/document-types', [DocumentTypeController::class, 'index'])->middleware('permission.api:document_types.read');
    Route::post('/document-types', [DocumentTypeController::class, 'store'])->middleware('permission.api:document_types.create');
    Route::get('/document-types/{document_type}', [DocumentTypeController::class, 'show'])->middleware('permission.api:document_types.read');
    Route::put('/document-types/{document_type}', [DocumentTypeController::class, 'update'])->middleware('permission.api:document_types.update');
    Route::delete('/document-types/{document_type}', [DocumentTypeController::class, 'destroy'])->middleware('permission.api:document_types.delete');
    Route::get('/document-scopes', [DocumentScopeController::class, 'index'])->middleware('permission.api:document_types.read');
    Route::post('/document-scopes', [DocumentScopeController::class, 'store'])->middleware('permission.api:document_types.create');
    Route::get('/document-scopes/{document_scope}', [DocumentScopeController::class, 'show'])->middleware('permission.api:document_types.read');
    Route::put('/document-scopes/{document_scope}', [DocumentScopeController::class, 'update'])->middleware('permission.api:document_types.update');
    Route::delete('/document-scopes/{document_scope}', [DocumentScopeController::class, 'destroy'])->middleware('permission.api:document_types.delete');
    Route::get('/document-classifications', [DocumentClassificationController::class, 'index'])->middleware('permission.api:document_classifications.read');
    Route::get('/document-access-matrix', [DocumentAccessMatrixController::class, 'index'])->middleware('permission.api:document_access_matrix.read');
    Route::post('/document-classifications', [DocumentClassificationController::class, 'store'])->middleware('permission.api:document_classifications.create');
    Route::get('/document-classifications/{document_classification}', [DocumentClassificationController::class, 'show'])->middleware('permission.api:document_classifications.read');
    Route::put('/document-classifications/{document_classification}', [DocumentClassificationController::class, 'update'])->middleware('permission.api:document_classifications.update');
    Route::delete('/document-classifications/{document_classification}', [DocumentClassificationController::class, 'destroy'])->middleware('permission.api:document_classifications.delete');
    Route::get('/document-issuers', [DocumentIssuerController::class, 'index'])->middleware('permission.api:document_types.read');
    Route::post('/document-issuers', [DocumentIssuerController::class, 'store'])->middleware('permission.api:document_types.create');
    Route::get('/document-issuers/{document_issuer}', [DocumentIssuerController::class, 'show'])->middleware('permission.api:document_types.read');
    Route::put('/document-issuers/{document_issuer}', [DocumentIssuerController::class, 'update'])->middleware('permission.api:document_types.update');
    Route::delete('/document-issuers/{document_issuer}', [DocumentIssuerController::class, 'destroy'])->middleware('permission.api:document_types.delete');

    Route::get('/contact-types', [ContactTypeController::class, 'index'])->middleware('permission.api:contact_types.read');
    Route::post('/contact-types', [ContactTypeController::class, 'store'])->middleware('permission.api:contact_types.create');
    Route::get('/contact-types/{contact_type}', [ContactTypeController::class, 'show'])->middleware('permission.api:contact_types.read');
    Route::put('/contact-types/{contact_type}', [ContactTypeController::class, 'update'])->middleware('permission.api:contact_types.update');
    Route::delete('/contact-types/{contact_type}', [ContactTypeController::class, 'destroy'])->middleware('permission.api:contact_types.delete');

    Route::get('/minor-statuses', [MinorStatusController::class, 'index'])->middleware('permission.api:minor_statuses.read');
    Route::post('/minor-statuses', [MinorStatusController::class, 'store'])->middleware('permission.api:minor_statuses.create');
    Route::get('/minor-statuses/{minor_status}', [MinorStatusController::class, 'show'])->middleware('permission.api:minor_statuses.read');
    Route::put('/minor-statuses/{minor_status}', [MinorStatusController::class, 'update'])->middleware('permission.api:minor_statuses.update');
    Route::delete('/minor-statuses/{minor_status}', [MinorStatusController::class, 'destroy'])->middleware('permission.api:minor_statuses.delete');

    Route::get('/gender-identities', [GenderIdentityController::class, 'index'])->middleware('permission.api:gender_identities.read');
    Route::post('/gender-identities', [GenderIdentityController::class, 'store'])->middleware('permission.api:gender_identities.create');
    Route::get('/gender-identities/{gender_identity}', [GenderIdentityController::class, 'show'])->middleware('permission.api:gender_identities.read');
    Route::put('/gender-identities/{gender_identity}', [GenderIdentityController::class, 'update'])->middleware('permission.api:gender_identities.update');
    Route::delete('/gender-identities/{gender_identity}', [GenderIdentityController::class, 'destroy'])->middleware('permission.api:gender_identities.delete');
    Route::get('/biological-sexes', [BiologicalSexController::class, 'index'])->middleware('permission.api:biological_sexes.read');
    Route::post('/biological-sexes', [BiologicalSexController::class, 'store'])->middleware('permission.api:biological_sexes.create');
    Route::get('/biological-sexes/{biological_sex}', [BiologicalSexController::class, 'show'])->middleware('permission.api:biological_sexes.read');
    Route::put('/biological-sexes/{biological_sex}', [BiologicalSexController::class, 'update'])->middleware('permission.api:biological_sexes.update');
    Route::delete('/biological-sexes/{biological_sex}', [BiologicalSexController::class, 'destroy'])->middleware('permission.api:biological_sexes.delete');
    Route::get('/exit-types', [ExitTypeController::class, 'index'])->middleware('permission.api:exit_types.read');
    Route::post('/exit-types', [ExitTypeController::class, 'store'])->middleware('permission.api:exit_types.create');
    Route::get('/exit-types/{exit_type}', [ExitTypeController::class, 'show'])->middleware('permission.api:exit_types.read');
    Route::put('/exit-types/{exit_type}', [ExitTypeController::class, 'update'])->middleware('permission.api:exit_types.update');
    Route::delete('/exit-types/{exit_type}', [ExitTypeController::class, 'destroy'])->middleware('permission.api:exit_types.delete');
    Route::get('/activity-types', [ActivityTypeController::class, 'index'])->middleware('permission.api:activity_types.read');
    Route::post('/activity-types', [ActivityTypeController::class, 'store'])->middleware('permission.api:activity_types.create');
    Route::get('/activity-types/{activity_type}', [ActivityTypeController::class, 'show'])->middleware('permission.api:activity_types.read');
    Route::put('/activity-types/{activity_type}', [ActivityTypeController::class, 'update'])->middleware('permission.api:activity_types.update');
    Route::delete('/activity-types/{activity_type}', [ActivityTypeController::class, 'destroy'])->middleware('permission.api:activity_types.delete');
    Route::get('/approach-types', [ApproachTypeController::class, 'index'])->middleware('permission.api:approach_types.read');
    Route::post('/approach-types', [ApproachTypeController::class, 'store'])->middleware('permission.api:approach_types.create');
    Route::get('/approach-types/{approach_type}', [ApproachTypeController::class, 'show'])->middleware('permission.api:approach_types.read');
    Route::put('/approach-types/{approach_type}', [ApproachTypeController::class, 'update'])->middleware('permission.api:approach_types.update');
    Route::delete('/approach-types/{approach_type}', [ApproachTypeController::class, 'destroy'])->middleware('permission.api:approach_types.delete');
    Route::get('/journal-entry-types', [JournalEntryTypeController::class, 'index'])->middleware('permission.api:journal_entry_types.read');
    Route::post('/journal-entry-types', [JournalEntryTypeController::class, 'store'])->middleware('permission.api:journal_entry_types.create');
    Route::get('/journal-entry-types/{journal_entry_type}', [JournalEntryTypeController::class, 'show'])->middleware('permission.api:journal_entry_types.read');
    Route::put('/journal-entry-types/{journal_entry_type}', [JournalEntryTypeController::class, 'update'])->middleware('permission.api:journal_entry_types.update');
    Route::delete('/journal-entry-types/{journal_entry_type}', [JournalEntryTypeController::class, 'destroy'])->middleware('permission.api:journal_entry_types.delete');
    Route::get('/staff-shift-templates', [StaffShiftTemplateController::class, 'index'])->middleware('permission.api:staff_shift_templates.read');
    Route::post('/staff-shift-templates', [StaffShiftTemplateController::class, 'store'])->middleware('permission.api:staff_shift_templates.create');
    Route::get('/staff-shift-templates/{shift_template}', [StaffShiftTemplateController::class, 'show'])->middleware('permission.api:staff_shift_templates.read');
    Route::put('/staff-shift-templates/{shift_template}', [StaffShiftTemplateController::class, 'update'])->middleware('permission.api:staff_shift_templates.update');
    Route::delete('/staff-shift-templates/{shift_template}', [StaffShiftTemplateController::class, 'destroy'])->middleware('permission.api:staff_shift_templates.delete');
    Route::get('/staff-shifts', [StaffShiftAssignmentController::class, 'index'])->middleware('permission.api:staff_shift_assignments.read');
    Route::get('/staff-shifts/week', [StaffShiftAssignmentController::class, 'week'])->middleware('permission.api:staff_shift_assignments.read');
    Route::post('/staff-shifts', [StaffShiftAssignmentController::class, 'store'])->middleware('permission.api:staff_shift_assignments.create');
    Route::get('/staff-shifts/{shift_assignment}', [StaffShiftAssignmentController::class, 'show'])->middleware('permission.api:staff_shift_assignments.read');
    Route::put('/staff-shifts/{shift_assignment}', [StaffShiftAssignmentController::class, 'update'])->middleware('permission.api:staff_shift_assignments.update');
    Route::delete('/staff-shifts/{shift_assignment}', [StaffShiftAssignmentController::class, 'destroy'])->middleware('permission.api:staff_shift_assignments.delete');
    Route::get('/timesheets', [AdminStaffTimesheetController::class, 'index'])->middleware('permission.api:staff_timesheet_entries.read');
    Route::get('/timesheet-adjustments', [AdminStaffTimesheetController::class, 'adjustmentQueue'])->middleware('permission.api:staff_timesheet_adjustments.read');
    Route::get('/timesheet-adjustments/kpis', [AdminStaffTimesheetController::class, 'adjustmentKpis'])->middleware('permission.api:staff_timesheet_adjustments.read');
    Route::get('/timesheets/dashboard-summary', [AdminStaffTimesheetController::class, 'dashboardSummary'])->middleware('permission.api:staff_timesheet_entries.read');
    Route::get('/timesheet-month-locks', [AdminStaffTimesheetController::class, 'monthLocks'])->middleware('permission.api:staff_timesheet_entries.lock');
    Route::post('/timesheet-month-locks', [AdminStaffTimesheetController::class, 'lockMonth'])->middleware('permission.api:staff_timesheet_entries.lock');
    Route::post('/timesheet-month-locks/{monthLock}/unlock', [AdminStaffTimesheetController::class, 'unlockMonth'])->middleware('permission.api:staff_timesheet_entries.lock');
    Route::get('/timesheets/export.csv', [AdminStaffTimesheetController::class, 'exportCsv'])->middleware('permission.api:staff_timesheet_entries.export');
    Route::get('/timesheets/{timesheetEntry}', [AdminStaffTimesheetController::class, 'show'])->middleware('permission.api:staff_timesheet_entries.read');
    Route::post('/timesheets/{timesheetEntry}/approve', [AdminStaffTimesheetController::class, 'approve'])->middleware('permission.api:staff_timesheet_entries.approve');
    Route::post('/timesheets/{timesheetEntry}/reject', [AdminStaffTimesheetController::class, 'reject'])->middleware('permission.api:staff_timesheet_entries.approve');
    Route::post('/timesheets/{timesheetEntry}/adjustments', [AdminStaffTimesheetController::class, 'addAdjustment'])->middleware('permission.api:staff_timesheet_adjustments.create');
    Route::post('/timesheets/{timesheetEntry}/adjustments/{adjustment}/approve', [AdminStaffTimesheetController::class, 'approveAdjustment'])->middleware('permission.api:staff_timesheet_adjustments.approve');
    Route::post('/timesheets/{timesheetEntry}/adjustments/{adjustment}/reject', [AdminStaffTimesheetController::class, 'rejectAdjustment'])->middleware('permission.api:staff_timesheet_adjustments.approve');

    Route::get('/roles', [RoleController::class, 'index'])->middleware('permission.api:roles.read');
    Route::post('/roles', [RoleController::class, 'store'])->middleware('permission.api:roles.create');
    Route::get('/roles/{role}', [RoleController::class, 'show'])->middleware('permission.api:roles.read');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->middleware('permission.api:roles.update');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->middleware('permission.api:roles.delete');
    Route::get('/roles/{role}/permissions', [RoleController::class, 'permissions'])->middleware('permission.api:role_permissions.read');
    Route::put('/roles/{role}/permissions', [RoleController::class, 'syncPermissions'])->middleware('permission.api:role_permissions.update');
    Route::get('/roles/{role}/document-policy', [RoleDocumentPolicyController::class, 'show'])->middleware('permission.api:role_document_policies.read');
    Route::put('/roles/{role}/document-policy', [RoleDocumentPolicyController::class, 'update'])->middleware('permission.api:role_document_policies.update');
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('permission.api:audit_logs.read');
    Route::get('/audit-logs/filters', [AuditLogController::class, 'filters'])->middleware('permission.api:audit_logs.read');
    Route::get('/audit-logs/kpis', [AuditLogController::class, 'kpis'])->middleware('permission.api:audit_logs.read');
    Route::get('/audit-logs/export.csv', [AuditLogController::class, 'exportCsv'])->middleware('permission.api:audit_logs.read');
    Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show'])->middleware('permission.api:audit_logs.read');
    Route::get('/database-backups', [DatabaseBackupController::class, 'index'])->middleware('permission.api:database_backups.read');
    Route::post('/database-backups/export', [DatabaseBackupController::class, 'export'])->middleware('permission.api:database_backups.create');
    Route::get('/database-backups/download', [DatabaseBackupController::class, 'download'])->middleware('permission.api:database_backups.read');
    Route::post('/database-backups/restore', [DatabaseBackupController::class, 'restore'])->middleware('permission.api:database_backups.restore');
    Route::get('/system/storage-configs', [SystemStorageConfigController::class, 'index'])->middleware('permission.api:system_storage.read');
    Route::post('/system/storage-configs', [SystemStorageConfigController::class, 'store'])->middleware('permission.api:system_storage.create');
    Route::put('/system/storage-configs/{storageConfig}', [SystemStorageConfigController::class, 'update'])->middleware('permission.api:system_storage.update');
    Route::patch('/system/storage-configs/{storageConfig}', [SystemStorageConfigController::class, 'update'])->middleware('permission.api:system_storage.update');
    Route::post('/system/storage-configs/{storageConfig}/test', [SystemStorageConfigController::class, 'test'])->middleware('permission.api:system_storage.test');
    Route::post('/system/storage-configs/{storageConfig}/activate', [SystemStorageConfigController::class, 'activate'])->middleware('permission.api:system_storage.activate');
    Route::delete('/system/storage-configs/{storageConfig}', [SystemStorageConfigController::class, 'destroy'])->middleware('permission.api:system_storage.delete');
    Route::get('/system/health', [SystemHealthController::class, 'index'])->middleware('permission.api:system_health.read');
    Route::post('/system/health/run', [SystemHealthController::class, 'run'])->middleware('permission.api:system_health.run');

    Route::get('/countries', [CountryController::class, 'index'])->middleware('permission.api:geography.read');
    Route::post('/countries', [CountryController::class, 'store'])->middleware('permission.api:geography.create');
    Route::get('/countries/{country}', [CountryController::class, 'show'])->middleware('permission.api:geography.read');
    Route::put('/countries/{country}', [CountryController::class, 'update'])->middleware('permission.api:geography.update');
    Route::delete('/countries/{country}', [CountryController::class, 'destroy'])->middleware('permission.api:geography.delete');

    Route::get('/regions', [RegionController::class, 'index'])->middleware('permission.api:geography.read');
    Route::post('/regions', [RegionController::class, 'store'])->middleware('permission.api:geography.create');
    Route::get('/regions/{region}', [RegionController::class, 'show'])->middleware('permission.api:geography.read');
    Route::put('/regions/{region}', [RegionController::class, 'update'])->middleware('permission.api:geography.update');
    Route::delete('/regions/{region}', [RegionController::class, 'destroy'])->middleware('permission.api:geography.delete');

    Route::get('/provinces', [ProvinceController::class, 'index'])->middleware('permission.api:geography.read');
    Route::post('/provinces', [ProvinceController::class, 'store'])->middleware('permission.api:geography.create');
    Route::get('/provinces/{province}', [ProvinceController::class, 'show'])->middleware('permission.api:geography.read');
    Route::put('/provinces/{province}', [ProvinceController::class, 'update'])->middleware('permission.api:geography.update');
    Route::delete('/provinces/{province}', [ProvinceController::class, 'destroy'])->middleware('permission.api:geography.delete');

    Route::get('/cities', [CityController::class, 'index'])->middleware('permission.api:geography.read');
    Route::post('/cities', [CityController::class, 'store'])->middleware('permission.api:geography.create');
    Route::get('/cities/{city}', [CityController::class, 'show'])->middleware('permission.api:geography.read');
    Route::put('/cities/{city}', [CityController::class, 'update'])->middleware('permission.api:geography.update');
    Route::delete('/cities/{city}', [CityController::class, 'destroy'])->middleware('permission.api:geography.delete');

    Route::get('/geography-providers', [GeographyProviderController::class, 'index'])->middleware('permission.api:geography_providers.read');
    Route::post('/geography-providers', [GeographyProviderController::class, 'store'])->middleware('permission.api:geography_providers.create');
    Route::get('/geography-providers/{provider}', [GeographyProviderController::class, 'show'])->middleware('permission.api:geography_providers.read');
    Route::put('/geography-providers/{provider}', [GeographyProviderController::class, 'update'])->middleware('permission.api:geography_providers.update');
    Route::delete('/geography-providers/{provider}', [GeographyProviderController::class, 'destroy'])->middleware('permission.api:geography_providers.delete');

    Route::get('/countries/{country}/geography-providers', [CountryGeographyProviderController::class, 'index'])->middleware('permission.api:geography_providers.read');
    Route::post('/countries/{country}/geography-providers', [CountryGeographyProviderController::class, 'store'])->middleware('permission.api:geography_providers.create');
    Route::put('/countries/{country}/geography-providers/{provider}', [CountryGeographyProviderController::class, 'update'])->middleware('permission.api:geography_providers.update');
    Route::delete('/countries/{country}/geography-providers/{provider}', [CountryGeographyProviderController::class, 'destroy'])->middleware('permission.api:geography_providers.delete');

    Route::get('/geography-sync/runs/latest', [GeoSyncController::class, 'latest'])->middleware('permission.api:geography_sync.read');
    Route::get('/geography-sync/runs', [GeoSyncController::class, 'index'])->middleware('permission.api:geography_sync.read');
    Route::post('/geography-sync/runs', [GeoSyncController::class, 'store'])->middleware('permission.api:geography_sync.run');
    Route::get('/geography-sync/runs/{run}', [GeoSyncController::class, 'show'])->middleware('permission.api:geography_sync.read');
    Route::get('/geography-sync/runs/{run}/issues', [GeoSyncController::class, 'issues'])->middleware('permission.api:geography_sync.read');
    Route::get('/geography-sync/runs/{run}/decisions', [GeoSyncController::class, 'decisions'])->middleware('permission.api:geography_sync.read');
    Route::post('/geography-sync/runs/{run}/publish', [GeoSyncController::class, 'publish'])->middleware('permission.api:geography_sync.publish');
    Route::get('/geography-load/runs', [GeoLoadController::class, 'runs'])->middleware('permission.api:geography_sync.read');
    Route::get('/geography-load/options/continents', [GeoLoadController::class, 'continents'])->middleware('permission.api:geography_sync.read');
    Route::get('/geography-load/options/countries', [GeoLoadController::class, 'countries'])->middleware('permission.api:geography_sync.read');
    Route::get('/geography-load/options/regions', [GeoLoadController::class, 'regions'])->middleware('permission.api:geography_sync.read');
    Route::get('/geography-load/options/provinces', [GeoLoadController::class, 'provinces'])->middleware('permission.api:geography_sync.read');
    Route::get('/geography-load/options/cities', [GeoLoadController::class, 'cities'])->middleware('permission.api:geography_sync.read');
    Route::post('/geography-load/execute', [GeoLoadController::class, 'execute'])->middleware('permission.api:geography_sync.run');
    Route::post('/geography-imports', [GeographyImportController::class, 'store'])->middleware('permission.api:geography_sync.run');
});

Route::middleware(['auth:sanctum', 'minors.api', 'audit.api'])->prefix('minors')->group(function (): void {
    Route::get('/', [MinorController::class, 'index'])->middleware('permission.api:minors.read');
    Route::post('/', [MinorController::class, 'store'])->middleware('permission.api:minors.create,request:facility_id');
    Route::get('/{minor}', [MinorController::class, 'show'])->middleware('permission.api:minor_profiles.read,minor');
    Route::put('/{minor}', [MinorController::class, 'update'])->middleware('permission.api:minors.update,minor');
    Route::patch('/{minor}', [MinorController::class, 'update'])->middleware('permission.api:minors.update,minor');
    Route::get('/{minor}/history', [MinorController::class, 'history'])->middleware('permission.api:minor_profiles.read,minor');
    Route::get('/{minor}/case-options', [MinorController::class, 'caseOptions'])->middleware('permission.api:minor_profiles.read,minor');
    Route::put('/{minor}/profile', [MinorController::class, 'upsertProfile'])->middleware('permission.api:minor_profiles.update,minor');
    Route::patch('/{minor}/profile', [MinorController::class, 'upsertProfile'])->middleware('permission.api:minor_profiles.update,minor');
    Route::put('/{minor}/case-details', [MinorController::class, 'upsertCaseDetail'])->middleware('permission.api:minor_profiles.update,minor');
    Route::patch('/{minor}/case-details', [MinorController::class, 'upsertCaseDetail'])->middleware('permission.api:minor_profiles.update,minor');
    Route::post('/{minor}/diagnoses', [MinorController::class, 'storeDiagnosis'])->middleware('permission.api:minor_profiles.update,minor');
    Route::put('/{minor}/diagnoses/{diagnosis}', [MinorController::class, 'updateDiagnosis'])->middleware('permission.api:minor_profiles.update,minor');
    Route::patch('/{minor}/diagnoses/{diagnosis}', [MinorController::class, 'updateDiagnosis'])->middleware('permission.api:minor_profiles.update,minor');
    Route::delete('/{minor}/diagnoses/{diagnosis}', [MinorController::class, 'destroyDiagnosis'])->middleware('permission.api:minor_profiles.update,minor');
    Route::post('/{minor}/peis', [MinorController::class, 'storePei'])->middleware('permission.api:minor_profiles.update,minor');
    Route::put('/{minor}/peis/{pei}', [MinorController::class, 'updatePei'])->middleware('permission.api:minor_profiles.update,minor');
    Route::patch('/{minor}/peis/{pei}', [MinorController::class, 'updatePei'])->middleware('permission.api:minor_profiles.update,minor');
    Route::post('/{minor}/peis/{pei}/objectives', [MinorController::class, 'storePeiObjective'])->middleware('permission.api:minor_profiles.update,minor');
    Route::put('/{minor}/peis/{pei}/objectives/{objective}', [MinorController::class, 'updatePeiObjective'])->middleware('permission.api:minor_profiles.update,minor');
    Route::patch('/{minor}/peis/{pei}/objectives/{objective}', [MinorController::class, 'updatePeiObjective'])->middleware('permission.api:minor_profiles.update,minor');
    Route::delete('/{minor}/peis/{pei}/objectives/{objective}', [MinorController::class, 'destroyPeiObjective'])->middleware('permission.api:minor_profiles.update,minor');
    Route::get('/{minor}/peis/{pei}/history', [MinorController::class, 'peiHistory'])->middleware('permission.api:minor_profiles.read,minor');
    Route::get('/{minor}/peis/{pei}/objectives/{objective}/progress', [MinorController::class, 'peiObjectiveProgress'])->middleware('permission.api:minor_profiles.read,minor');
    Route::post('/{minor}/needs', [MinorController::class, 'storeNeed'])->middleware('permission.api:minor_profiles.update,minor');
    Route::put('/{minor}/needs/{need}', [MinorController::class, 'updateNeed'])->middleware('permission.api:minor_profiles.update,minor');
    Route::patch('/{minor}/needs/{need}', [MinorController::class, 'updateNeed'])->middleware('permission.api:minor_profiles.update,minor');
    Route::delete('/{minor}/needs/{need}', [MinorController::class, 'destroyNeed'])->middleware('permission.api:minor_profiles.update,minor');
    Route::get('/{minor}/notes', [MinorController::class, 'listNotes'])->middleware('permission.api:minor_profiles.read,minor');
    Route::post('/{minor}/notes', [MinorController::class, 'storeNote'])->middleware('permission.api:minor_profiles.update,minor');
    Route::put('/{minor}/notes/{note}', [MinorController::class, 'updateNote'])->middleware('permission.api:minor_profiles.update,minor');
    Route::patch('/{minor}/notes/{note}', [MinorController::class, 'updateNote'])->middleware('permission.api:minor_profiles.update,minor');
    Route::delete('/{minor}/notes/{note}', [MinorController::class, 'destroyNote'])->middleware('permission.api:minor_profiles.update,minor');
    Route::post('/{minor}/contacts', [MinorController::class, 'storeContact'])->middleware('permission.api:minor_contacts.create,minor');
    Route::put('/{minor}/contacts/{contact}', [MinorController::class, 'updateContact'])->middleware('permission.api:minor_contacts.update,minor');
    Route::patch('/{minor}/contacts/{contact}', [MinorController::class, 'updateContact'])->middleware('permission.api:minor_contacts.update,minor');
    Route::get('/{minor}/documents', [MinorController::class, 'listDocuments'])->middleware('permission.api:attachments.read,minor');
    Route::post('/{minor}/documents', [MinorController::class, 'storeDocument'])->middleware('permission.api:attachments.upload,minor');
    Route::get('/{minor}/documents/{document}/preview', [MinorController::class, 'previewDocument'])->middleware('permission.api:attachments.read,minor');
    Route::get('/{minor}/documents/{document}/preview-structured', [MinorController::class, 'previewDocumentStructured'])->middleware('permission.api:attachments.read,minor');
    Route::get('/{minor}/documents/{document}/download', [MinorController::class, 'downloadDocument'])->middleware('permission.api:attachments.download,minor');
});

Route::middleware(['auth:sanctum', 'minors.api', 'audit.api'])->prefix('exits')->group(function (): void {
    Route::get('/', [MinorExitController::class, 'index'])->middleware('permission.api:minor_exits.read');
    Route::get('/summary', [MinorExitController::class, 'summary'])->middleware('permission.api:minor_exits.read');
    Route::get('/options/accompaniers', [MinorExitController::class, 'accompanierOptions'])->middleware('permission.api:minor_exits.read');
    Route::post('/', [MinorExitController::class, 'store'])->middleware('permission.api:minor_exits.create,request:facility_id');
    Route::get('/{exit}', [MinorExitController::class, 'show'])->middleware('permission.api:minor_exits.read,exit');
    Route::put('/{exit}', [MinorExitController::class, 'update'])->middleware('permission.api:minor_exits.update,exit');
    Route::patch('/{exit}', [MinorExitController::class, 'update'])->middleware('permission.api:minor_exits.update,exit');
    Route::post('/{exit}/mark-out', [MinorExitController::class, 'markOut'])->middleware('permission.api:minor_exits.update,exit');
    Route::post('/{exit}/mark-returned', [MinorExitController::class, 'markReturned'])->middleware('permission.api:minor_exits.update,exit');
    Route::post('/{exit}/cancel', [MinorExitController::class, 'cancel'])->middleware('permission.api:minor_exits.update,exit');
    Route::delete('/{exit}', [MinorExitController::class, 'destroy'])->middleware('permission.api:minor_exits.delete,exit');
});

Route::middleware(['auth:sanctum', 'minors.api', 'audit.api'])->prefix('activities')->group(function (): void {
    Route::get('/', [MinorActivityController::class, 'index'])->middleware('permission.api:minor_activities.read');
    Route::get('/summary', [MinorActivityController::class, 'summary'])->middleware('permission.api:minor_activities.read');
    Route::post('/', [MinorActivityController::class, 'store'])->middleware('permission.api:minor_activities.create');
    Route::get('/{activity}', [MinorActivityController::class, 'show'])->middleware('permission.api:minor_activities.read,activity');
    Route::put('/{activity}', [MinorActivityController::class, 'update'])->middleware('permission.api:minor_activities.update,activity');
    Route::patch('/{activity}', [MinorActivityController::class, 'update'])->middleware('permission.api:minor_activities.update,activity');
    Route::delete('/{activity}', [MinorActivityController::class, 'destroy'])->middleware('permission.api:minor_activities.delete,activity');
});

Route::middleware(['auth:sanctum', 'minors.api', 'audit.api'])->prefix('approaches')->group(function (): void {
    Route::get('/', [MinorApproachController::class, 'index'])->middleware('permission.api:minor_approaches.read');
    Route::get('/trend', [MinorApproachController::class, 'trend'])->middleware('permission.api:minor_approaches.read');
    Route::post('/', [MinorApproachController::class, 'store'])->middleware('permission.api:minor_approaches.create');
    Route::get('/{approach}', [MinorApproachController::class, 'show'])->middleware('permission.api:minor_approaches.read');
    Route::put('/{approach}', [MinorApproachController::class, 'update'])->middleware('permission.api:minor_approaches.update');
    Route::patch('/{approach}', [MinorApproachController::class, 'update'])->middleware('permission.api:minor_approaches.update');
    Route::delete('/{approach}', [MinorApproachController::class, 'destroy'])->middleware('permission.api:minor_approaches.delete');
});

Route::middleware(['auth:sanctum', 'minors.api', 'audit.api'])->prefix('journals')->group(function (): void {
    Route::get('/', [MinorJournalController::class, 'index'])->middleware('permission.api:minor_journals.read');
    Route::get('/summary', [MinorJournalController::class, 'summary'])->middleware('permission.api:minor_journals.read');
    Route::post('/', [MinorJournalController::class, 'store'])->middleware('permission.api:minor_journals.create');
    Route::get('/{journal}', [MinorJournalController::class, 'show'])->middleware('permission.api:minor_journals.read');
    Route::put('/{journal}', [MinorJournalController::class, 'update'])->middleware('permission.api:minor_journals.update');
    Route::patch('/{journal}', [MinorJournalController::class, 'update'])->middleware('permission.api:minor_journals.update');
    Route::delete('/{journal}', [MinorJournalController::class, 'destroy'])->middleware('permission.api:minor_journals.delete');
});

Route::middleware(['auth:sanctum', 'audit.api'])->prefix('staff-shifts')->group(function (): void {
    Route::get('/my-week', [StaffShiftAssignmentController::class, 'myWeek'])->middleware('permission.api:staff_shift_assignments.read');
});

Route::middleware(['auth:sanctum', 'audit.api'])->prefix('staff')->group(function (): void {
    Route::get('/attendance-events', [StaffAttendanceEventController::class, 'index'])->middleware('permission.api:staff_attendance_events.read');
    Route::get('/attendance-events/today', [StaffAttendanceEventController::class, 'today'])->middleware('permission.api:staff_attendance_events.read');
    Route::post('/attendance-events', [StaffAttendanceEventController::class, 'store'])->middleware('permission.api:staff_attendance_events.create');
    Route::get('/timesheets/me', [StaffTimesheetController::class, 'me'])->middleware('permission.api:staff_timesheet_entries.read');
    Route::post('/timesheets/{timesheetEntry}/submit', [StaffTimesheetController::class, 'submit'])->middleware('permission.api:staff_timesheet_entries.submit');
});

Route::middleware(['auth:sanctum', 'minors.api', 'audit.api'])->prefix('internal-messages')->group(function (): void {
    Route::get('/threads', [InternalMessageController::class, 'index'])->middleware('permission.api:internal_messages.read');
    Route::get('/options/participants', [InternalMessageController::class, 'participantOptions'])->middleware('permission.api:internal_messages.read');
    Route::post('/threads', [InternalMessageController::class, 'store'])->middleware('permission.api:internal_messages.create,request:facility_id');
    Route::get('/threads/{thread}', [InternalMessageController::class, 'show'])->middleware('permission.api:internal_messages.read');
    Route::post('/threads/{thread}/messages', [InternalMessageController::class, 'addMessage'])->middleware('permission.api:internal_messages.update');
    Route::post('/threads/{thread}/mark-read', [InternalMessageController::class, 'markRead'])->middleware('permission.api:internal_messages.read');
});
