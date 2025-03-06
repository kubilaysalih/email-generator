import React, { useEffect, useRef } from 'react';
import { MjmlEditorProps } from '../types';

const MjmlEditor: React.FC<MjmlEditorProps> = ({
  mjmlCode,
  isLoading,
  onMjmlCodeChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update the textarea when mjmlCode changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = mjmlCode;
    }
  }, [mjmlCode]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMjmlCodeChange(e.target.value);
  };

  return (
    <div className="code-section">
      <h2>MJML Kodu</h2>
      <textarea
        ref={textareaRef}
        className="code-editor"
        onChange={handleChange}
        disabled={isLoading}
        defaultValue={mjmlCode}
      />
    </div>
  );
};

export default MjmlEditor;