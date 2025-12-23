import { GraduationCap } from 'lucide-react';

import { AppConfig } from '@/utils/AppConfig';

export const Logo = (props: {
  isTextHidden?: boolean;
}) => (
  <div className="flex items-center gap-2 text-xl font-bold">
    <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500 text-white">
      <GraduationCap className="size-5" />
    </div>
    {!props.isTextHidden && (
      <span className="text-gradient">{AppConfig.name}</span>
    )}
  </div>
);
