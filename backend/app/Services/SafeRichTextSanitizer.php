<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMNode;

class SafeRichTextSanitizer
{
    private const ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'a',
    ];

    private const DROP_WITH_CONTENT = [
        'script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form',
        'input', 'button', 'textarea', 'select', 'option', 'meta', 'link', 'base',
    ];

    public function sanitize(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        $document = new DOMDocument('1.0', 'UTF-8');
        $previousUseErrors = libxml_use_internal_errors(true);

        try {
            $loaded = $document->loadHTML(
                '<?xml encoding="UTF-8"><div id="familyhub-rich-text-root">'.$html.'</div>',
                LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET
            );

            if (! $loaded) {
                return htmlspecialchars($html, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            }

            $root = $document->getElementById('familyhub-rich-text-root');
            if (! $root) {
                return htmlspecialchars($html, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            }

            $this->sanitizeChildren($root);

            $output = '';
            foreach ($root->childNodes as $child) {
                $output .= $document->saveHTML($child);
            }

            return $output;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousUseErrors);
        }
    }

    private function sanitizeChildren(DOMNode $parent): void
    {
        foreach (iterator_to_array($parent->childNodes) as $child) {
            if (! $child instanceof DOMElement) {
                if ($child->nodeType === XML_COMMENT_NODE) {
                    $parent->removeChild($child);
                }

                continue;
            }

            $tagName = strtolower($child->tagName);

            if (in_array($tagName, self::DROP_WITH_CONTENT, true)) {
                $parent->removeChild($child);

                continue;
            }

            $this->sanitizeChildren($child);

            if (! in_array($tagName, self::ALLOWED_TAGS, true)) {
                while ($child->firstChild) {
                    $parent->insertBefore($child->firstChild, $child);
                }
                $parent->removeChild($child);

                continue;
            }

            $this->sanitizeAttributes($child, $tagName);
        }
    }

    private function sanitizeAttributes(DOMElement $element, string $tagName): void
    {
        $href = $tagName === 'a' ? $element->getAttribute('href') : '';

        foreach (iterator_to_array($element->attributes) as $attribute) {
            $element->removeAttributeNode($attribute);
        }

        if ($tagName !== 'a' || ! $this->isSafeLink($href)) {
            return;
        }

        $element->setAttribute('href', trim($href));
        $element->setAttribute('rel', 'nofollow noopener noreferrer');
    }

    private function isSafeLink(string $href): bool
    {
        $decoded = html_entity_decode(trim($href), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return preg_match('/^(?:https?:\/\/|mailto:)/i', $decoded) === 1;
    }
}
