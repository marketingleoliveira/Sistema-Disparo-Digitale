
import { createFileRoute, redirect }
  from "@tanstack/react-router";
import { getDisparoSession }
  from "@/lib/disparo-auth.functions";
import { OpenersReportPage }
  from "@/components/analytics/OpenersReportPage";

export const Route=
  createFileRoute("/_authenticated/reports_/opens")({
    beforeLoad:async()=>{
      const user=await getDisparoSession();
      if(
        !user ||
        !["Desenvolvedor","Diretoria","Gerência"]
          .includes(user.role)
      ){
        throw redirect({to:"/reports"});
      }
    },
    component:OpenersReportPage
  });
