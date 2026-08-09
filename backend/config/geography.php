<?php

return [
    'storage_disk' => env('GEOGRAPHY_SOURCE_DISK', 'local'),

    'sources' => [
        'geonames' => [
            'countries_url' => env('GEOGRAPHY_GEONAMES_COUNTRIES_URL', 'https://download.geonames.org/export/dump/countryInfo.txt'),
            'admin1_url' => env('GEOGRAPHY_GEONAMES_ADMIN1_URL', 'https://download.geonames.org/export/dump/admin1CodesASCII.txt'),
            'admin2_url' => env('GEOGRAPHY_GEONAMES_ADMIN2_URL', 'https://download.geonames.org/export/dump/admin2Codes.txt'),
            'country_dump_url_template' => env('GEOGRAPHY_GEONAMES_COUNTRY_DUMP_URL_TEMPLATE', 'https://download.geonames.org/export/dump/{ISO}.zip'),
        ],
        'istat' => [
            'delimiter' => env('GEOGRAPHY_ISTAT_DELIMITER', ';'),
        ],
        'anpr_history' => [
            'delimiter' => env('GEOGRAPHY_ANPR_HISTORY_DELIMITER', ';'),
        ],
    ],
];
