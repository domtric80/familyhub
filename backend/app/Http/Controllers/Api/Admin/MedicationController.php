<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\Medication;
use Illuminate\Http\{JsonResponse,Request};
use Illuminate\Validation\Rule;
class MedicationController extends Controller
{
 public function index():JsonResponse{return response()->json(Medication::query()->withCount('plans')->orderBy('name')->get());}
 public function store(Request $r):JsonResponse{$d=$this->validateData($r);return response()->json(Medication::query()->create($d),201);}
 public function update(Request $r,Medication $medication):JsonResponse{$medication->update($this->validateData($r,$medication));return response()->json($medication->fresh()->loadCount('plans'));}
 public function destroy(Medication $medication):JsonResponse{abort_if($medication->plans()->exists(),409,'Farmaco già utilizzato: disattivarlo invece di eliminarlo.');$medication->delete();return response()->json(status:204);}
 private function validateData(Request $r,?Medication $m=null):array{return $r->validate(['code'=>['required','string','max:80','regex:/^[A-Z0-9_]+$/',Rule::unique('medications','code')->ignore($m?->id)],'name'=>['required','string','max:180'],'active_ingredient'=>['nullable','string','max:180'],'is_active'=>['sometimes','boolean']]);}
}
