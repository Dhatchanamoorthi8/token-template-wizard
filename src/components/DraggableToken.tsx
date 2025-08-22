
import React from 'react';
import { useDrag } from 'react-dnd';
import { cn } from '@/lib/utils';

interface DraggableTokenProps {
  token: string;
  disabled: boolean;
}

const DraggableToken: React.FC<DraggableTokenProps> = ({ token, disabled }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "TOKEN",
      item: { token },
      canDrag: !disabled,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [disabled]
  );

  return (
    <div
      ref={drag}
      className={cn(
        "token-drag",
        disabled ? "token-drag-disabled" : "token-drag-default",
        isDragging && "opacity-50 scale-95"
      )}
      style={{
        transform: isDragging ? 'rotate(5deg)' : 'none',
      }}
    >
      <span className="font-mono text-xs">{`{{${token}}}`}</span>
    </div>
  );
};

export default DraggableToken;
