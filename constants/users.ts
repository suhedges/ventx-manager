import { User } from '@/types';

// Hardcoded users for authentication
// To add new users, add them to this array
export const AUTHORIZED_USERS: Array<{
  email: string;
  password: string;
  role: User['role'];
}> = [
  {
    email: 'sethh@tristate-bearing.com',
    password: 'Knight_88@',
    role: 'admin',
  },
  {
    email: 'jaredh@tristate-bearing.com',
    password: 'Secret123',
    role: 'admin',
  },
  // Add new users here:
  // {
  //   email: 'newuser@example.com',
  //   password: 'password123',
  //   role: 'manager',
  // },
];
