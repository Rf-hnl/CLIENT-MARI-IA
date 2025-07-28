'use client';

import { User } from 'firebase/auth';
import UserAvatar from './UserAvatar';
import UserInfo from './UserInfo';

interface ProfileDisplayProps {
  user: User;
}

export default function ProfileDisplay({ user }: ProfileDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <UserAvatar user={user} size="md" />
        <UserInfo user={user} nameSize="md" />
      </div>
      
      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Haz clic en "Editar" para actualizar tu información personal
        </p>
      </div>
    </div>
  );
}