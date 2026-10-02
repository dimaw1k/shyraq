import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase=await createServerSupabaseClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});

  const now=new Date();
  const horizon=new Date(now.getTime()+24*60*60*1000);
  const [{data:tasks},{data:lessons},{data:tickets}]=await Promise.all([
    supabase.from("tasks").select("id,title,starts_at,deadline").eq("active",true).or("starts_at.not.is.null,deadline.not.is.null").limit(50),
    supabase.from("lessons").select("id,title,starts_at").eq("published",true).not("starts_at","is",null).limit(50),
    supabase.from("support_tickets").select("id,subject,status,updated_at").eq("student_id",user.id).order("updated_at",{ascending:false}).limit(10),
  ]);

  const notifications:Array<{id:string;title:string;message:string;href:string}>=[];
  for(const task of tasks??[]){
    if(task.starts_at){
      const start=new Date(task.starts_at);
      if(start>=now&&start<=horizon)notifications.push({id:"task-open-"+task.id,title:"Тапсырма жақында ашылады",message:task.title+" · "+start.toLocaleString("kk-KZ"),href:"/tasks/"+task.id});
    }
    if(task.deadline){
      const deadline=new Date(task.deadline);
      if(deadline>=now&&deadline<=horizon)notifications.push({id:"task-deadline-"+task.id,title:"Deadline жақындады",message:task.title+" · "+deadline.toLocaleString("kk-KZ"),href:"/tasks/"+task.id});
    }
  }
  for(const lesson of lessons??[]){
    const start=new Date(lesson.starts_at!);
    if(start>=now&&start<=horizon)notifications.push({id:"lesson-open-"+lesson.id,title:"Сабақ жақында ашылады",message:lesson.title+" · "+start.toLocaleString("kk-KZ"),href:"/lessons/"+lesson.id});
  }
  for(const ticket of tickets??[]){
    notifications.push({id:"support-"+ticket.id,title:"Support жаңартуы",message:ticket.subject+" · "+ticket.status,href:"/settings"});
  }

  return NextResponse.json({notifications:notifications.slice(0,20)});
}
