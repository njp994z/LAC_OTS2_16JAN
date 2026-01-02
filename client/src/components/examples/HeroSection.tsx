import HeroSection from '../HeroSection';

export default function HeroSectionExample() {
  return (
    <HeroSection 
      onViewDemo={() => console.log('View demo clicked')}
      onLearnMore={() => console.log('Learn more clicked')}
    />
  );
}
