import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request:Request){
 const supabase=await createServerSupabaseClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const day=Number(new URL(request.url).searchParams.get("day")??0);
 const {data,error}=await supabase.from("daily_report_questions").select("id,marathon_day,question,field_key,field_type,required,sort_order").eq("active",true).order("sort_order");
 if(error)return NextResponse.json({error:"Report сұрақтарын жүктеу сәтсіз."},{status:500});
 return NextResponse.json({questions:(data??[]).filter(item=>!item.marathon_day||Number(item.marathon_day)===day)});
}
