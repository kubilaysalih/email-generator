/**
 * Converts a File object to base64 string
 * @param file - The file to convert
 * @returns Promise resolving to base64 string
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Get only the base64 part without the prefix
      const base64String = reader.result as string;
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validates an image file for size and type
 * @param file - The file to validate
 * @returns Object containing validation result and error message
 */
export const validateImageFile = (file: File): { isValid: boolean; message?: string } => {
  // Check if it's an image file
  if (!file.type.startsWith('image/')) {
    return { isValid: false, message: 'Lütfen sadece resim dosyaları yükleyin' };
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, message: 'Dosya boyutu 5MB\'dan küçük olmalıdır' };
  }

  return { isValid: true };
};