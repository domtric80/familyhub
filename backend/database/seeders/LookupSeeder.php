<?php

namespace Database\Seeders;

use App\Models\ContactType;
use App\Models\DocumentClassification;
use App\Models\DocumentScope;
use App\Models\DocumentIssuer;
use App\Models\DocumentType;
use App\Models\ExitType;
use App\Models\FacilityStatus;
use App\Models\JournalEntryType;
use App\Models\ActivityType;
use App\Models\ApproachType;
use App\Models\StaffQualification;
use App\Models\StaffDocumentStatus;
use App\Models\StaffStatus;
use Illuminate\Database\Seeder;

class LookupSeeder extends Seeder
{
    public function run(): void
    {
        $documentScopes = [
            ['code' => 'minor', 'name' => 'Minore', 'description' => 'Documenti riferiti al minore.', 'is_active' => true],
            ['code' => 'staff', 'name' => 'Operatore', 'description' => 'Documenti riferiti al personale.', 'is_active' => true],
        ];

        foreach ($documentScopes as $documentScope) {
            DocumentScope::query()->updateOrCreate(
                ['code' => $documentScope['code']],
                $documentScope,
            );
        }

        $documentTypes = [
            ['code' => 'MINOR_ID', 'name' => 'Documento identità minore', 'scope' => 'minor'],
            ['code' => 'MINOR_TAX_CODE', 'name' => 'Codice fiscale minore', 'scope' => 'minor'],
            ['code' => 'COURT_ORDER', 'name' => 'Provvedimento giudiziario', 'scope' => 'minor'],
            ['code' => 'MEDICAL_REPORT', 'name' => 'Referto medico', 'scope' => 'minor'],
            ['code' => 'EMPLOYMENT_CONTRACT', 'name' => 'Contratto personale', 'scope' => 'staff'],
            ['code' => 'CRIMINAL_RECORD', 'name' => 'Certificato penale', 'scope' => 'staff'],
            ['code' => 'GDPR_TRAINING', 'name' => 'Formazione GDPR', 'scope' => 'staff'],
            ['code' => 'FIRST_AID_CERT', 'name' => 'Certificazione primo soccorso', 'scope' => 'staff'],
        ];

        foreach ($documentTypes as $documentType) {
            DocumentType::query()->updateOrCreate(
                ['code' => $documentType['code']],
                $documentType,
            );
        }

        $documentClassifications = [
            ['code' => 'internal', 'name' => 'Interno', 'description' => 'Documento operativo interno non destinato a diffusione esterna.', 'allowed_role_codes' => ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'PSICOLOGO', 'EDUCATORE', 'EDUCATORE_NOTTURNO', 'ASSISTENTE_SOCIALE_EST'], 'is_active' => true],
            ['code' => 'restricted', 'name' => 'Riservato', 'description' => 'Documento sensibile con accesso limitato ai ruoli autorizzati.', 'allowed_role_codes' => ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'PSICOLOGO'], 'is_active' => true],
            ['code' => 'clinical', 'name' => 'Clinico', 'description' => 'Documento clinico o psicologico con accesso strettamente controllato.', 'allowed_role_codes' => ['SUPER_ADMIN', 'DIRETTORE', 'PSICOLOGO', 'PEDIATRA'], 'is_active' => true],
            ['code' => 'judicial', 'name' => 'Giudiziario', 'description' => 'Documento giudiziario o provvedimento con accesso altamente ristretto.', 'allowed_role_codes' => ['SUPER_ADMIN', 'DIRETTORE'], 'is_active' => true],
        ];

        foreach ($documentClassifications as $documentClassification) {
            DocumentClassification::query()->updateOrCreate(
                ['code' => $documentClassification['code']],
                $documentClassification,
            );
        }

        $documentIssuers = [
            ['code' => 'COMUNE', 'name' => 'Comune', 'description' => 'Comune o ufficio anagrafe.', 'sort_order' => 10, 'is_active' => true],
            ['code' => 'QUESTURA', 'name' => 'Questura', 'description' => 'Questura o ufficio passaporti.', 'sort_order' => 20, 'is_active' => true],
            ['code' => 'TRIBUNALE', 'name' => 'Tribunale per i minorenni', 'description' => 'Autorità giudiziaria minorile.', 'sort_order' => 30, 'is_active' => true],
            ['code' => 'ASL', 'name' => 'ASL / Azienda sanitaria', 'description' => 'Ente sanitario territoriale.', 'sort_order' => 40, 'is_active' => true],
            ['code' => 'SCUOLA', 'name' => 'Scuola / Istituto', 'description' => 'Istituto scolastico.', 'sort_order' => 50, 'is_active' => true],
            ['code' => 'ALTRO_ENTE', 'name' => 'Altro ente', 'description' => 'Ente esterno generico.', 'sort_order' => 60, 'is_active' => true],
        ];

        foreach ($documentIssuers as $documentIssuer) {
            DocumentIssuer::query()->updateOrCreate(
                ['code' => $documentIssuer['code']],
                $documentIssuer,
            );
        }

        $contactTypes = [
            ['code' => 'TUTOR', 'name' => 'Tutore'],
            ['code' => 'FAMILY_MEMBER', 'name' => 'Familiare'],
            ['code' => 'SOCIAL_WORKER', 'name' => 'Assistente sociale'],
            ['code' => 'PSYCHOLOGIST', 'name' => 'Psicologo'],
            ['code' => 'DOCTOR', 'name' => 'Medico'],
            ['code' => 'LAWYER', 'name' => 'Avvocato'],
            ['code' => 'SCHOOL_CONTACT', 'name' => 'Contatto scolastico'],
        ];

        foreach ($contactTypes as $contactType) {
            ContactType::query()->updateOrCreate(
                ['code' => $contactType['code']],
                $contactType,
            );
        }

        $exitTypes = [
            ['code' => 'FAMILY', 'name' => 'Familiare', 'sort_order' => 10, 'is_active' => true],
            ['code' => 'SCHOOL', 'name' => 'Scolastica', 'sort_order' => 20, 'is_active' => true],
            ['code' => 'MEDICAL', 'name' => 'Sanitaria', 'sort_order' => 30, 'is_active' => true],
            ['code' => 'RECREATIONAL', 'name' => 'Ricreativa', 'sort_order' => 40, 'is_active' => true],
            ['code' => 'ADMIN', 'name' => 'Amministrativa', 'sort_order' => 50, 'is_active' => true],
        ];

        foreach ($exitTypes as $exitType) {
            ExitType::query()->updateOrCreate(
                ['code' => $exitType['code']],
                $exitType,
            );
        }

        $activityTypes = [
            ['code' => 'LAB', 'name' => 'Laboratorio', 'description' => 'Attività laboratoriale educativa o creativa.', 'sort_order' => 10, 'is_active' => true],
            ['code' => 'SPORT', 'name' => 'Sport', 'description' => 'Attività motoria o sportiva.', 'sort_order' => 20, 'is_active' => true],
            ['code' => 'THERAPY', 'name' => 'Terapia', 'description' => 'Attività terapeutica o supporto specialistico.', 'sort_order' => 30, 'is_active' => true],
            ['code' => 'SCHOOL_SUPPORT', 'name' => 'Supporto scolastico', 'description' => 'Studio assistito o recupero scolastico.', 'sort_order' => 40, 'is_active' => true],
            ['code' => 'CULTURE', 'name' => 'Culturale', 'description' => 'Attività culturale, artistica o ricreativa esterna.', 'sort_order' => 50, 'is_active' => true],
        ];

        foreach ($activityTypes as $activityType) {
            ActivityType::query()->updateOrCreate(
                ['code' => $activityType['code']],
                $activityType,
            );
        }

        $approachTypes = [
            ['code' => 'FAMILY_VISIT', 'name' => 'Avvicinamento familiare', 'description' => 'Incontro finalizzato al rafforzamento o ripresa della relazione familiare.', 'sort_order' => 10, 'is_active' => true],
            ['code' => 'FACILITY_VISIT', 'name' => 'Visita in struttura', 'description' => 'Visita svolta all’interno della struttura con familiari, affidatari o figure autorizzate.', 'sort_order' => 11, 'is_active' => true],
            ['code' => 'AUTHORIZED_EXIT', 'name' => 'Uscita autorizzata', 'description' => 'Uscita del minore collegata al percorso di avvicinamento con soggetti autorizzati.', 'sort_order' => 12, 'is_active' => true],
            ['code' => 'PHONE_CALL', 'name' => 'Telefonata', 'description' => 'Contatto telefonico del minore con famiglia, affidatari o altre figure autorizzate.', 'sort_order' => 13, 'is_active' => true],
            ['code' => 'VIDEO_CALL', 'name' => 'Videochiamata', 'description' => 'Contatto in videochiamata con famiglia, affidatari o altre figure autorizzate.', 'sort_order' => 14, 'is_active' => true],
            ['code' => 'LETTER', 'name' => 'Lettera / comunicazione scritta', 'description' => 'Scambio scritto rilevante nel percorso di avvicinamento.', 'sort_order' => 15, 'is_active' => true],
            ['code' => 'TUTOR_MEETING', 'name' => 'Incontro con tutore', 'description' => 'Colloquio o incontro con tutore o referente legale.', 'sort_order' => 20, 'is_active' => true],
            ['code' => 'PROTECTED_MEETING', 'name' => 'Incontro protetto', 'description' => 'Incontro protetto o osservato con soggetti autorizzati.', 'sort_order' => 30, 'is_active' => true],
            ['code' => 'REINTEGRATION_STEP', 'name' => 'Step reintegrazione', 'description' => 'Tappa operativa del percorso di reinserimento o riavvicinamento.', 'sort_order' => 40, 'is_active' => true],
        ];

        foreach ($approachTypes as $approachType) {
            ApproachType::query()->updateOrCreate(
                ['code' => $approachType['code']],
                $approachType,
            );
        }

        $journalEntryTypes = [
            ['code' => 'OBSERVATION', 'name' => 'Osservazione educativa', 'description' => 'Osservazione ordinaria sul comportamento o andamento del minore.', 'sort_order' => 10, 'is_active' => true],
            ['code' => 'EVENT', 'name' => 'Evento rilevante', 'description' => 'Evento importante da storicizzare nel diario.', 'sort_order' => 20, 'is_active' => true],
            ['code' => 'FAMILY_FEEDBACK', 'name' => 'Feedback familiare', 'description' => 'Esito o nota a seguito di scambio con famiglia o tutore.', 'sort_order' => 30, 'is_active' => true],
            ['code' => 'SCHOOL_UPDATE', 'name' => 'Aggiornamento scolastico', 'description' => 'Nota relativa al percorso scolastico.', 'sort_order' => 40, 'is_active' => true],
        ];

        foreach ($journalEntryTypes as $journalEntryType) {
            JournalEntryType::query()->updateOrCreate(
                ['code' => $journalEntryType['code']],
                $journalEntryType,
            );
        }

        $staffQualifications = [
            ['code' => 'EDUCATORE', 'name' => 'Educatore', 'description' => 'Figura educativa diurna.', 'sort_order' => 10, 'is_active' => true],
            ['code' => 'EDUCATORE_NOTTURNO', 'name' => 'Educatore notturno', 'description' => 'Figura educativa per copertura notturna.', 'sort_order' => 20, 'is_active' => true],
            ['code' => 'COORDINATORE', 'name' => 'Coordinatore', 'description' => 'Coordinamento operativo di struttura.', 'sort_order' => 30, 'is_active' => true],
            ['code' => 'PSICOLOGO', 'name' => 'Psicologo', 'description' => 'Professionista psicologico.', 'sort_order' => 40, 'is_active' => true],
            ['code' => 'MEDICO_BASE', 'name' => 'Medico di base', 'description' => 'Professionista sanitario di medicina generale.', 'sort_order' => 45, 'is_active' => true],
            ['code' => 'PEDIATRA', 'name' => 'Pediatra', 'description' => 'Professionista sanitario pediatrico.', 'sort_order' => 50, 'is_active' => true],
            ['code' => 'ASSISTENTE_SOCIALE', 'name' => 'Assistente sociale', 'description' => 'Professionista sociale interno o esterno.', 'sort_order' => 60, 'is_active' => true],
            ['code' => 'MEDIATORE_CULTURALE', 'name' => 'Mediatore culturale', 'description' => 'Mediazione linguistica e culturale.', 'sort_order' => 70, 'is_active' => true],
        ];

        foreach ($staffQualifications as $staffQualification) {
            StaffQualification::query()->updateOrCreate(
                ['code' => $staffQualification['code']],
                $staffQualification,
            );
        }

        $staffStatuses = [
            ['code' => 'ACTIVE', 'name' => 'Attivo', 'description' => 'Operatore attivo in struttura.', 'sort_order' => 10, 'is_active' => true],
            ['code' => 'SUSPENDED', 'name' => 'Sospeso', 'description' => 'Operatore temporaneamente sospeso.', 'sort_order' => 20, 'is_active' => true],
            ['code' => 'INACTIVE', 'name' => 'Non attivo', 'description' => 'Operatore non attivo.', 'sort_order' => 30, 'is_active' => true],
            ['code' => 'TERMINATED', 'name' => 'Cessato', 'description' => 'Rapporto cessato.', 'sort_order' => 40, 'is_active' => true],
        ];

        foreach ($staffStatuses as $staffStatus) {
            StaffStatus::query()->updateOrCreate(
                ['code' => $staffStatus['code']],
                $staffStatus,
            );
        }

        $facilityStatuses = [
            ['code' => 'ACTIVE', 'name' => 'Attiva', 'description' => 'Struttura operativa e utilizzabile.', 'sort_order' => 10, 'is_active' => true],
            ['code' => 'SUSPENDED', 'name' => 'Sospesa', 'description' => 'Struttura temporaneamente sospesa.', 'sort_order' => 20, 'is_active' => true],
            ['code' => 'INACTIVE', 'name' => 'Non attiva', 'description' => 'Struttura non attiva.', 'sort_order' => 30, 'is_active' => true],
            ['code' => 'CLOSED', 'name' => 'Chiusa', 'description' => 'Struttura chiusa o dismessa.', 'sort_order' => 40, 'is_active' => true],
        ];

        foreach ($facilityStatuses as $facilityStatus) {
            FacilityStatus::query()->updateOrCreate(
                ['code' => $facilityStatus['code']],
                $facilityStatus,
            );
        }

        $staffDocumentStatuses = [
            ['code' => 'VALID', 'name' => 'Valido', 'description' => 'Documento valido e utilizzabile.', 'sort_order' => 10, 'is_active' => true],
            ['code' => 'EXPIRED', 'name' => 'Scaduto', 'description' => 'Documento scaduto.', 'sort_order' => 20, 'is_active' => true],
            ['code' => 'REVOKED', 'name' => 'Revocato', 'description' => 'Documento revocato o non più valido.', 'sort_order' => 30, 'is_active' => true],
            ['code' => 'PENDING_RENEWAL', 'name' => 'In rinnovo', 'description' => 'Documento in fase di rinnovo.', 'sort_order' => 40, 'is_active' => true],
        ];

        foreach ($staffDocumentStatuses as $staffDocumentStatus) {
            StaffDocumentStatus::query()->updateOrCreate(
                ['code' => $staffDocumentStatus['code']],
                $staffDocumentStatus,
            );
        }
    }
}
