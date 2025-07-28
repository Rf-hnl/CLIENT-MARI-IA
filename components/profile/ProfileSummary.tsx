'use client';

import { User } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import UserAvatar from './UserAvatar';
import UserInfo from './UserInfo';
import VerificationStatus from './VerificationStatus';

interface ProfileSummaryProps {
  user: User;
}

export default function ProfileSummary({ user }: ProfileSummaryProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <UserAvatar user={user} size="lg" className="mx-auto" />
          <UserInfo user={user} nameSize="lg" />
          <VerificationStatus isVerified={user.emailVerified} />
        </div>
      </CardContent>
    </Card>
  );
}