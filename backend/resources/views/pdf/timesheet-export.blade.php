<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1f2937;
        }
        .header {
            margin-bottom: 18px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
        }
        .meta {
            font-size: 10px;
            color: #4b5563;
            margin-bottom: 2px;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border: 1px solid #c7d2fe;
            border-radius: 10px;
            color: #4338ca;
            background: #eef2ff;
            font-size: 9px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        th, td {
            border: 1px solid #d1d5db;
            padding: 5px 6px;
            vertical-align: top;
            word-wrap: break-word;
        }
        th {
            background: #f3f4f6;
            text-align: left;
            font-size: 9px;
        }
        td {
            font-size: 9px;
        }
        .footer {
            margin-top: 12px;
            font-size: 9px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">{{ $title }}</div>
        <div class="meta">Struttura: {{ $facilityName }}</div>
        <div class="meta">Periodo: {{ $periodLabel }}</div>
        <div class="meta">Generato il: {{ $generatedAt }}</div>
        <div class="meta">Righe esportate: {{ $entriesCount }}</div>
        <div class="meta"><span class="badge">Preset {{ $presetLabel }}</span></div>
    </div>

    <table>
        <thead>
            <tr>
                @foreach($headers as $header)
                    <th>{{ str_replace('_', ' ', $header) }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr>
                    @foreach($row as $cell)
                        <td>{{ $cell === null || $cell === '' ? '—' : $cell }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Il report include solo entry timesheet in stato approvato o bloccato.
    </div>
</body>
</html>
