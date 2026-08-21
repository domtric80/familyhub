<?php

namespace Tests\Unit;

use App\Services\SystemHealthService;
use Illuminate\Support\Facades\Redis;
use Mockery;
use ReflectionMethod;
use Tests\TestCase;

class SystemHealthServiceTest extends TestCase
{
    public function test_phpredis_boolean_ping_is_reported_as_healthy(): void
    {
        $connection = Mockery::mock();
        $connection->shouldReceive('command')
            ->once()
            ->with('PING')
            ->andReturn(true);

        Redis::shouldReceive('connection')
            ->once()
            ->andReturn($connection);

        $result = $this->invokePrivateMethod(app(SystemHealthService::class), 'redisCheck');

        $this->assertSame('ok', $result['status']);
        $this->assertSame('PONG', $result['meta']['response']);
    }

    public function test_non_clamav_driver_is_reported_as_not_applicable(): void
    {
        config(['document_security.scan.driver' => 'fake-clean']);

        $result = $this->invokePrivateMethod(app(SystemHealthService::class), 'antivirusCheck');

        $this->assertSame('not_configured', $result['status']);
        $this->assertSame('fake-clean', $result['meta']['driver']);
    }

    private function invokePrivateMethod(object $target, string $method): array
    {
        $reflection = new ReflectionMethod($target, $method);

        return $reflection->invoke($target);
    }
}
