import { ReactNode } from "react";

export type NodeType = "trigger" | "action" | "condition";

export interface AutomationNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  icon?: ReactNode;
  config?: any;
  nextIds?: string[]; // Para fluxos lineares ou condições (Yes/No)
  position?: { x: number; y: number };
}

export interface Automation {
  id: string;
  name: string;
  status: "active" | "inactive" | "draft";
  trigger: string;
  activeContacts: number;
  lastRun: string;
  nodes: AutomationNode[];
}
