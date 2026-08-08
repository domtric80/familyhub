<?php

namespace App\Providers;

use App\Services\StorageConfigService;
use App\Services\SystemHealthService;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        app(StorageConfigService::class)->applyRuntimeConfiguration();

        Queue::before(function (): void {
            app(SystemHealthService::class)->markWorkerHeartbeat();
        });
    }
}
