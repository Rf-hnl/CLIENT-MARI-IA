'use client';

import { User } from 'firebase/auth';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12 text-sm',
  md: 'w-16 h-16 text-xl', 
  lg: 'w-20 h-20 text-2xl'
};

export default function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const initials = user.displayName?.charAt(0) || user.email?.charAt(0) || 'U';
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}>
      {initials}
    </div>
  );
}