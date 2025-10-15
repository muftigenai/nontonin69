import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const StarRatingInput = ({ value, onChange, disabled = false }: StarRatingInputProps) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-6 w-6 cursor-pointer transition-colors",
            (hoverValue || value) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => !disabled && setHoverValue(0)}
        />
      ))}
    </div>
  );
};

export default StarRatingInput;