<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Country;
use App\Models\Province;
use App\Models\Region;
use Illuminate\Database\Seeder;

class GeographySeeder extends Seeder
{
    public function run(): void
    {
        $italy = Country::query()->updateOrCreate(
            ['iso_code' => 'IT'],
            ['name' => 'Italia'],
        );

        $regions = [
            'LAZ' => ['name' => 'Lazio', 'provinces' => [
                'RM' => ['name' => 'Roma', 'cities' => [
                    ['name' => 'Roma', 'cadastre_code' => 'H501', 'postal_code' => '00100'],
                    ['name' => 'Fiumicino', 'cadastre_code' => 'M297', 'postal_code' => '00054'],
                ]],
                'LT' => ['name' => 'Latina', 'cities' => [
                    ['name' => 'Latina', 'cadastre_code' => 'E472', 'postal_code' => '04100'],
                ]],
            ]],
            'CAM' => ['name' => 'Campania', 'provinces' => [
                'NA' => ['name' => 'Napoli', 'cities' => [
                    ['name' => 'Napoli', 'cadastre_code' => 'F839', 'postal_code' => '80100'],
                    ['name' => 'Pozzuoli', 'cadastre_code' => 'G964', 'postal_code' => '80078'],
                ]],
                'SA' => ['name' => 'Salerno', 'cities' => [
                    ['name' => 'Salerno', 'cadastre_code' => 'H703', 'postal_code' => '84100'],
                ]],
            ]],
            'PUG' => ['name' => 'Puglia', 'provinces' => [
                'BA' => ['name' => 'Bari', 'cities' => [
                    ['name' => 'Bari', 'cadastre_code' => 'A662', 'postal_code' => '70100'],
                ]],
                'TA' => ['name' => 'Taranto', 'cities' => [
                    ['name' => 'Taranto', 'cadastre_code' => 'L049', 'postal_code' => '74100'],
                ]],
            ]],
        ];

        foreach ($regions as $regionCode => $regionData) {
            $region = Region::query()->updateOrCreate(
                ['country_id' => $italy->id, 'code' => $regionCode],
                ['name' => $regionData['name']],
            );

            foreach ($regionData['provinces'] as $provinceCode => $provinceData) {
                $province = Province::query()->updateOrCreate(
                    ['region_id' => $region->id, 'code' => $provinceCode],
                    ['name' => $provinceData['name']],
                );

                foreach ($provinceData['cities'] as $cityData) {
                    City::query()->updateOrCreate(
                        ['province_id' => $province->id, 'name' => $cityData['name']],
                        [
                            'cadastre_code' => $cityData['cadastre_code'],
                            'postal_code' => $cityData['postal_code'],
                        ],
                    );
                }
            }
        }
    }
}
