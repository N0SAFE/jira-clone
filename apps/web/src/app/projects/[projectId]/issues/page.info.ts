import { z } from "zod";

export const Route = {
  name: "ProjectsProjectIdIssues",
  params: z.object({
    projectId: z.string(),
  })
};

