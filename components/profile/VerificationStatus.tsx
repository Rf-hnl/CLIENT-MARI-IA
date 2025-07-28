'use client';

interface VerificationStatusProps {
  isVerified: boolean;
  className?: string;
}

export default function VerificationStatus({ isVerified, className = '' }: VerificationStatusProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
      <span className="text-xs text-muted-foreground">
        {isVerified ? 'Cuenta Verificada' : 'Verificación Pendiente'}
      </span>
    </div>
  );
}