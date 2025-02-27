import { z } from "zod";

export const Route = {
  name: "ProjectsProjectIdTicketsTicketId",
  params: z.object({
    projectId: z.number(),
    ticketId: z.number(),
  })
};