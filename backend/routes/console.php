<?php

use Illuminate\Foundation\Inspiring;
use App\Services\SystemHealthService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('familyhub:geo-sync --source=geonames --dry-run')
    ->dailyAt('02:15')
    ->description('Verifica giornaliera dei dataset geografici GeoNames in dry-run.');

Schedule::call(function (): void {
    app(SystemHealthService::class)->markSchedulerHeartbeat();
})
    ->name('familyhub:system-health-scheduler-heartbeat')
    ->everyMinute();
