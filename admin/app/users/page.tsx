import { getUsers } from '@/lib/data';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await getUsers();
  
  return <UsersClient users={users} />;
}
