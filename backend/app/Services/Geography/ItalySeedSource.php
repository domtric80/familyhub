<?php

namespace App\Services\Geography;

class ItalySeedSource
{
    public function dataset(): array
    {
        return [
            'country' => [
                'iso_code' => 'IT',
                'name' => 'Italia',
                'source_record_key' => 'IT',
            ],
            'regions' => [
                [
                    'code' => 'LAZ',
                    'name' => 'Lazio',
                    'source_record_key' => 'IT-LAZ',
                    'source_parent_key' => 'IT',
                    'provinces' => [
                        [
                            'code' => 'RM',
                            'name' => 'Roma',
                            'vehicle_code' => 'RM',
                            'source_record_key' => 'IT-LAZ-RM',
                            'source_parent_key' => 'IT-LAZ',
                            'cities' => [
                                ['name' => 'Roma', 'cadastre_code' => 'H501', 'postal_code' => '00100', 'source_record_key' => 'IT-LAZ-RM-ROMA'],
                                ['name' => 'Fiumicino', 'cadastre_code' => 'M297', 'postal_code' => '00054', 'source_record_key' => 'IT-LAZ-RM-FIUMICINO'],
                            ],
                        ],
                        [
                            'code' => 'LT',
                            'name' => 'Latina',
                            'vehicle_code' => 'LT',
                            'source_record_key' => 'IT-LAZ-LT',
                            'source_parent_key' => 'IT-LAZ',
                            'cities' => [
                                ['name' => 'Latina', 'cadastre_code' => 'E472', 'postal_code' => '04100', 'source_record_key' => 'IT-LAZ-LT-LATINA'],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'CAM',
                    'name' => 'Campania',
                    'source_record_key' => 'IT-CAM',
                    'source_parent_key' => 'IT',
                    'provinces' => [
                        [
                            'code' => 'NA',
                            'name' => 'Napoli',
                            'vehicle_code' => 'NA',
                            'source_record_key' => 'IT-CAM-NA',
                            'source_parent_key' => 'IT-CAM',
                            'cities' => [
                                ['name' => 'Napoli', 'cadastre_code' => 'F839', 'postal_code' => '80100', 'source_record_key' => 'IT-CAM-NA-NAPOLI'],
                                ['name' => 'Pozzuoli', 'cadastre_code' => 'G964', 'postal_code' => '80078', 'source_record_key' => 'IT-CAM-NA-POZZUOLI'],
                            ],
                        ],
                        [
                            'code' => 'SA',
                            'name' => 'Salerno',
                            'vehicle_code' => 'SA',
                            'source_record_key' => 'IT-CAM-SA',
                            'source_parent_key' => 'IT-CAM',
                            'cities' => [
                                ['name' => 'Salerno', 'cadastre_code' => 'H703', 'postal_code' => '84100', 'source_record_key' => 'IT-CAM-SA-SALERNO'],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'PUG',
                    'name' => 'Puglia',
                    'source_record_key' => 'IT-PUG',
                    'source_parent_key' => 'IT',
                    'provinces' => [
                        [
                            'code' => 'BA',
                            'name' => 'Bari',
                            'vehicle_code' => 'BA',
                            'source_record_key' => 'IT-PUG-BA',
                            'source_parent_key' => 'IT-PUG',
                            'cities' => [
                                ['name' => 'Bari', 'cadastre_code' => 'A662', 'postal_code' => '70100', 'source_record_key' => 'IT-PUG-BA-BARI'],
                            ],
                        ],
                        [
                            'code' => 'TA',
                            'name' => 'Taranto',
                            'vehicle_code' => 'TA',
                            'source_record_key' => 'IT-PUG-TA',
                            'source_parent_key' => 'IT-PUG',
                            'cities' => [
                                ['name' => 'Taranto', 'cadastre_code' => 'L049', 'postal_code' => '74100', 'source_record_key' => 'IT-PUG-TA-TARANTO'],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}
