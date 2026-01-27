import pidDiagram from '@assets/image_1769493294638.png';

const PIDControlLoopDiagram = () => {
  return (
    <div className="w-full">
      <img 
        src={pidDiagram} 
        alt="PID Control Loop Block Diagram for Sulfur Flow Controller"
        className="w-full h-auto rounded-lg"
        style={{ maxHeight: '400px', objectFit: 'contain' }}
      />
    </div>
  );
};

export default PIDControlLoopDiagram;
