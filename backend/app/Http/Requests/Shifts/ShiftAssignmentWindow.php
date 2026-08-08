<?php

namespace App\Http\Requests\Shifts;

use App\Models\StaffShiftTemplate;
use Carbon\CarbonImmutable;

class ShiftAssignmentWindow
{
    public static function fromTemplate(StaffShiftTemplate $template, string $shiftDate): array
    {
        $startsAt = CarbonImmutable::parse($shiftDate.' '.$template->start_time);
        $endsAt = CarbonImmutable::parse($shiftDate.' '.$template->end_time);

        if ($endsAt->lessThanOrEqualTo($startsAt)) {
            $endsAt = $endsAt->addDay();
        }

        return [$startsAt, $endsAt];
    }
}
