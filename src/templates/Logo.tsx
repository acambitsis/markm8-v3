import Image from 'next/image';

export const Logo = (props: {
  isTextHidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = {
    sm: { width: 100, height: 32 },
    md: { width: 140, height: 44 },
    lg: { width: 200, height: 64 },
  };

  const { width, height } = sizes[props.size || 'md'];

  return (
    <Image
      src="/assets/images/markm8-logo.png"
      alt="MarkM8"
      width={width}
      height={height}
      className="h-auto"
      priority
    />
  );
};
