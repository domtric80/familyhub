<?php

namespace Tests\Unit;

use App\Services\SafeRichTextSanitizer;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class SafeRichTextSanitizerTest extends TestCase
{
    #[DataProvider('unsafePayloads')]
    public function test_it_removes_unsafe_html(string $payload): void
    {
        $sanitized = (new SafeRichTextSanitizer)->sanitize($payload);

        $this->assertIsString($sanitized);
        $this->assertDoesNotMatchRegularExpression('/<\/?(?:script|svg|math|iframe|object|embed|style)\b/i', $sanitized);
        $this->assertDoesNotMatchRegularExpression('/\son[a-z]+\s*=/i', $sanitized);
        $this->assertDoesNotMatchRegularExpression('/javascript\s*:/i', $sanitized);
    }

    public function test_it_preserves_only_the_supported_formatting_allowlist(): void
    {
        $sanitized = (new SafeRichTextSanitizer)->sanitize(
            '<h2 style="color:red">Titolo</h2><p><strong>Testo</strong> <a href="https://example.org" onclick="alert(1)">link</a></p><div>coda</div>'
        );

        $this->assertSame(
            '<h2>Titolo</h2><p><strong>Testo</strong> <a href="https://example.org" rel="nofollow noopener noreferrer">link</a></p>coda',
            $sanitized
        );
    }

    public function test_it_removes_unsafe_link_protocols(): void
    {
        $sanitized = (new SafeRichTextSanitizer)->sanitize(
            '<a href="javascript:alert(1)">uno</a><a href="data:text/html,test">due</a><a href="mailto:test@example.org">tre</a>'
        );

        $this->assertSame(
            '<a>uno</a><a>due</a><a href="mailto:test@example.org" rel="nofollow noopener noreferrer">tre</a>',
            $sanitized
        );
    }

    public static function unsafePayloads(): array
    {
        return [
            'script close spacing' => ['<p>ok</p><script>alert(1)</script >'],
            'single quoted handler' => ["<p onclick='alert(1)'>ok</p>"],
            'unquoted handler' => ['<p onmouseover=alert(1)>ok</p>'],
            'javascript link' => ['<a href="javascript:alert(1)">click</a>'],
            'svg payload' => ['<svg><a xlink:href="javascript:alert(1)"><text>click</text></a></svg>'],
            'math payload' => ['<math><mtext><img src=x onerror=alert(1)></mtext></math>'],
        ];
    }
}
