import { cookies } from 'next/headers';
import TicketProjectListUI from './TicketProjectListUI';
import directus from '@/lib/directus';

async function getTicketsAndProjects() {
  try {
    const currentUser = await directus.DirectusUser.Me.read();
    
    const [tickets, projects] = await Promise.all([
      directus.Tickets.query({
        filter: {
          user_created: {
            _eq: currentUser.id
          }
        },
        fields: ['*', 'date_created', 'date_updated', 'priority', 'status', 'project']
      }),
      directus.Projects.query({
        filter: {
          user_created: {
            _contains: currentUser.id
          }
        },
        fields: ['*', 'date_created', 'date_updated', 'status']
      })
    ]);

    return {
      tickets: tickets || [],
      projects: projects || []
    };
  } catch (error) {
    console.error('Error fetching tickets and projects:', error);
    return {
      tickets: [],
      projects: []
    };
  }
}

export default async function TicketProjectList() {
  const { tickets, projects } = await getTicketsAndProjects();
  
  return <TicketProjectListUI tickets={tickets} projects={projects} />;
}