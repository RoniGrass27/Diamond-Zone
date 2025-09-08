export const Core = {
    InvokeLLM: async (payload) => {
      const response = await fetch('/api/invoke-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("LLM invocation failed");
      return response.json();
    },
  
    SendEmail: async (details) => {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      if (!response.ok) throw new Error("Send email failed");
      return response.json();
    },
  
    UploadFile: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error("File upload failed");
      return response.json();
    },
  
    GenerateImage: async (prompt) => {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("Image generation failed");
      return response.json();
    },
  
    ExtractDataFromUploadedFile: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch('/api/extract-data', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error("Data extraction failed");
      return response.json();
    }
  };
  