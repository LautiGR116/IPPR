import { RESPONSE_OPTIONS } from "@/lib/ippr-content";

export type SerializedItem = {
  id: string;
  key: string;
  prompt: string;
  order: number;
};

export type SerializedModule = {
  id: string;
  key: string;
  title: string;
  icon: string | null;
  order: number;
  items: SerializedItem[];
};

export type SerializedSession = {
  id: string;
  status: "ACTIVE" | "COMPLETED";
  currentModuleOrder: number;
  startedAt: string;
  completedAt: string | null;
  participant: {
    id: string;
    code: string;
    name: string;
  };
  test: {
    id: string;
    slug: string;
    name: string;
    version: string;
    modules: SerializedModule[];
  };
  responses: Record<
    string,
    {
      category: ResponseCategory;
      numericValue: number;
      answeredAt: string;
    }
  >;
  topPicks: Array<{
    moduleId: string;
    itemId: string;
    rank: number;
  }>;
  progress: Record<
    string,
    {
      status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
      answeredCount: number;
      topCount: number;
      completedAt: string | null;
    }
  >;
};

export type ResponseCategory = (typeof RESPONSE_OPTIONS)[number]["category"];
