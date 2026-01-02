import ScenarioSelector from '../ScenarioSelector';

export default function ScenarioSelectorExample() {
  return (
    <ScenarioSelector 
      onSelectScenario={(id) => console.log('Scenario selected:', id)}
    />
  );
}
