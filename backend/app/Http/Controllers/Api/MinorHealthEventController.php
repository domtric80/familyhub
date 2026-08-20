<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{DocumentIssuer, Minor, MinorDocument, MinorHealthEvent, MinorHealthEventCategory, MinorHealthEventStatus, StaffMember};
use App\Services\{AuditLogService, MinorAccessService, MinorHistoryService};
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\{JsonResponse, Request};

class MinorHealthEventController extends Controller
{
    public function __construct(private readonly MinorAccessService $access = new MinorAccessService(), private readonly MinorHistoryService $history = new MinorHistoryService(), private readonly AuditLogService $audit = new AuditLogService()) {}

    public function options(Request $request): JsonResponse
    {
        $data = $request->validate(['facility_id' => ['required', 'integer', 'exists:facilities,id']]);
        $facilityId = (int) $data['facility_id'];
        abort_unless($request->user()->hasPermission('minor_health.read', $facilityId), 403, 'Accesso sanitario non consentito per questa struttura.');
        return response()->json(['categories'=>MinorHealthEventCategory::where('is_active',true)->orderBy('sort_order')->get(),'statuses'=>MinorHealthEventStatus::orderBy('sort_order')->get(),'providers'=>StaffMember::where('facility_id',$facilityId)->whereIn('qualification_code',['PEDIATRA','MEDICO_BASE'])->where('status_code','ACTIVE')->orderBy('last_name')->get(),'health_authorities'=>DocumentIssuer::where('is_active',true)->where('code','ASL')->orderBy('name')->get()]);
    }

    public function index(Request $request): JsonResponse
    {
        $query=MinorHealthEvent::with($this->relations())->when($request->filled('facility_id'),fn(Builder $query)=>$query->where('facility_id',$request->integer('facility_id')))->when($request->filled('minor_id'),fn(Builder $query)=>$query->where('minor_id',$request->integer('minor_id')))->when($request->filled('category_code'),fn(Builder $query)=>$query->whereHas('category',fn(Builder $category)=>$category->where('code',$request->string('category_code'))))->when($request->filled('status_code'),fn(Builder $query)=>$query->whereHas('status',fn(Builder $status)=>$status->where('code',$request->string('status_code'))))->whereHas('minor',fn(Builder $query)=>$this->access->scopeVisibleMinorsForUser($query,$request->user()))->orderByDesc('scheduled_at');
        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data=$this->validateEvent($request);$minor=Minor::findOrFail($data['minor_id']);$this->authorizeMinor($request,$minor,'minor_health.create');$this->assertRelations($minor,$data);$this->assertStatusConsistency($data);$event=MinorHealthEvent::create([...$data,'facility_id'=>$minor->facility_id,'created_by_user_id'=>$request->user()->id,'updated_by_user_id'=>$request->user()->id]);$this->record($request,$event,'create','ha creato un evento sanitario');return response()->json($event->load($this->relations()),201);
    }

    public function show(Request $request, MinorHealthEvent $event): JsonResponse
    {
        $this->authorizeMinor($request,$event->minor,'minor_health.read');return response()->json($event->load($this->relations()));
    }

    public function update(Request $request, MinorHealthEvent $event): JsonResponse
    {
        $this->authorizeMinor($request,$event->minor,'minor_health.update');$data=$this->validateEvent($request,true);$merged=[...$event->only(['category_id','status_id','scheduled_at','occurred_at','provider_staff_member_id','health_authority_document_issuer_id','linked_minor_document_id','reason','clinical_findings','outcome_notes','follow_up_at']),...$data];$this->assertRelations($event->minor,$merged);$this->assertStatusConsistency($merged);$old=$this->auditSnapshot($event);$event->update([...$data,'updated_by_user_id'=>$request->user()->id]);$fresh=$event->fresh();$this->record($request,$fresh,'update','ha aggiornato un evento sanitario',$old,$this->auditSnapshot($fresh));return response()->json($fresh->load($this->relations()));
    }

    public function alerts(Request $request): JsonResponse
    {
        $days=min(180,max(1,$request->integer('days',30)));$limit=now()->addDays($days);$events=MinorHealthEvent::with($this->relations())->when($request->filled('facility_id'),fn(Builder $query)=>$query->where('facility_id',$request->integer('facility_id')))->whereHas('minor',fn(Builder $query)=>$this->access->scopeVisibleMinorsForUser($query,$request->user()))->where(function(Builder $query)use($limit):void{$query->where(function(Builder $scheduled)use($limit):void{$scheduled->whereHas('status',fn(Builder $status)=>$status->where('code','SCHEDULED'))->whereBetween('scheduled_at',[now(),$limit]);})->orWhereBetween('follow_up_at',[now(),$limit]);})->orderBy('scheduled_at')->get();return response()->json($events);
    }

    private function validateEvent(Request $request,bool $partial=false):array
    {
        $required=$partial?'sometimes':'required';return $request->validate(['minor_id'=>[$partial?'prohibited':'required','integer','exists:minors,id'],'category_id'=>[$required,'integer','exists:minor_health_event_categories,id'],'status_id'=>[$required,'integer','exists:minor_health_event_statuses,id'],'scheduled_at'=>[$required,'date'],'occurred_at'=>['nullable','date'],'provider_staff_member_id'=>['nullable','integer','exists:staff_members,id'],'health_authority_document_issuer_id'=>['nullable','integer','exists:document_issuers,id'],'linked_minor_document_id'=>['nullable','integer','exists:minor_documents,id'],'reason'=>['nullable','string','max:10000'],'clinical_findings'=>['nullable','string','max:20000'],'outcome_notes'=>['nullable','string','max:10000'],'follow_up_at'=>['nullable','date']]);
    }

    private function assertRelations(Minor $minor,array $data):void
    {
        if(!empty($data['provider_staff_member_id']))abort_unless(StaffMember::whereKey($data['provider_staff_member_id'])->where('facility_id',$minor->facility_id)->whereIn('qualification_code',['PEDIATRA','MEDICO_BASE'])->exists(),422,'Professionista sanitario non valido per la struttura.');if(!empty($data['health_authority_document_issuer_id']))abort_unless(DocumentIssuer::whereKey($data['health_authority_document_issuer_id'])->where('is_active',true)->where('code','ASL')->exists(),422,'Ente sanitario non valido.');if(!empty($data['linked_minor_document_id']))abort_unless(MinorDocument::whereKey($data['linked_minor_document_id'])->where('minor_id',$minor->id)->exists(),422,'Documento non appartenente al minore.');
    }

    private function assertStatusConsistency(array $data):void
    {
        $status=MinorHealthEventStatus::findOrFail($data['status_id']);if($status->code==='COMPLETED')abort_if(empty($data['occurred_at']),422,'La data effettiva è obbligatoria per un evento completato.');if($status->code==='CANCELLED')abort_if(!empty($data['occurred_at']),422,'Un evento annullato non può avere una data effettiva.');
    }

    private function authorizeMinor(Request $request,Minor $minor,string $permission):void { abort_unless($this->access->canAccessMinor($request->user(),$minor,$permission),403,'Accesso sanitario non consentito per questo minore.'); }
    private function relations():array { return ['minor.minorStatus','category','status','provider.qualificationLookup','healthAuthority','linkedDocument.documentType','createdBy:id,first_name,last_name,email','updatedBy:id,first_name,last_name,email']; }
    private function auditSnapshot(MinorHealthEvent $event):array { return $event->only(['category_id','status_id','scheduled_at','occurred_at','provider_staff_member_id','health_authority_document_issuer_id','linked_minor_document_id','follow_up_at']); }

    private function record(Request $request,MinorHealthEvent $event,string $action,string $verb,?array $old=null,?array $new=null):void
    {
        $event->loadMissing(['minor','category']);$summary=$this->audit->resolveActorDisplayName($request->user())." $verb ({$event->category->name}) per {$event->minor->publicDisplayName()}.";$this->history->record($event->minor,'minor_health_event_'.$action,$request->user(),['minor_health_event_id'=>$event->id,'category_code'=>$event->category->code,'operation_summary'=>$summary]);$this->audit->record($request,['facility_id'=>$event->facility_id,'minor_id'=>$event->minor_id,'action'=>$action,'resource_type'=>'minor_health_event','resource_id'=>(string)$event->id,'resource_label'=>$event->category->name,'operation_summary'=>$summary,'old_values_json'=>$old,'new_values_json'=>$new]);$this->audit->markHandled($request);
    }
}
