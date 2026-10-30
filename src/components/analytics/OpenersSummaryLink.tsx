
import * as React from "react";
import { getIaProspectingOpenCount }
  from "@/lib/disparo-open-report.functions";

export function OpenersSummaryLink(){
  const [count,setCount]=React.useState("—");

  React.useEffect(()=>{
    let active=true;
    getIaProspectingOpenCount()
      .then(value=>{
        if(active)setCount(value.toLocaleString("pt-BR"));
      })
      .catch(()=>{
        if(active)setCount("—");
      });
    return ()=>{active=false};
  },[]);

  return <span>{count}</span>;
}
