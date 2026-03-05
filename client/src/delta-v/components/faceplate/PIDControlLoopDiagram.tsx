import pidDiagram from '@assets/image_1772638428798.png';

const PIDControlLoopDiagram = () => {
  return (
    <div className="w-full">
      <img 
        src={pidDiagram} 
        alt="PID Control Loop Block Diagram for Sulfur Flow Controller FIC-2602"
        className="w-full h-auto rounded-lg"
        style={{ maxHeight: '400px', objectFit: 'contain' }}
      />
    </div>
  );
};

export default PIDControlLoopDiagram;
