import { useEffect, useState } from "react";

const ImageWithFallback = ({
  src,
  fallback = "/assets/hero-background.png",
  alt = "",
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src || fallback);

  useEffect(() => {
    setImageSrc(src || fallback);
  }, [src, fallback]);

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      onError={(event) => {
        if (imageSrc !== fallback) {
          setImageSrc(fallback);
          return;
        }
        props.onError?.(event);
      }}
    />
  );
};

export default ImageWithFallback;
