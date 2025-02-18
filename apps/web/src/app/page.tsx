import TicketProjectList from '@/components/TicketProjectList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  return (
    <main className="min-h-screen bg-background">
      <TicketProjectList />
    </main>
  );
}
