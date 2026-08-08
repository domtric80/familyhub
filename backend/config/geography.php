<?php

return [
    'storage_disk' => env('GEOGRAPHY_SOURCE_DISK', 'local'),

    'sources' => [
        'geonames' => [
            'countries_url' => env('GEOGRAPHY_GEONAMES_COUNTRIES_URL', 'https://download.geonames.org/export/dump/countryInfo.txt'),
        ],
        'istat' => [
            'delimiter' => env('GEOGRAPHY_ISTAT_DELIMITER', ';'),
        ],
        'anpr_history' => [
            'delimiter' => env('GEOGRAPHY_ANPR_HISTORY_DELIMITER', ';'),
        ],
    ],
];
