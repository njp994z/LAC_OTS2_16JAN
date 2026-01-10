import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadPythonFile, getPythonCodeTemplates, FACEPLATE_PYTHON_MAP } from '@/delta-v/lib/pythonTemplates';
import { useToast } from '@/hooks/use-toast';
import { SecondaryControllerConfig, defaultSecondaryConfig } from '@/delta-v/types/secondaryController';
import { useMemo } from 'react';

interface PythonDownloadButtonProps {
  fileName: string;
  code: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const PythonDownloadButton = ({
  fileName,
  code,
  size = 'sm',
  className = '',
}: PythonDownloadButtonProps) => {
  const { toast } = useToast();

  const handleDownload = () => {
    downloadPythonFile(fileName, code);
    toast({
      title: 'Downloaded',
      description: `${fileName} saved to downloads`,
    });
  };

  return (
    <Button
      onClick={handleDownload}
      size={size}
      className={`bg-blue-600 hover:bg-blue-500 text-white gap-2 ${className}`}
      data-testid={`button-download-${fileName.replace('.py', '')}`}
    >
      <Download size={16} />
      Download .py
    </Button>
  );
};

interface FaceplateDownloadButtonsProps {
  faceplateId: '3A' | '3B' | '3C' | '3D' | '3E' | '3F';
  config?: SecondaryControllerConfig;
  className?: string;
}

export const FaceplateDownloadButtons = ({
  faceplateId,
  config = defaultSecondaryConfig,
  className = '',
}: FaceplateDownloadButtonsProps) => {
  const { toast } = useToast();
  
  const templates = useMemo(() => getPythonCodeTemplates(config), [config]);
  const fileNames = FACEPLATE_PYTHON_MAP[faceplateId];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {fileNames.map((fileName) => {
        const template = templates[fileName];
        return (
          <Button
            key={fileName}
            onClick={() => {
              downloadPythonFile(fileName, template.code);
              toast({
                title: 'Downloaded',
                description: `${fileName} saved to downloads`,
              });
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
            data-testid={`button-download-${fileName.replace('.py', '')}`}
          >
            <Download size={14} />
            {fileName}
          </Button>
        );
      })}
    </div>
  );
};

export default PythonDownloadButton;
