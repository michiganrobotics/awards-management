'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function NavLink({ href, children, icon }: NavLinkProps) {
  const pathname = usePathname();
  
  // Check if current path matches the link
  // For root path, only match exactly
  // For other paths, match if pathname starts with href
  const isActive = href === '/' 
    ? pathname === '/' 
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className="cursor-pointer">
      <Button 
        variant={isActive ? 'default' : 'outline'}
        className={cn(
          isActive && 'bg-primary text-primary-foreground font-semibold shadow-md ring-1 ring-primary/30'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {icon}
        {children}
      </Button>
    </Link>
  );
}
