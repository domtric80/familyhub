<?php

namespace App\Services;

use App\Models\StaffAttendanceEvent;
use App\Models\StaffShiftAssignment;
use App\Models\StaffTimesheetAdjustment;
use App\Models\StaffTimesheetEntry;
use App\Models\StaffTimesheetMonthLock;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class StaffTimesheetService
{
    private const MIN_REST_MINUTES = 660; // 11h
    private const MAX_DAILY_WORK_MINUTES = 720; // 12h
    private const WEEKLY_WORK_THRESHOLD_MINUTES = 2880; // 48h

    public function isMonthLocked(int $facilityId, string $workDate): bool
    {
        $date = Carbon::parse($workDate);

        return StaffTimesheetMonthLock::query()
            ->where('facility_id', $facilityId)
            ->where('year', (int) $date->format('Y'))
            ->where('month', (int) $date->format('m'))
            ->whereNotNull('locked_at')
            ->whereNull('unlocked_at')
            ->exists();
    }

    public function abortIfMonthLocked(int $facilityId, string $workDate, string $message): void
    {
        abort_if($this->isMonthLocked($facilityId, $workDate), 422, $message);
    }

    public function resolveWorkDate(
        int $facilityId,
        int $staffMemberId,
        ?StaffShiftAssignment $assignment,
        string $eventType,
        Carbon $occurredAt,
    ): string {
        if ($assignment) {
            return $assignment->shift_date->toDateString();
        }

        $openEntry = StaffTimesheetEntry::query()
            ->where('facility_id', $facilityId)
            ->where('staff_member_id', $staffMemberId)
            ->whereIn('status', [StaffTimesheetEntry::STATUS_DRAFT, StaffTimesheetEntry::STATUS_COMPUTED, StaffTimesheetEntry::STATUS_SUBMITTED])
            ->whereNull('actual_ends_at')
            ->whereBetween('work_date', [$occurredAt->copy()->subDay()->toDateString(), $occurredAt->toDateString()])
            ->orderByDesc('work_date')
            ->orderByDesc('id')
            ->first();

        if ($openEntry && in_array($eventType, [
            StaffAttendanceEvent::TYPE_CLOCK_OUT,
            StaffAttendanceEvent::TYPE_BREAK_END,
            StaffAttendanceEvent::TYPE_MANUAL_ADJUSTMENT,
        ], true)) {
            return $openEntry->work_date->toDateString();
        }

        return $occurredAt->toDateString();
    }

    public function recomputeForWorkDate(
        int $facilityId,
        int $staffMemberId,
        string $workDate,
        ?int $shiftAssignmentId = null,
    ): StaffTimesheetEntry {
        $assignment = $shiftAssignmentId
            ? StaffShiftAssignment::query()->find($shiftAssignmentId)
            : StaffShiftAssignment::query()
                ->where('facility_id', $facilityId)
                ->where('staff_member_id', $staffMemberId)
                ->whereDate('shift_date', $workDate)
                ->orderByDesc('id')
                ->first();

        $events = StaffAttendanceEvent::query()
            ->where('facility_id', $facilityId)
            ->where('staff_member_id', $staffMemberId)
            ->whereDate('work_date', $workDate)
            ->when(
                $assignment,
                fn ($query) => $query->where(function ($subQuery) use ($assignment): void {
                    $subQuery
                        ->where('shift_assignment_id', $assignment->id)
                        ->orWhereNull('shift_assignment_id');
                }),
            )
            ->orderBy('occurred_at')
            ->orderBy('id')
            ->get();

        $entry = StaffTimesheetEntry::query()
            ->where('facility_id', $facilityId)
            ->where('staff_member_id', $staffMemberId)
            ->whereDate('work_date', $workDate)
            ->when(
                $assignment,
                fn ($query) => $query->where('shift_assignment_id', $assignment->id),
                fn ($query) => $query->whereNull('shift_assignment_id'),
            )
            ->first() ?? new StaffTimesheetEntry([
                'facility_id' => $facilityId,
                'staff_member_id' => $staffMemberId,
                'shift_assignment_id' => $assignment?->id,
                'work_date' => $workDate,
            ]);

        $clockIn = $events->firstWhere('event_type', StaffAttendanceEvent::TYPE_CLOCK_IN);
        $clockOut = $events->where('event_type', StaffAttendanceEvent::TYPE_CLOCK_OUT)->last();

        $breakMinutes = $this->calculateBreakMinutes($events);
        $actualStartsAt = $clockIn?->occurred_at;
        $actualEndsAt = $clockOut?->occurred_at;

        $plannedStartsAt = $assignment?->starts_at;
        $plannedEndsAt = $assignment?->ends_at;
        $plannedMinutes = $assignment
            ? max(0, (int) $assignment->starts_at->diffInMinutes($assignment->ends_at))
            : 0;

        $workedMinutes = 0;
        $nightMinutes = 0;

        if ($actualStartsAt && $actualEndsAt && $actualEndsAt->greaterThan($actualStartsAt)) {
            $workedMinutes = max(0, (int) $actualStartsAt->diffInMinutes($actualEndsAt) - $breakMinutes);
            $nightMinutes = $this->calculateNightMinutes($actualStartsAt, $actualEndsAt, $breakMinutes);
        }

        $ordinaryMinutes = $plannedMinutes > 0
            ? min($workedMinutes, $plannedMinutes)
            : $workedMinutes;

        $overtimeMinutes = max(0, $workedMinutes - $ordinaryMinutes);
        $absenceMinutes = max(0, $plannedMinutes - $workedMinutes);
        $varianceMinutes = $workedMinutes - $plannedMinutes;

        $approvedAdjustmentDelta = (int) StaffTimesheetAdjustment::query()
            ->where('timesheet_entry_id', $entry->id)
            ->where('status', StaffTimesheetAdjustment::STATUS_APPROVED)
            ->sum('delta_minutes');

        if ($approvedAdjustmentDelta !== 0) {
            $workedMinutes = max(0, $workedMinutes + $approvedAdjustmentDelta);
            $ordinaryMinutes = $plannedMinutes > 0
                ? min($workedMinutes, $plannedMinutes)
                : $workedMinutes;
            $overtimeMinutes = max(0, $workedMinutes - $ordinaryMinutes);
            $absenceMinutes = max(0, $plannedMinutes - $workedMinutes);
            $varianceMinutes = $workedMinutes - $plannedMinutes;
        }

        $anomalies = [];

        if ($events->isNotEmpty() && ! $clockIn) {
            $anomalies[] = 'missing_clock_in';
        }

        if ($clockIn && ! $clockOut) {
            $anomalies[] = 'missing_clock_out';
        }

        if ($assignment === null && $events->isNotEmpty()) {
            $anomalies[] = 'unplanned_work';
        }

        if ($plannedStartsAt && $actualStartsAt && $actualStartsAt->greaterThan($plannedStartsAt)) {
            $anomalies[] = 'late_clock_in';
        }

        if ($plannedEndsAt && $actualEndsAt && $actualEndsAt->lessThan($plannedEndsAt)) {
            $anomalies[] = 'early_clock_out';
        }

        if ($workedMinutes >= 360 && $breakMinutes === 0) {
            $anomalies[] = 'no_break_logged';
        }

        if ($overtimeMinutes > 0) {
            $anomalies[] = 'overtime_detected';
        }

        if ($absenceMinutes > 0 && $plannedMinutes > 0) {
            $anomalies[] = 'absence_detected';
        }

        if ($workedMinutes > self::MAX_DAILY_WORK_MINUTES) {
            $anomalies[] = 'maximum_daily_hours_exceeded';
        }

        $restMinutes = $this->calculateRestMinutesBeforeEntry($entry, $actualStartsAt);
        if ($restMinutes !== null && $restMinutes < self::MIN_REST_MINUTES) {
            $anomalies[] = 'minimum_rest_violation';
        }

        $weeklyWorkedMinutes = $this->calculateWeeklyWorkedMinutes(
            $facilityId,
            $staffMemberId,
            $workDate,
            $entry->id ?: null,
            $workedMinutes
        );

        if ($weeklyWorkedMinutes > self::WEEKLY_WORK_THRESHOLD_MINUTES) {
            $anomalies[] = 'weekly_hours_threshold_exceeded';
        }

        $entry->fill([
            'shift_assignment_id' => $assignment?->id,
            'planned_starts_at' => $plannedStartsAt,
            'planned_ends_at' => $plannedEndsAt,
            'actual_starts_at' => $actualStartsAt,
            'actual_ends_at' => $actualEndsAt,
            'planned_minutes' => $plannedMinutes,
            'worked_minutes' => $workedMinutes,
            'break_minutes' => $breakMinutes,
            'ordinary_minutes' => $ordinaryMinutes,
            'overtime_minutes' => $overtimeMinutes,
            'night_minutes' => $nightMinutes,
            'absence_minutes' => $absenceMinutes,
            'variance_minutes' => $varianceMinutes,
            'status' => $actualEndsAt ? StaffTimesheetEntry::STATUS_COMPUTED : StaffTimesheetEntry::STATUS_DRAFT,
            'anomaly_flags_json' => array_values(array_unique($anomalies)),
        ]);

        $entry->save();

        return $entry->fresh()->load($this->baseRelations());
    }

    public function baseRelations(): array
    {
        return [
            'facility.organization',
            'staffMember.user',
            'staffMember.qualificationLookup',
            'shiftAssignment.shiftTemplate',
            'submittedBy:id,first_name,last_name,email',
            'approvedBy:id,first_name,last_name,email',
            'adjustments.createdBy:id,first_name,last_name,email',
            'adjustments.reviewedBy:id,first_name,last_name,email',
        ];
    }

    private function calculateBreakMinutes(Collection $events): int
    {
        $breakStart = null;
        $minutes = 0;

        foreach ($events as $event) {
            if ($event->event_type === StaffAttendanceEvent::TYPE_BREAK_START) {
                $breakStart = $event->occurred_at;
                continue;
            }

            if ($event->event_type === StaffAttendanceEvent::TYPE_BREAK_END && $breakStart && $event->occurred_at->greaterThan($breakStart)) {
                $minutes += $breakStart->diffInMinutes($event->occurred_at);
                $breakStart = null;
            }
        }

        return max(0, $minutes);
    }

    private function calculateNightMinutes(Carbon $start, Carbon $end, int $breakMinutes): int
    {
        $cursor = $start->copy();
        $minutes = 0;

        while ($cursor->lt($end)) {
            $next = $cursor->copy()->addMinute();
            $hour = (int) $cursor->format('H');

            if ($hour >= 22 || $hour < 6) {
                $minutes++;
            }

            $cursor = $next;
        }

        return max(0, $minutes - min($minutes, $breakMinutes));
    }

    private function calculateRestMinutesBeforeEntry(StaffTimesheetEntry $entry, ?Carbon $actualStartsAt): ?int
    {
        if (! $actualStartsAt) {
            return null;
        }

        $previousEntry = StaffTimesheetEntry::query()
            ->where('facility_id', $entry->facility_id)
            ->where('staff_member_id', $entry->staff_member_id)
            ->whereNotNull('actual_ends_at')
            ->where('id', '!=', $entry->id ?: 0)
            ->where('actual_ends_at', '<', $actualStartsAt)
            ->orderByDesc('actual_ends_at')
            ->orderByDesc('id')
            ->first();

        if (! $previousEntry?->actual_ends_at) {
            return null;
        }

        return (int) $previousEntry->actual_ends_at->diffInMinutes($actualStartsAt);
    }

    private function calculateWeeklyWorkedMinutes(
        int $facilityId,
        int $staffMemberId,
        string $workDate,
        ?int $currentEntryId,
        int $currentWorkedMinutes,
    ): int {
        $windowStart = Carbon::parse($workDate)->subDays(6)->toDateString();

        $historicalWorkedMinutes = (int) StaffTimesheetEntry::query()
            ->where('facility_id', $facilityId)
            ->where('staff_member_id', $staffMemberId)
            ->whereBetween('work_date', [$windowStart, $workDate])
            ->when($currentEntryId, fn ($query) => $query->where('id', '!=', $currentEntryId))
            ->sum('worked_minutes');

        return $historicalWorkedMinutes + max(0, $currentWorkedMinutes);
    }
}
