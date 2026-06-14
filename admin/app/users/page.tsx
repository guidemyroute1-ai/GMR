import { getUsers } from '@/lib/data';
import UsersClient from './UsersClient';

export const revalidate = 60; // revalidate at most every 60 seconds

export default async function UsersPage() {
  const users = await getUsers();
  
  return <UsersClient users={users} />;
}
