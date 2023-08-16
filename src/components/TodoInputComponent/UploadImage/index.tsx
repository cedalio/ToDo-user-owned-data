import { useMemo } from 'react';

import styles from './styles.module.css';

interface Props {
  image: File | null;
  onImageSelect: (image: File) => void;
}

function UploadImage({ image, onImageSelect }: Props) {
  const handleChangeImage = ({ target: { validity, files } }: React.ChangeEvent<HTMLInputElement>) => {
    if (validity.valid && files) {
      const file = files[0];
      onImageSelect(file);
    }
  };

  const imageUrl = useMemo(() => image && URL.createObjectURL(image), [image]);

  return (
    <div className={styles.imagePlaceholder}>
      <label className={styles.label} htmlFor="image-upload">
        {imageUrl ? <img src={imageUrl} alt="Todo" className={styles.image} /> : 'Upload Image'}
      </label>
      <input
        id="image-upload"
        style={{ display: 'none' }}
        type="file"
        name="file"
        onChange={handleChangeImage}
        accept="image/png, image/gif, image/jpeg"
      />
    </div>
  );
}

export default UploadImage;
