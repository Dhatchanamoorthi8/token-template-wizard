
import React from 'react';
import { useDrop } from 'react-dnd';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const DropTargetArea = ({ 
  template, 
  setTemplate, 
  onTokenDrop 
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "TOKEN",
    drop: async (item) => {
      const placeholder = `{{${item.token}}}`;
      const normalized = template.replace(/\s+/g, "");
      const regex = new RegExp(`{{${item.token}}}`, "g");
      const exists = regex.test(normalized);
      
      if (exists) {
        alert(`Token '${placeholder}' already exists in the template.`);
        return;
      }
      
      const value = await onTokenDrop(item.token);
      if (value === null) return;
      setTemplate((prev) => prev + placeholder);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const onChangeToken = (value) => {
    setTemplate(value);
  };

  return (
    <div 
      ref={drop}
      className={cn(
        "drop-zone",
        isOver ? "drop-zone-active" : "drop-zone-inactive"
      )}
    >
      <Textarea
        value={template}
        onChange={(e) => onChangeToken(e.target.value)}
        rows={4}
        placeholder="Drop tokens here or type manually... Use {{tokenName}} format"
        className={cn(
          "w-full resize-none border-0 bg-transparent focus:ring-0 font-mono text-sm",
          isOver && "bg-primary/5"
        )}
      />
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl pointer-events-none">
          <span className="text-primary font-medium">Drop token here</span>
        </div>
      )}
    </div>
  );
};

export default DropTargetArea;
