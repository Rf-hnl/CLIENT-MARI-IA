'use client';

import { User } from 'firebase/auth';

interface UserInfoProps {
  user: User;
  showEmail?: boolean;
  nameSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

const nameSizeClasses = {
  sm: 'text-sm font-medium',
  md: 'text-lg font-semibold',
  lg: 'text-xl font-bold'
};

export default function UserInfo({ user, showEmail = true, nameSize = 'md', className = '' }: UserInfoProps) {
  return (
    <div className={className}>
      <h3 className={nameSizeClasses[nameSize]}>
        {user.displayName || 'Sin nombre configurado'}
      </h3>
      {showEmail && (
        <p className="text-sm text-muted-foreground">
          {user.email}
        </p>
      )}
    </div>
  );
}