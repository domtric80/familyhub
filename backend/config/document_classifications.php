<?php

return [
    [
        'code' => 'internal',
        'name' => 'Interno',
        'description' => 'Documento operativo interno non destinato a diffusione esterna.',
        'allowed_roles' => ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA', 'PSICOLOGO', 'EDUCATORE', 'EDUCATORE_NOTTURNO', 'ASSISTENTE_SOCIALE_EST'],
        'allowed_download_roles' => ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA', 'PSICOLOGO'],
    ],
    [
        'code' => 'restricted',
        'name' => 'Riservato',
        'description' => 'Documento sensibile con accesso limitato ai ruoli autorizzati.',
        'allowed_roles' => ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA', 'PSICOLOGO'],
        'allowed_download_roles' => ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE', 'REFERENTE_STRUTTURA', 'PSICOLOGO'],
    ],
    [
        'code' => 'clinical',
        'name' => 'Clinico',
        'description' => 'Documento clinico o psicologico con accesso strettamente controllato.',
        'allowed_roles' => ['SUPER_ADMIN', 'DIRETTORE', 'PSICOLOGO', 'PEDIATRA'],
        'allowed_download_roles' => ['SUPER_ADMIN', 'DIRETTORE', 'PSICOLOGO', 'PEDIATRA'],
    ],
    [
        'code' => 'judicial',
        'name' => 'Giudiziario',
        'description' => 'Documento giudiziario o provvedimento con accesso altamente ristretto.',
        'allowed_roles' => ['SUPER_ADMIN', 'DIRETTORE'],
        'allowed_download_roles' => ['SUPER_ADMIN', 'DIRETTORE'],
    ],
];
