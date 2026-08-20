<?php
namespace App\Http\Requests\Admin;
use Illuminate\Foundation\Http\FormRequest;
class StoreStaffEvaluationRequest extends FormRequest { public function authorize(): bool { return true; } public function rules(): array { return ['period_start'=>['required','date'],'period_end'=>['required','date','after_or_equal:period_start'],'evaluation_date'=>['required','date'],'summary'=>['nullable','string','max:5000'],'scores'=>['required','array','min:1'],'scores.*.criterion_id'=>['required','integer','distinct','exists:staff_evaluation_criteria,id'],'scores.*.score'=>['required','integer','min:1','max:5'],'scores.*.notes'=>['nullable','string','max:2000']]; } }
